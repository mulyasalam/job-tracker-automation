"use server";

import { db } from "@/db/client";
import { userPreferences, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireUser, getCurrentUser } from "./session";

export type Preferences = {
  interviewReminders: boolean;
  statusUpdates: boolean;
  weeklyDigest: boolean;
  autoArchive: boolean;
  aiNotes: boolean;
};

const DEFAULTS: Preferences = {
  interviewReminders: true,
  statusUpdates: true,
  weeklyDigest: false,
  autoArchive: true,
  aiNotes: true,
};

export async function getPreferences(): Promise<Preferences> {
  const user = await getCurrentUser();
  if (!user) return DEFAULTS;
  const [row] = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, user.id))
    .limit(1);
  if (!row) return DEFAULTS;
  return {
    interviewReminders: row.interviewReminders,
    statusUpdates: row.statusUpdates,
    weeklyDigest: row.weeklyDigest,
    autoArchive: row.autoArchive,
    aiNotes: row.aiNotes,
  };
}

export async function updatePreferences(patch: Partial<Preferences>): Promise<Preferences> {
  const user = await requireUser();
  const existing = await db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, user.id))
    .limit(1);

  const merged: Preferences = { ...DEFAULTS, ...existing[0], ...patch };

  if (existing.length === 0) {
    await db.insert(userPreferences).values({
      userId: user.id,
      ...merged,
      updatedAt: new Date(),
    });
  } else {
    await db
      .update(userPreferences)
      .set({ ...merged, updatedAt: new Date() })
      .where(eq(userPreferences.userId, user.id));
  }

  return merged;
}

export async function deleteAccount() {
  const user = await requireUser();
  await db.delete(users).where(eq(users.id, user.id));
  return { ok: true };
}
