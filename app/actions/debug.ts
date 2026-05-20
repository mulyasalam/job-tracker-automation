"use server";

import { getCurrentUser } from "./session";
import { db } from "@/db/client";
import { users, accounts, applications, emails } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { google } from "googleapis";
import { parseEmail } from "@/lib/parser";

export type DebugResult = {
  ok: boolean;
  error?: string;
  user?: { id: string; email: string; lastSyncAt: string | null };
  oauth?: { hasAccessToken: boolean; hasRefreshToken: boolean; scope: string | null; expiresAt: string | null };
  gmail?: { profileEmail: string | null; totalMessages: number | null };
  search?: { query: string; matched: number; samples: Array<{ subject: string | null; from: string | null; date: string | null; parsed?: { isJobRelated: boolean; status: string; company: string | null; confidence: number; reasoning: string } }> };
  db?: { applications: number; emails: number };
};

export async function debugSync(): Promise<DebugResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "not authenticated" };

    const [userRow] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
    const [account] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.userId, user.id), eq(accounts.providerId, "google")))
      .limit(1);

    const appCount = (await db.select().from(applications).where(eq(applications.userId, user.id))).length;
    const emailCount = (await db.select().from(emails).where(eq(emails.userId, user.id))).length;

    const result: DebugResult = {
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        lastSyncAt: userRow?.lastSyncAt?.toISOString() ?? null,
      },
      oauth: {
        hasAccessToken: !!account?.accessToken,
        hasRefreshToken: !!account?.refreshToken,
        scope: account?.scope ?? null,
        expiresAt: account?.accessTokenExpiresAt?.toISOString() ?? null,
      },
      db: { applications: appCount, emails: emailCount },
    };

    if (!account?.accessToken) {
      result.error = "no access token — sign out and sign in again to grant Gmail scope";
      return result;
    }

    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );
    client.setCredentials({
      access_token: account.accessToken,
      refresh_token: account.refreshToken ?? undefined,
      expiry_date: account.accessTokenExpiresAt?.getTime(),
    });

    const gmail = google.gmail({ version: "v1", auth: client });

    let profileEmail: string | null = null;
    let totalMessages: number | null = null;
    try {
      const profile = await gmail.users.getProfile({ userId: "me" });
      profileEmail = profile.data.emailAddress ?? null;
      totalMessages = profile.data.messagesTotal ?? null;
    } catch (err) {
      result.error = `Gmail API call failed: ${(err as Error).message}`;
      return result;
    }
    result.gmail = { profileEmail, totalMessages };

    const QUERIES: { label: string; q: string }[] = [
      { label: "narrow (current)", q: '(subject:"Bewerbung" OR subject:"Vorstellungsgespräch" OR subject:"application" OR subject:"interview" OR subject:"Einladung" OR subject:"Eingangsbestätigung" OR subject:"Absage" OR subject:"Zusage")' },
      { label: "very broad", q: '(Bewerbung OR Vorstellungsgespräch OR Stelle OR application OR interview OR recruiter OR position OR Stellenangebot)' },
    ];

    for (const variant of QUERIES) {
      try {
        const list = await gmail.users.messages.list({
          userId: "me",
          q: `${variant.q} newer_than:180d`,
          maxResults: 10,
        });
        const ids = list.data.messages ?? [];

        const samples: NonNullable<DebugResult["search"]>["samples"] = [];
        for (const m of ids.slice(0, 5)) {
          if (!m.id) continue;
          const msg = await gmail.users.messages.get({ userId: "me", id: m.id, format: "metadata", metadataHeaders: ["Subject", "From", "Date"] });
          const headers = msg.data.payload?.headers ?? [];
          const get = (n: string) => headers.find((h) => h.name?.toLowerCase() === n.toLowerCase())?.value ?? null;
          samples.push({ subject: get("Subject"), from: get("From"), date: get("Date") });
        }

        if (samples.length > 0 && process.env.GEMINI_API_KEY) {
          for (let i = 0; i < samples.length; i++) {
            const m = ids[i];
            if (!m.id) continue;
            const full = await gmail.users.messages.get({ userId: "me", id: m.id, format: "full" });
            const body = full.data.snippet ?? "";
            const parsed = await parseEmail({ subject: samples[i].subject, body, from: samples[i].from });
            samples[i].parsed = {
              isJobRelated: parsed.isJobRelated,
              status: parsed.status,
              company: parsed.company,
              confidence: parsed.confidence,
              reasoning: parsed.reasoning,
            };
          }
        }

        result.search = { query: variant.label + ": " + variant.q, matched: ids.length, samples };
        if (ids.length > 0) break;
      } catch (err) {
        result.error = `Gmail search failed: ${(err as Error).message}`;
        return result;
      }
    }

    return result;
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

export async function resetSyncState() {
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  await db.update(users).set({ lastSyncAt: null }).where(eq(users.id, user.id));
  return { ok: true };
}
