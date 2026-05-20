import { inngest } from "@/lib/inngest";
import { syncUserEmails } from "@/lib/sync";
import { db } from "@/db/client";
import { interviews, applications, users } from "@/db/schema";
import { and, eq, lte, gte } from "drizzle-orm";

export const backfillOnConnect = inngest.createFunction(
  { id: "backfill-on-connect", retries: 2, triggers: [{ event: "user.connected" }] },
  async ({ event, step }) => {
    return await step.run("backfill-90-days", async () => {
      return await syncUserEmails(event.data.userId, 90);
    });
  },
);

export const syncOnRequest = inngest.createFunction(
  { id: "sync-on-request", retries: 1, triggers: [{ event: "user.sync.requested" }] },
  async ({ event, step }) => {
    return await step.run("sync", async () => {
      return await syncUserEmails(event.data.userId, event.data.sinceDays ?? 7);
    });
  },
);

export const periodicSync = inngest.createFunction(
  { id: "periodic-sync", triggers: [{ cron: "*/15 * * * *" }] },
  async ({ step }) => {
    const allUsers = await step.run("load-users", async () => db.select().from(users));
    for (const u of allUsers) {
      await step.sendEvent("trigger-sync", {
        name: "user.sync.requested",
        data: { userId: u.id, sinceDays: 2 },
      });
    }
    return { users: allUsers.length };
  },
);

export const interviewReminders = inngest.createFunction(
  { id: "interview-reminders", triggers: [{ cron: "*/10 * * * *" }] },
  async ({ step }) => {
    const now = Date.now();
    const horizon = new Date(now + 24 * 3600 * 1000);

    const due = await step.run("find-due", async () =>
      db
        .select({
          iv: interviews,
          app: applications,
        })
        .from(interviews)
        .innerJoin(applications, eq(interviews.applicationId, applications.id))
        .where(and(eq(interviews.isReminded, false), lte(interviews.scheduledAt, horizon), gte(interviews.scheduledAt, new Date(now)))),
    );

    for (const row of due) {
      await step.run(`remind-${row.iv.id}`, async () => {
        const scheduledIso = new Date(row.iv.scheduledAt).toISOString();
        console.log(
          `[reminder] ${row.app.company} — ${row.iv.title} at ${scheduledIso}`,
        );
        await db
          .update(interviews)
          .set({ isReminded: true, remindedAt: new Date() })
          .where(eq(interviews.id, row.iv.id));
      });
    }

    return { reminded: due.length };
  },
);

export const functions = [backfillOnConnect, syncOnRequest, periodicSync, interviewReminders];
