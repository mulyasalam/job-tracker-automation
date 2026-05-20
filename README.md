# Dossier — A Personal Job Archive

An editorial-style job application tracker. Connects to your Gmail (read-only), uses Gemini to parse incoming HR mail in English and German, and files every application into a clean kanban / table / timeline view with interview reminders.

![tech](https://img.shields.io/badge/Next.js-15-black) ![tech](https://img.shields.io/badge/TypeScript-5-blue) ![tech](https://img.shields.io/badge/Drizzle-ORM-green) ![tech](https://img.shields.io/badge/Better%20Auth-1.6-lightgrey) ![tech](https://img.shields.io/badge/Gemini-1.5%20Flash-orange)

---

## Features

- **Gmail read-only OAuth** via Better Auth — no passwords stored
- **Bilingual email parser** — Gemini 1.5 Flash extracts company, role, status, and interview dates from English & German HR mail with context-aware classification (handles polite German rejections like `nicht weiter berücksichtigen` and `viel Erfolg bei der Suche`)
- **Three views** — Kanban (drag-to-change-status), Table, Timeline
- **Inline editing + delete** on every application
- **Global search** (⌘K) across companies, roles, email subjects, interview titles
- **Background sync + reminder cron** via Inngest (optional)
- **All settings persisted** — notifications, automation toggles, preferences

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, Tailwind, Radix UI |
| Auth | Better Auth + Google OAuth (`gmail.readonly` scope) |
| DB | SQLite via Drizzle ORM (local) — see deployment notes |
| Background jobs | Inngest (optional, falls back to inline sync) |
| AI | Google Gemini 1.5 Flash for email triage |
| Gmail | googleapis SDK |

---

## Local setup

### Prerequisites

- Node 20+
- A Google Cloud project (free)
- A Google AI Studio account (free)

### 1. Clone & install

```bash
git clone https://github.com/<your-username>/job-tracker-automation.git
cd job-tracker-automation
npm install --legacy-peer-deps
```

(React 19 RC means we use `--legacy-peer-deps`. Don't worry, things work.)

### 2. Environment variables

```bash
cp .env.example .env.local
```

Fill in:

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Leave as `file:./sqlite.db` for local dev |
| `BETTER_AUTH_SECRET` | Any 32+ char random string. Generate with `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | `http://localhost:3000` for local |
| `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) — see below |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) — free tier is generous |
| `INNGEST_*` | Optional — leave blank for local |

### 3. Google OAuth setup (~5 min)

1. Go to [console.cloud.google.com](https://console.cloud.google.com/) → create or pick a project.
2. **Enable Gmail API**: [console.cloud.google.com/apis/library/gmail.googleapis.com](https://console.cloud.google.com/apis/library/gmail.googleapis.com)
3. **OAuth consent screen**:
   - User type: External
   - Add scope: `https://www.googleapis.com/auth/gmail.readonly`
   - **Add your own Gmail as a Test user** (otherwise you'll hit error 403)
4. **Credentials → OAuth client ID → Web application**:
   - Authorized JavaScript origin: `http://localhost:3000`
   - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
5. Copy the Client ID + Secret into `.env.local`.

### 4. Database

```bash
npm run db:push
```

Creates `sqlite.db` with the schema (users, accounts, sessions, applications, emails, interviews, user_preferences).

### 5. Run

```bash
npm run dev
```

Open http://localhost:3000 → click **Continue with Gmail** → grant access. The first sign-in triggers a 90-day backfill of your inbox (takes 30–90 seconds).

### Optional: Inngest for background sync + reminder cron

In a second terminal:

```bash
npm run inngest:dev
```

Spawns the local Inngest dev server at http://localhost:8288. With it running, you get:
- 15-min recurring email resync
- 10-min interview reminder check (fires when an interview is within 24h)

Without it, the app still works — you just trigger sync manually via the Resync button or `/debug`.

---

## Useful pages

| URL | What |
|---|---|
| `/` | Dashboard with kanban board |
| `/applications` | Table view |
| `/interviews` | Calendar of upcoming + past interviews |
| `/inbox` | Raw parsed email feed |
| `/debug` | Sync diagnostics — see Gmail API status, OAuth scope, Gemini verdicts on samples |
| `/login` | Sign-in page |

---

## Deployment

### Vercel — important caveat

The current setup uses **SQLite via better-sqlite3**, which **does not work on Vercel's serverless runtime** (no persistent filesystem). To deploy on Vercel you must swap the DB:

**Recommended: Turso (libSQL — SQLite-compatible, cloud-hosted)**

Minimal code change. Replace `db/client.ts`:

```ts
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export const db = drizzle(client, { schema });
```

Install `@libsql/client` and update `drizzle.config.ts` to dialect `"turso"`. Then:

1. `turso db create dossier`
2. `turso db tokens create dossier`
3. Set `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` in Vercel env
4. Set all other env vars from `.env.example`
5. Set `BETTER_AUTH_URL` to your Vercel URL
6. Update Google OAuth redirect URI to `https://your-app.vercel.app/api/auth/callback/google`
7. Deploy

**Alternative: Vercel Postgres / Neon** — heavier migration (schema changes from `text` to `varchar`, timestamps need timezone), but native to Vercel.

### Self-host (works as-is)

- **Railway / Fly.io / Render / VPS with persistent disk** — SQLite works out of the box. Just set the env vars and run `npm run build && npm start`.

---

## Project structure

```
app/
  actions/             Server actions (applications, sync, preferences, debug)
  api/auth/[...all]/   Better Auth handler
  api/inngest/         Inngest function registry
  debug/               Sync diagnostics page
  login/               Sign-in
  ...                  Dashboard, /applications, /interviews, /inbox
components/            UI components (kanban, table, timeline, dialogs)
db/
  schema.ts            Drizzle schema (7 tables)
  client.ts            DB client singleton
lib/
  auth.ts              Better Auth config
  gmail.ts             Gmail API client (search query + decode)
  parser.ts            Gemini 1.5 Flash bilingual email parser
  sync.ts              The orchestrator: fetch → parse → upsert
  inngest-functions.ts Background jobs
  store.tsx            Client-side store (applications, search, prefs)
```

---

## How the parser works

1. **Gmail search** — fetches messages matching a multilingual job-keyword query (`Bewerbung`, `Vorstellungsgespräch`, `application`, `interview`, etc.) plus HR sender prefixes (`bewerbung@`, `recruiting@`, `karriere@`, `hr@`).
2. **Gemini extraction** — sends each full email to `gemini-1.5-flash` with a system prompt that includes worked examples of German rejections, interview invites, and marketing email (so Wise/LinkedIn-digest noise is correctly excluded).
3. **Heuristic safety net** — if Gemini returns low confidence, a content-pattern fallback scans subject + body for explicit rejection idioms (`absagen`, `nicht weiter berücksichtigen`, `viel Erfolg bei der Suche`) so emails are never miscategorized as "applied" when they're actually rejections.

See [`lib/parser.ts`](lib/parser.ts) and [`lib/sync.ts`](lib/sync.ts) for the full logic.

---

## Scripts

```bash
npm run dev           # local dev
npm run build         # production build
npm start             # serve production build
npm run db:push       # apply schema changes to SQLite
npm run db:studio     # browse the DB visually
npm run inngest:dev   # start local Inngest server
```

---

## License

MIT — do what you want.
