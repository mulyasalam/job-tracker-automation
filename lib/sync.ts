import { db } from "@/db/client";
import { applications, emails, interviews, users } from "@/db/schema";
import { fetchJobEmails, type RawEmail } from "@/lib/gmail";
import { parseEmail, normalizeCompany, type ParsedEmail } from "@/lib/parser";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

const PALETTE = ["#C44536", "#5E6AD2", "#3ECF8E", "#635BFF", "#A259FF", "#FF6363", "#181613", "#F38020", "#D97757", "#FF4D00"];

const STRONG_KEYWORDS = [
  "bewerbung", "vorstellungsgespräch", "vorstellungsgesprach", "einladung",
  "eingangsbestätigung", "eingangsbestatigung", "absage", "zusage", "stellenangebot",
  "praktikum", "werkstudent",
  "application", "interview", "offer", "thank you for applying", "thank you for your application",
];

function looksDefinitelyJobRelated(raw: RawEmail): boolean {
  const haystack = `${raw.subject ?? ""} ${raw.senderEmail ?? ""}`.toLowerCase();
  return STRONG_KEYWORDS.some((kw) => haystack.includes(kw));
}

function guessCompanyFromSender(raw: RawEmail): string | null {
  if (raw.sender) {
    const cleaned = raw.sender
      .replace(/\b(hiring|recruiting|team|talent|careers|karriere|personalabteilung|hr|people|noreply|no-reply|donotreply)\b/gi, "")
      .replace(/\b(von|at|of|@)\b/gi, " ")
      .replace(/[<>"]/g, "")
      .trim();
    if (cleaned.length >= 2) return cleaned.replace(/\s+/g, " ");
  }
  if (raw.senderEmail) {
    const domain = raw.senderEmail.split("@")[1] ?? "";
    const stem = domain.split(".")[0];
    if (stem && !["mail", "gmail", "smartrecruiters", "successfactors", "personio", "workday", "join", "greenhouse", "lever", "ashby"].includes(stem.toLowerCase())) {
      return stem.charAt(0).toUpperCase() + stem.slice(1);
    }
  }
  return null;
}

function inferStatusFromContent(raw: RawEmail): "applied" | "interviewing" | "rejected" | "hired" | null {
  const haystack = `${raw.subject ?? ""}\n${raw.body ?? ""}`.toLowerCase();

  const rejectionPatterns = [
    // harsh
    "absage", "absagen", "nicht weiter berücksichtigen", "nicht weiter beruecksichtigen",
    "keine zusage", "keine positive rückmeldung", "keine positive ruckmeldung",
    "haben wir uns für einen anderen", "haben wir uns fur einen anderen",
    "passt leider nicht",
    // soft / "cannot continue" form (Live Reply pattern)
    "nicht mit deiner bewerbung fortfahren", "nicht mit ihrer bewerbung fortfahren",
    "nicht mit deiner bewerbung weitermachen", "nicht mit ihrer bewerbung weitermachen",
    "deine bewerbung nicht weiter bearbeiten", "ihre bewerbung nicht weiter bearbeiten",
    "gegen eine weitere zusammenarbeit",
    // closing-phrase idioms (very strong rejection signal in German)
    "viel erfolg bei der suche", "viel erfolg bei deiner suche",
    "viel erfolg bei der suche nach einer neuen herausforderung",
    "weiterhin viel erfolg", "weiteren werdegang alles gute",
    "ihre zukunft alles gute", "deine zukunft alles gute",
    // English
    "unfortunately", "moved forward with other", "not be progressing",
    "won't be moving forward", "wont be moving forward", "not a match",
  ];
  if (rejectionPatterns.some((p) => haystack.includes(p))) return "rejected";

  const hiredPatterns = [
    "zusage", "vertragsangebot", "ein angebot zu unterbreiten", "willkommen im team",
    "offer letter", "extend an offer", "welcome to ",
  ];
  if (hiredPatterns.some((p) => haystack.includes(p))) return "hired";

  const interviewPatterns = [
    "vorstellungsgespräch", "vorstellungsgesprach", "kennenlerngespräch", "kennenlerngesprach",
    "möchten wir sie zu einem gespräch einladen", "mochten wir sie zu einem gesprach einladen",
    "möchten dich zu einem gespräch", "termin für ein gespräch",
    "online-assessment", "eignungstest", "nächste runde", "naechste runde",
    "phone screen", "we'd like to invite you", "wed like to invite you",
    "next round", "technical interview",
  ];
  if (interviewPatterns.some((p) => haystack.includes(p))) return "interviewing";

  const appliedPatterns = [
    "eingangsbestätigung", "eingangsbestatigung",
    "wir haben ihre bewerbung erhalten", "wir haben deine bewerbung erhalten",
    "vielen dank für ihre bewerbung", "vielen dank für deine bewerbung",
    "vielen dank fur ihre bewerbung", "vielen dank fur deine bewerbung",
    "thank you for applying", "thanks for applying", "we received your application",
  ];
  if (appliedPatterns.some((p) => haystack.includes(p))) return "applied";

  return null;
}

export async function syncUserEmails(userId: string, sinceDays = 90) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new Error("user not found: " + userId);

  const fetched = await fetchJobEmails({ userId, userEmail: user.email, sinceDays });

  let imported = 0;
  let newApplications = 0;
  let newInterviews = 0;

  for (const raw of fetched) {
    const existing = await db
      .select()
      .from(emails)
      .where(eq(emails.gmailMessageId, raw.gmailMessageId))
      .limit(1);
    if (existing.length > 0) continue;

    const definite = looksDefinitelyJobRelated(raw);
    let parsed: ParsedEmail = await parseEmail({ subject: raw.subject, body: raw.body, from: raw.senderEmail });

    // Trust Gemini if it confidently says NOT job-related (e.g. marketing email that happens to mention "Bewerbung").
    const geminiConfidentlyRejects = !parsed.isJobRelated && parsed.confidence >= 0.6;
    if (geminiConfidentlyRejects) continue;

    if (definite) {
      const fallbackStatus = inferStatusFromContent(raw);
      if (!parsed.isJobRelated || parsed.confidence < 0.3) {
        parsed = {
          ...parsed,
          isJobRelated: true,
          status: parsed.status !== "unknown" ? parsed.status : (fallbackStatus ?? "applied"),
          company: parsed.company ?? guessCompanyFromSender(raw),
          jobTitle: parsed.jobTitle ?? raw.subject?.replace(/^(re:|fwd:|aw:|wg:)\s*/i, "") ?? null,
          confidence: Math.max(parsed.confidence, 0.5),
        };
      }
    } else if (!parsed.isJobRelated || parsed.confidence < 0.3) {
      continue;
    }

    const effectiveCompany = parsed.company ?? guessCompanyFromSender(raw);
    const effectiveStatus = (parsed.status as string) === "unknown"
      ? (inferStatusFromContent(raw) ?? "applied")
      : (parsed.status as "applied" | "interviewing" | "rejected" | "hired");

    let applicationId: string | null = null;
    if (effectiveCompany) {
      const target = normalizeCompany(effectiveCompany);
      const allApps = await db.select().from(applications).where(eq(applications.userId, userId));
      const match = allApps.find((a) => normalizeCompany(a.company) === target);

      if (match) {
        applicationId = match.id;
        const statusOrder = ["applied", "interviewing", "hired", "rejected"] as const;
        const currentIdx = statusOrder.indexOf(match.status);
        const newIdx = statusOrder.indexOf(effectiveStatus);
        const shouldUpdate = newIdx > currentIdx || effectiveStatus === "rejected" || effectiveStatus === "hired";
        await db
          .update(applications)
          .set({
            status: shouldUpdate && newIdx >= 0 ? effectiveStatus : match.status,
            lastActivityAt: raw.receivedAt,
            jobTitle: match.jobTitle || parsed.jobTitle || match.jobTitle,
          })
          .where(eq(applications.id, match.id));
      } else {
        applicationId = randomUUID();
        await db.insert(applications).values({
          id: applicationId,
          userId,
          company: effectiveCompany,
          jobTitle: parsed.jobTitle ?? raw.subject ?? "Unknown role",
          status: effectiveStatus,
          source: "Email",
          appliedAt: raw.receivedAt,
          lastActivityAt: raw.receivedAt,
          logoColor: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        });
        newApplications++;
      }
    }

    await db.insert(emails).values({
      id: randomUUID(),
      applicationId,
      userId,
      gmailMessageId: raw.gmailMessageId,
      gmailThreadId: raw.gmailThreadId,
      sender: raw.sender,
      senderEmail: raw.senderEmail,
      subject: raw.subject,
      snippet: raw.snippet,
      body: raw.body,
      direction: raw.direction,
      receivedAt: raw.receivedAt,
      parsedAt: new Date(),
      parseResult: JSON.stringify(parsed),
    });
    imported++;

    if (applicationId && parsed.interviewAt) {
      const scheduledAt = new Date(parsed.interviewAt);
      if (!isNaN(scheduledAt.getTime()) && scheduledAt.getTime() > Date.now() - 86_400_000) {
        const existingIvs = await db
          .select()
          .from(interviews)
          .where(eq(interviews.applicationId, applicationId));
        const dup = existingIvs.find((iv) => Math.abs(iv.scheduledAt.getTime() - scheduledAt.getTime()) < 3_600_000);
        if (!dup) {
          await db.insert(interviews).values({
            id: randomUUID(),
            applicationId,
            title: parsed.interviewTitle ?? "Interview",
            scheduledAt,
            durationMins: parsed.durationMins ?? 60,
            type: parsed.interviewType ?? "video",
            location: parsed.interviewLocation,
            isReminded: false,
          });
          newInterviews++;
        }
      }
    }
  }

  await db.update(users).set({ lastSyncAt: new Date() }).where(eq(users.id, userId));

  return { imported, newApplications, newInterviews, scanned: fetched.length };
}
