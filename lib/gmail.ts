import { google } from "googleapis";
import { db } from "@/db/client";
import { accounts } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const JOB_SEARCH_QUERY = [
  "(",
  // English
  'subject:"application" OR subject:"applied" OR subject:"interview" OR subject:"opportunity"',
  'OR subject:"position" OR subject:"role" OR subject:"recruiter" OR subject:"offer"',
  'OR subject:"thank you for applying" OR subject:"next steps"',
  // German
  'OR subject:"Bewerbung" OR subject:"Stelle" OR subject:"Stellenangebot" OR subject:"Stellenausschreibung"',
  'OR subject:"Vorstellungsgespräch" OR subject:"Gespräch" OR subject:"Einladung" OR subject:"Termin"',
  'OR subject:"Absage" OR subject:"Zusage" OR subject:"Eingangsbestätigung"',
  'OR subject:"Praktikum" OR subject:"Werkstudent" OR subject:"Karriere"',
  'OR subject:"Personalabteilung" OR subject:"vielen Dank für Ihre Bewerbung"',
  'OR subject:"Ihre Bewerbung" OR subject:"deine Bewerbung"',
  // Senders (language-neutral)
  "OR from:recruiting OR from:talent OR from:careers OR from:jobs OR from:hr@",
  "OR from:karriere OR from:bewerbung OR from:personal OR from:noreply@workday",
  ")",
].join(" ");

export type RawEmail = {
  gmailMessageId: string;
  gmailThreadId: string | null;
  sender: string | null;
  senderEmail: string | null;
  subject: string | null;
  snippet: string;
  body: string;
  direction: "incoming" | "outgoing";
  receivedAt: Date;
};

async function getOAuthClientForUser(userId: string) {
  const [account] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.providerId, "google")))
    .limit(1);

  if (!account?.accessToken) {
    throw new Error("No Google account linked for user " + userId);
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

  client.on("tokens", async (tokens) => {
    await db
      .update(accounts)
      .set({
        accessToken: tokens.access_token ?? account.accessToken,
        refreshToken: tokens.refresh_token ?? account.refreshToken,
        accessTokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : account.accessTokenExpiresAt,
        updatedAt: new Date(),
      })
      .where(eq(accounts.id, account.id));
  });

  return client;
}

function decodeBody(payload: any): string {
  if (!payload) return "";
  if (payload.body?.data) {
    return Buffer.from(payload.body.data, "base64url").toString("utf8");
  }
  if (Array.isArray(payload.parts)) {
    const text = payload.parts.find((p: any) => p.mimeType === "text/plain");
    if (text) return decodeBody(text);
    const html = payload.parts.find((p: any) => p.mimeType === "text/html");
    if (html) return decodeBody(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
  return "";
}

function parseFromHeader(value: string | null | undefined): { name: string | null; email: string | null } {
  if (!value) return { name: null, email: null };
  const match = value.match(/^(.*?)\s*<([^>]+)>$/);
  if (match) return { name: match[1].replace(/"/g, "").trim() || null, email: match[2].trim() };
  return { name: null, email: value.trim() };
}

export async function fetchJobEmails(opts: {
  userId: string;
  userEmail: string;
  sinceDays?: number;
  max?: number;
}): Promise<RawEmail[]> {
  const { userId, userEmail, sinceDays = 90, max = 200 } = opts;
  const auth = await getOAuthClientForUser(userId);
  const gmail = google.gmail({ version: "v1", auth });

  const afterEpoch = Math.floor((Date.now() - sinceDays * 86_400_000) / 1000);
  const q = `${JOB_SEARCH_QUERY} after:${afterEpoch}`;

  const out: RawEmail[] = [];
  let pageToken: string | undefined;
  let fetched = 0;

  do {
    const list = await gmail.users.messages.list({
      userId: "me",
      q,
      maxResults: Math.min(100, max - fetched),
      pageToken,
    });
    const ids = list.data.messages ?? [];
    if (ids.length === 0) break;

    for (const m of ids) {
      if (!m.id) continue;
      const msg = await gmail.users.messages.get({ userId: "me", id: m.id, format: "full" });
      const headers = msg.data.payload?.headers ?? [];
      const get = (name: string) => headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? null;

      const from = parseFromHeader(get("From"));
      const dateRaw = get("Date");
      const receivedAt = dateRaw ? new Date(dateRaw) : new Date(Number(msg.data.internalDate ?? 0));
      const direction: "incoming" | "outgoing" = from.email?.toLowerCase() === userEmail.toLowerCase() ? "outgoing" : "incoming";

      out.push({
        gmailMessageId: msg.data.id!,
        gmailThreadId: msg.data.threadId ?? null,
        sender: from.name,
        senderEmail: from.email,
        subject: get("Subject"),
        snippet: msg.data.snippet ?? "",
        body: decodeBody(msg.data.payload).slice(0, 8000),
        direction,
        receivedAt,
      });
      fetched++;
      if (fetched >= max) break;
    }
    pageToken = list.data.nextPageToken ?? undefined;
  } while (pageToken && fetched < max);

  return out;
}
