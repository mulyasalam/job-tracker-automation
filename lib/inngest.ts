import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "job-tracker",
  eventKey: process.env.INNGEST_EVENT_KEY,
});

export type Events = {
  "user.connected": { data: { userId: string } };
  "user.sync.requested": { data: { userId: string; sinceDays?: number } };
};
