"use server";

import { db } from "@/db/client";
import { applications, emails, interviews } from "@/db/schema";
import { eq, desc, asc, and } from "drizzle-orm";
import { getCurrentUser, requireUser } from "./session";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

const PALETTE = ["#C44536", "#5E6AD2", "#3ECF8E", "#635BFF", "#A259FF", "#FF6363", "#181613", "#F38020", "#D97757", "#FF4D00"];

export type ApplicationDTO = {
  id: string;
  company: string;
  jobTitle: string;
  location: string;
  status: "applied" | "interviewing" | "rejected" | "hired";
  appliedAt: string;
  lastActivityAt: string;
  source: string;
  salary?: string;
  notes?: string;
  logoColor: string;
  emails: Array<{
    id: string;
    sender: string;
    senderEmail: string;
    subject: string;
    snippet: string;
    receivedAt: string;
    direction: "incoming" | "outgoing";
  }>;
  interviews: Array<{
    id: string;
    title: string;
    scheduledAt: string;
    durationMins: number;
    type: "phone" | "video" | "onsite" | "assessment";
    location?: string;
    isReminded: boolean;
  }>;
};

export async function listApplications(): Promise<ApplicationDTO[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const apps = await db
    .select()
    .from(applications)
    .where(eq(applications.userId, user.id))
    .orderBy(desc(applications.lastActivityAt));

  if (apps.length === 0) return [];

  const ids = apps.map((a) => a.id);
  const allEmails = await db.select().from(emails).where(eq(emails.userId, user.id)).orderBy(asc(emails.receivedAt));
  const allInterviews = await db
    .select()
    .from(interviews)
    .orderBy(asc(interviews.scheduledAt));

  return apps.map((a) => ({
    id: a.id,
    company: a.company,
    jobTitle: a.jobTitle,
    location: a.location ?? "—",
    status: a.status,
    appliedAt: a.appliedAt.toISOString(),
    lastActivityAt: a.lastActivityAt.toISOString(),
    source: a.source ?? "Manual",
    salary: a.salary ?? undefined,
    notes: a.notes ?? undefined,
    logoColor: a.logoColor ?? PALETTE[0],
    emails: allEmails
      .filter((e) => e.applicationId === a.id)
      .map((e) => ({
        id: e.id,
        sender: e.sender ?? "Unknown",
        senderEmail: e.senderEmail ?? "",
        subject: e.subject ?? "(no subject)",
        snippet: e.snippet ?? "",
        receivedAt: e.receivedAt.toISOString(),
        direction: e.direction,
      })),
    interviews: allInterviews
      .filter((iv) => iv.applicationId === a.id)
      .map((iv) => ({
        id: iv.id,
        title: iv.title,
        scheduledAt: iv.scheduledAt.toISOString(),
        durationMins: iv.durationMins ?? 60,
        type: iv.type ?? "video",
        location: iv.location ?? undefined,
        isReminded: iv.isReminded,
      })),
  }));
}

export async function createApplication(input: {
  company: string;
  jobTitle: string;
  location: string;
  status: "applied" | "interviewing" | "rejected" | "hired";
  source: string;
  salary?: string;
  notes?: string;
}) {
  const user = await requireUser();
  const id = randomUUID();
  const now = new Date();
  await db.insert(applications).values({
    id,
    userId: user.id,
    company: input.company,
    jobTitle: input.jobTitle,
    location: input.location,
    status: input.status,
    source: input.source,
    salary: input.salary,
    notes: input.notes,
    logoColor: PALETTE[Math.floor(Math.random() * PALETTE.length)],
    appliedAt: now,
    lastActivityAt: now,
  });
  revalidatePath("/");
  return id;
}

export async function updateApplicationStatus(
  id: string,
  status: "applied" | "interviewing" | "rejected" | "hired",
) {
  const user = await requireUser();
  await db
    .update(applications)
    .set({ status, lastActivityAt: new Date() })
    .where(and(eq(applications.id, id), eq(applications.userId, user.id)));
  revalidatePath("/");
}

export type ApplicationPatch = {
  company?: string;
  jobTitle?: string;
  location?: string;
  status?: "applied" | "interviewing" | "rejected" | "hired";
  source?: string;
  salary?: string | null;
  notes?: string | null;
};

export async function updateApplication(id: string, patch: ApplicationPatch) {
  const user = await requireUser();
  const fields: Record<string, unknown> = { lastActivityAt: new Date() };
  if (patch.company !== undefined) fields.company = patch.company.trim();
  if (patch.jobTitle !== undefined) fields.jobTitle = patch.jobTitle.trim();
  if (patch.location !== undefined) fields.location = patch.location.trim();
  if (patch.status !== undefined) fields.status = patch.status;
  if (patch.source !== undefined) fields.source = patch.source.trim();
  if (patch.salary !== undefined) fields.salary = patch.salary?.trim() || null;
  if (patch.notes !== undefined) fields.notes = patch.notes?.trim() || null;
  await db
    .update(applications)
    .set(fields)
    .where(and(eq(applications.id, id), eq(applications.userId, user.id)));
  revalidatePath("/");
  return { ok: true };
}

export async function deleteApplication(id: string) {
  const user = await requireUser();
  await db
    .delete(applications)
    .where(and(eq(applications.id, id), eq(applications.userId, user.id)));
  revalidatePath("/");
  return { ok: true };
}
