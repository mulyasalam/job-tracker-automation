# Setup

End-to-end setup for the backend. ~20 minutes total.

## 1. Copy env file

```bash
cp .env.example .env.local
```

Fill in values as you complete the steps below.

## 2. Database

Already wired — Drizzle + SQLite at `./sqlite.db`. To (re)create tables:

```bash
npm run db:push
```

Inspect data anytime with `npm run db:studio`.

## 3. Better Auth secret

Generate a 32+ character random string:

```bash
# PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
# or any password manager
```

Put it in `.env.local` as `BETTER_AUTH_SECRET`.

## 4. Google OAuth + Gmail API

1. Go to https://console.cloud.google.com/ and create a project (or pick one).
2. Enable the **Gmail API**: https://console.cloud.google.com/apis/library/gmail.googleapis.com
3. Configure OAuth consent screen (External, fill app name + your email).
   - Under **Scopes**, add: `https://www.googleapis.com/auth/gmail.readonly`
   - Under **Test users**, add your own Gmail address.
4. Create credentials → **OAuth client ID** → Web application.
   - Authorized JavaScript origin: `http://localhost:3000`
   - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
5. Copy **Client ID** and **Client secret** into `.env.local`.

## 5. Gemini API

1. Go to https://aistudio.google.com/apikey
2. Create an API key.
3. Put it in `.env.local` as `GEMINI_API_KEY`.

`gemini-1.5-flash` has a generous free tier (15 req/min, 1500 req/day) — plenty for personal use.

## 6. Inngest (background jobs)

**Local dev:** no signup needed. In a separate terminal:

```bash
npm run inngest:dev
```

This starts the Inngest dev server at http://localhost:8288. The Next.js app auto-registers its functions with it.

**Production:** sign up at https://app.inngest.com, copy `INNGEST_EVENT_KEY` + `INNGEST_SIGNING_KEY` into your hosting env.

## 7. Run

Two terminals:

```bash
# Terminal 1
npm run dev

# Terminal 2 (for background jobs)
npm run inngest:dev
```

Visit http://localhost:3000, sign in with Google, grant Gmail read access. The first backfill runs automatically (last 90 days).

## What happens after sign-in

1. `user.connected` event fires → Inngest backfill job pulls the last 90 days of mail filtered by job-related keywords.
2. Each email is parsed by Gemini → structured `{company, role, status, interviewDate}`.
3. Applications are created or updated; emails attached; interviews scheduled.
4. A recurring cron resyncs every 15 min for new mail.
5. A reminder cron fires interview notifications 24h and 2h before each scheduled event.

## Troubleshooting

- **"Google login redirects to error":** double-check the redirect URI matches exactly (no trailing slash).
- **"No emails synced":** the Gmail search query is conservative — see `lib/gmail.ts`. Adjust `JOB_SEARCH_QUERY` to widen.
- **"Parser fails":** check `GEMINI_API_KEY` and quota at https://aistudio.google.com.
- **"Inngest functions not firing":** make sure `npm run inngest:dev` is running locally.
