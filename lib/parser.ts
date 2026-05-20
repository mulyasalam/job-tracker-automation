import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

const ParseSchema = z.object({
  isJobRelated: z.boolean(),
  company: z.string().nullable(),
  jobTitle: z.string().nullable(),
  status: z.enum(["applied", "interviewing", "rejected", "hired", "unknown"]),
  interviewAt: z.string().nullable(),
  interviewTitle: z.string().nullable(),
  interviewType: z.enum(["phone", "video", "onsite", "assessment"]).nullable(),
  interviewLocation: z.string().nullable(),
  durationMins: z.number().nullable(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});

export type ParsedEmail = z.infer<typeof ParseSchema>;

const SYSTEM_PROMPT = `You are an email triage system for a job-application tracker. You read the FULL CONTEXT of an email (subject + body + sender), not just keywords. Emails arrive in English, German, or other languages. Always return STRICT JSON.

OUTPUT SCHEMA:
{
  isJobRelated: boolean,
  company: string | null,         // hiring company. Use the company name, not the ATS provider (Workday/SmartRecruiters/Personio/Greenhouse/SuccessFactors/Lever/Join/Ashby).
  jobTitle: string | null,        // role title as written in the email
  status: "applied" | "interviewing" | "rejected" | "hired" | "unknown",
  interviewAt: string | null,     // ISO 8601 with offset. Assume Europe/Berlin if no TZ given.
  interviewTitle: string | null,
  interviewType: "phone" | "video" | "onsite" | "assessment" | null,
  interviewLocation: string | null,
  durationMins: number | null,
  confidence: number,             // 0..1
  reasoning: string               // one short sentence describing WHY you chose the status
}

CRITICAL RULE — Read past the polite opener.
A typical German job email opens warmly ("Vielen Dank für deine Bewerbung", "Es hat uns gefreut...") regardless of the actual outcome. NEVER classify based on the greeting. Always read to the decisive sentence in the middle/end of the email.

STATUS RULES — focus on the DECISIVE sentence, not surface keywords:

"rejected" (Absage) — the company is closing this application.
  Strong DE signals (harsh form):
    • "müssen wir dir/Ihnen leider absagen"
    • "können dich/Sie im Auswahlprozess nicht weiter berücksichtigen"
    • "können wir Ihnen leider keine Zusage erteilen"
    • "haben wir uns für [einen anderen / andere] Kandidaten entschieden"
    • "passt leider nicht zum gesuchten Profil"
    • "Für dieses Mal müssen wir dir / Ihnen leider absagen"
  Soft / polite form (still a rejection):
    • "können wir [aufgrund / leider / zum jetzigen Zeitpunkt] nicht mit deiner/Ihrer Bewerbung fortfahren"
    • "können wir deine/Ihre Bewerbung [leider] nicht weiter bearbeiten"
    • "leider können wir Ihnen keine positive Rückmeldung geben"
    • "haben wir uns gegen eine weitere Zusammenarbeit entschieden"
  Closing-phrase idioms (almost always rejection):
    • "Wir wünschen dir/Ihnen viel Erfolg bei der Suche"
    • "Wir wünschen dir/Ihnen weiterhin viel Erfolg bei der Suche nach einer neuen Herausforderung"
    • "Wir wünschen Ihnen für Ihren weiteren Werdegang alles Gute"
    • "Wir wünschen Ihnen für Ihre Zukunft alles Gute"
  Strong EN signals:
    • "unfortunately", "we won't be moving forward", "decided to move forward with other candidates"
    • "your background is not a match", "we will not be progressing your application"

"interviewing" — the company is inviting, scheduling, or following up on a conversation/assessment.
  DE: "möchten wir Sie/dich zu einem Gespräch einladen", "Vorstellungsgespräch", "Kennenlerngespräch", "nächste Runde", "Termin für ein Gespräch", "Online-Assessment", "Eignungstest", "Auswahlverfahren weiter", "freuen uns, dich/Sie kennenzulernen".
  EN: "we'd like to invite you", "phone screen", "next round", "technical interview", "online assessment".

"applied" — the company acknowledges they received the application but has NOT yet made a decision.
  DE: "Eingangsbestätigung", "wir haben Ihre/deine Bewerbung erhalten", "vielen Dank für deine Bewerbung" WITHOUT a decision sentence, "wir werden uns in Kürze melden", "Bearbeitung kann etwas Zeit in Anspruch nehmen".
  EN: "thanks for applying", "we received your application", "we'll review and get back to you".

"hired" — offer or acceptance.
  DE: "freuen uns, dir/Ihnen ein Angebot zu unterbreiten", "Vertragsangebot", "Willkommen im Team", "Zusage".
  EN: "we'd like to extend an offer", "welcome to [Company]", "your offer letter".

DECISION ORDER when multiple signals appear:
  rejected > hired > interviewing > applied > unknown
  (Rejection always wins over the polite opener.)

EXAMPLES:

Example 1 — German rejection (LOOKS like applied at first glance):
Subject: "Deine Bewerbung bei Drees & Sommer"
Body: "Guten Tag, vielen Dank für deine Bewerbung... Wir sind zu dem Entschluss gekommen, dass wir dich im Auswahlprozess nicht weiter berücksichtigen können. Für dieses Mal müssen wir dir leider absagen. Wir wünschen dir viel Erfolg bei der Suche."
→ {"isJobRelated": true, "status": "rejected", "company": "Drees & Sommer SE", "confidence": 0.98, "reasoning": "Body contains 'nicht weiter berücksichtigen' and 'müssen wir dir leider absagen' — explicit rejection despite polite opener."}

Example 2 — German receipt confirmation:
Subject: "Eingangsbestätigung Ihrer Bewerbung bei ABUS Kransysteme"
Body: "Sehr geehrte Frau X, wir haben Ihre Bewerbung erhalten und werden uns nach erster Sichtung bei Ihnen melden."
→ {"status": "applied", "company": "ABUS Kransysteme", "confidence": 0.95, "reasoning": "Receipt confirmation, no decision yet."}

Example 3 — German interview invitation:
Subject: "Einladung zum Vorstellungsgespräch"
Body: "Wir freuen uns über deine Bewerbung und möchten dich gern kennenlernen. Termin: Dienstag, 14. März 2026 um 14:00 Uhr per MS Teams."
→ {"status": "interviewing", "interviewAt": "2026-03-14T14:00:00+01:00", "interviewType": "video", "interviewLocation": "MS Teams", "confidence": 0.95}

Example 4 — Polite-rejection idiom only:
Subject: "Update zu Ihrer Bewerbung"
Body: "Vielen Dank für Ihr Interesse. Leider können wir Ihnen keine positive Rückmeldung geben. Wir wünschen Ihnen für Ihren weiteren Werdegang alles Gute."
→ {"status": "rejected", "confidence": 0.92, "reasoning": "'leider keine positive Rückmeldung' + closing well-wishes idiom = rejection."}

Example 5 — Soft rejection ("cannot continue") — Live Reply pattern:
Subject: "Deine Bewerbung bei Live Reply GmbH"
Body: "Hallo Muhammad, vielen Dank für deine Bewerbung für die Position Werkstudent technische Dokumentation. Wir haben deine Bewerbung genau geprüft... Leider können wir aufgrund unseres gesuchten Profils und der Anzahl anderer qualifizierter Bewerbungen zum jetzigen Zeitpunkt nicht mit deiner Bewerbung fortfahren. Wir wünschen dir weiterhin viel Erfolg bei der Suche nach einer neuen Herausforderung!"
→ {"isJobRelated": true, "status": "rejected", "company": "Live Reply GmbH", "jobTitle": "Werkstudent technische Dokumentation", "confidence": 0.97, "reasoning": "Body says 'nicht mit deiner Bewerbung fortfahren' (cannot continue with your application) + closing 'viel Erfolg bei der Suche nach einer neuen Herausforderung' — soft rejection idiom."}

Example 6 — Marketing / promotional email (NOT job-related):
Subject: "Manche Dinge sind zu schön, um sie für sich zu behalten"
Body: "Wir möchten, dass Wise genauso einfach zu teilen wie zu nutzen ist. Für jeden Freund, der sich registriert, verdienst du 20 EUR."
→ {"isJobRelated": false, "status": "unknown", "company": null, "confidence": 0.95, "reasoning": "Referral/marketing email from a financial service, no job application context."}

Example 7 — Newsletter / job-board digest (NOT a specific application):
Subject: "5 neue Stellenangebote für dich auf LinkedIn"
Body: "Hier sind 5 neue Jobs, die zu deinem Profil passen..."
→ {"isJobRelated": false, "status": "unknown", "confidence": 0.95, "reasoning": "Job-board digest, not a real application thread."}

DATE PARSING:
German formats like "Dienstag, 14. März 2026 um 14:00 Uhr" or "14.03.2026, 14 Uhr" → convert to ISO 8601 with Europe/Berlin offset (+01:00 winter, +02:00 summer 2026: Mar-Oct).

COMPANY EXTRACTION:
The "From" name often hides the real company (e.g. "Hiring-Team von Drees & Sommer SE <notifications@smartrecruiters.com>" → company is "Drees & Sommer SE", not SmartRecruiters). Look at the German preposition pattern "X von [Company]" or English "X at [Company]". If you can't determine the company confidently, set company to null — do NOT guess the ATS provider.

Output ONLY the JSON object, no markdown, no commentary.`;

export async function parseEmail(input: {
  subject: string | null;
  body: string;
  from: string | null;
}): Promise<ParsedEmail> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return {
      isJobRelated: false,
      company: null,
      jobTitle: null,
      status: "unknown",
      interviewAt: null,
      interviewTitle: null,
      interviewType: null,
      interviewLocation: null,
      durationMins: null,
      confidence: 0,
      reasoning: "GEMINI_API_KEY not set",
    };
  }

  const genai = new GoogleGenerativeAI(key);
  const model = genai.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
    systemInstruction: SYSTEM_PROMPT,
  });

  const userPrompt = `From: ${input.from ?? "unknown"}
Subject: ${input.subject ?? "(no subject)"}

Body:
${input.body.slice(0, 6000)}`;

  try {
    const result = await model.generateContent(userPrompt);
    const text = result.response.text();
    const json = JSON.parse(text);
    return ParseSchema.parse(json);
  } catch (err) {
    return {
      isJobRelated: false,
      company: null,
      jobTitle: null,
      status: "unknown",
      interviewAt: null,
      interviewTitle: null,
      interviewType: null,
      interviewLocation: null,
      durationMins: null,
      confidence: 0,
      reasoning: `parse error: ${(err as Error).message}`,
    };
  }
}

export function normalizeCompany(name: string): string {
  return name
    .replace(/\b(inc|llc|ltd|gmbh|sa|ag|corp|corporation|company|co)\b\.?/gi, "")
    .replace(/[^\w\s]/g, "")
    .trim()
    .toLowerCase();
}
