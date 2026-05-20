import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  image: text("image"),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  lastSyncAt: integer("last_sync_at", { mode: "timestamp" }),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"),
  idToken: text("id_token"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const verifications = sqliteTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const applications = sqliteTable("applications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  company: text("company").notNull(),
  jobTitle: text("job_title").notNull(),
  location: text("location"),
  status: text("status", { enum: ["applied", "interviewing", "rejected", "hired"] }).notNull().default("applied"),
  source: text("source"),
  salary: text("salary"),
  notes: text("notes"),
  logoColor: text("logo_color"),
  appliedAt: integer("applied_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  lastActivityAt: integer("last_activity_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const emails = sqliteTable("emails", {
  id: text("id").primaryKey(),
  applicationId: text("application_id").references(() => applications.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  gmailMessageId: text("gmail_message_id").notNull().unique(),
  gmailThreadId: text("gmail_thread_id"),
  sender: text("sender"),
  senderEmail: text("sender_email"),
  subject: text("subject"),
  snippet: text("snippet"),
  body: text("body"),
  direction: text("direction", { enum: ["incoming", "outgoing"] }).notNull().default("incoming"),
  receivedAt: integer("received_at", { mode: "timestamp" }).notNull(),
  parsedAt: integer("parsed_at", { mode: "timestamp" }),
  parseResult: text("parse_result"),
});

export const userPreferences = sqliteTable("user_preferences", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  interviewReminders: integer("interview_reminders", { mode: "boolean" }).notNull().default(true),
  statusUpdates: integer("status_updates", { mode: "boolean" }).notNull().default(true),
  weeklyDigest: integer("weekly_digest", { mode: "boolean" }).notNull().default(false),
  autoArchive: integer("auto_archive", { mode: "boolean" }).notNull().default(true),
  aiNotes: integer("ai_notes", { mode: "boolean" }).notNull().default(true),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const interviews = sqliteTable("interviews", {
  id: text("id").primaryKey(),
  applicationId: text("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  scheduledAt: integer("scheduled_at", { mode: "timestamp" }).notNull(),
  durationMins: integer("duration_mins").default(60),
  type: text("type", { enum: ["phone", "video", "onsite", "assessment"] }).default("video"),
  location: text("location"),
  isReminded: integer("is_reminded", { mode: "boolean" }).notNull().default(false),
  remindedAt: integer("reminded_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const usersRelations = relations(users, ({ many }) => ({
  applications: many(applications),
  emails: many(emails),
}));

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  user: one(users, { fields: [applications.userId], references: [users.id] }),
  emails: many(emails),
  interviews: many(interviews),
}));

export const emailsRelations = relations(emails, ({ one }) => ({
  application: one(applications, { fields: [emails.applicationId], references: [applications.id] }),
  user: one(users, { fields: [emails.userId], references: [users.id] }),
}));

export const interviewsRelations = relations(interviews, ({ one }) => ({
  application: one(applications, { fields: [interviews.applicationId], references: [applications.id] }),
}));

export type User = typeof users.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type ApplicationInsert = typeof applications.$inferInsert;
export type Email = typeof emails.$inferSelect;
export type Interview = typeof interviews.$inferSelect;
