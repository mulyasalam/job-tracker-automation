# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

JobTrackerAutomation is a personal job application tracking assistant. It connects to Gmail via OAuth, parses incoming/outgoing job-related emails using AI, and displays application statuses in a Kanban/table dashboard. The system runs background email syncs and sends interview reminder notifications automatically.

## Tech Stack

- **Framework:** Next.js (App Router) with TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Backend:** Next.js API Routes and Server Actions
- **Database:** SQLite via Drizzle ORM
- **Auth + Gmail OAuth:** Better Auth (read-only Gmail access, no password storage)
- **Background Jobs:** Inngest or Upstash QStash (async email sync + reminder cron jobs)
- **AI Parser:** Google Gemini API (`gemini-1.5-flash`) or OpenAI API — used server-side to extract structured JSON (company name, status, interview date) from raw HR email text

## Architecture

Event-driven: Gmail webhooks or cron job polling triggers the backend parser, which writes structured data to SQLite, which the frontend reads in real-time.

```
Gmail API → Webhook/Cron → AI Parser (Gemini/OpenAI) → Drizzle ORM → SQLite
                                                                        ↓
                                                              Next.js Dashboard (real-time)
```

## Database Schema (Drizzle ORM)

Four tables: `users`, `applications`, `emails`, `interviews`.

- `users`: id, email, name, oauth_token (Gmail read-only)
- `applications`: id, user_id FK, company_name, job_title, status (`applied | interviewing | rejected | hired`), applied_at
- `emails`: id, application_id FK, sender_email, subject, body_snippet, received_at
- `interviews`: id, application_id FK, title, schedule_time, is_reminded (boolean for cron tracking)

## Key Implementation Details

- Gmail access is **read-only OAuth** — never store email passwords
- Background jobs (email sync, reminder notifications) must run outside the Next.js request cycle via Inngest or QStash
- The AI parser runs **server-side only** and outputs structured JSON; keep API keys in environment variables
- Interview reminders fire via cron checking `interviews.is_reminded = false` and `schedule_time` approaching
- Application status transitions are driven by AI parsing of HR reply emails, not manual user input

## Commands (once project is scaffolded)

```bash
npm run dev          # Start Next.js dev server
npm run build        # Production build
npm run db:push      # Push Drizzle schema to SQLite
npm run db:studio    # Open Drizzle Studio (DB explorer)
```
