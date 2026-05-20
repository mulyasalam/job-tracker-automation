"use server";

import { getCurrentUser } from "./session";
import { inngest } from "@/lib/inngest";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { syncUserEmails } from "@/lib/sync";

export type SyncResult =
  | { ok: true; imported: number; newApplications: number; newInterviews: number; scanned: number }
  | { ok: false; reason: string };

export async function runSyncNow(sinceDays = 7): Promise<SyncResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, reason: "unauthenticated" };
  try {
    const result = await syncUserEmails(user.id, sinceDays);
    revalidatePath("/");
    return { ok: true, ...result };
  } catch (err) {
    return { ok: false, reason: (err as Error).message };
  }
}

export async function triggerSync() {
  const user = await getCurrentUser();
  if (!user) return { ok: false, reason: "unauthenticated" as const };
  if (process.env.INNGEST_EVENT_KEY) {
    await inngest.send({
      name: "user.sync.requested",
      data: { userId: user.id, sinceDays: 7 },
    });
    revalidatePath("/");
    return { ok: true as const, mode: "background" as const };
  }
  return { ok: false, reason: "no-background-runner" as const };
}

export async function triggerInitialBackfillIfNeeded() {
  const user = await getCurrentUser();
  if (!user) return { triggered: false };
  const [row] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  if (!row || row.lastSyncAt) return { triggered: false };

  if (process.env.INNGEST_EVENT_KEY) {
    await inngest.send({ name: "user.connected", data: { userId: user.id } });
    await db.update(users).set({ lastSyncAt: new Date(0) }).where(eq(users.id, user.id));
    return { triggered: true, mode: "background" as const };
  }

  try {
    const result = await syncUserEmails(user.id, 90);
    return { triggered: true, mode: "inline" as const, ...result };
  } catch (err) {
    return { triggered: false, error: (err as Error).message };
  }
}

export async function getLastSync() {
  const user = await getCurrentUser();
  if (!user) return null;
  const [row] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  return row?.lastSyncAt?.toISOString() ?? null;
}
