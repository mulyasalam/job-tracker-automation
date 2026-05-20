"use client";

import { useState } from "react";
import { debugSync, resetSyncState, type DebugResult } from "@/app/actions/debug";
import { runSyncNow } from "@/app/actions/sync";

export default function DebugPage() {
  const [result, setResult] = useState<DebugResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [syncLog, setSyncLog] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setResult(null);
    const r = await debugSync();
    setResult(r);
    setBusy(false);
  };

  const reset = async () => {
    setBusy(true);
    await resetSyncState();
    setSyncLog("Sync state reset. Now run a fresh sync.");
    setBusy(false);
  };

  const fullSync = async () => {
    setBusy(true);
    setSyncLog("Running 180-day sync…");
    const r = await runSyncNow(180);
    setSyncLog(JSON.stringify(r, null, 2));
    setBusy(false);
  };

  return (
    <div className="min-h-screen p-8 max-w-[920px] mx-auto font-mono text-[13px]">
      <h1 className="font-display text-4xl font-bold tracking-tightest mb-2">Sync diagnostics</h1>
      <p className="text-ash text-[13px] mb-6 font-sans">
        Use this page to check why Gmail emails aren&apos;t showing up. Open the browser console for full payloads.
      </p>

      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={run}
          disabled={busy}
          className="bg-ink text-paper px-4 py-2 hover:bg-vermilion disabled:opacity-60"
        >
          {busy ? "Running…" : "Run diagnostic"}
        </button>
        <button
          onClick={fullSync}
          disabled={busy}
          className="border border-ink/30 hover:border-ink px-4 py-2 disabled:opacity-60"
        >
          Run 180-day sync
        </button>
        <button
          onClick={reset}
          disabled={busy}
          className="border border-oxblood/40 text-oxblood hover:border-oxblood px-4 py-2 disabled:opacity-60"
        >
          Reset lastSyncAt
        </button>
      </div>

      {syncLog && (
        <pre className="bg-cream border border-ink/15 p-4 text-[11px] whitespace-pre-wrap mb-6">
          {syncLog}
        </pre>
      )}

      {result && (
        <div className="space-y-6">
          {result.error && (
            <div className="bg-vermilion/10 border border-vermilion/40 px-4 py-3 text-vermilion">
              <strong>Error:</strong> {result.error}
            </div>
          )}

          <Section title="User">
            <KV k="id" v={result.user?.id} />
            <KV k="email" v={result.user?.email} />
            <KV k="lastSyncAt" v={result.user?.lastSyncAt ?? "(never)"} />
          </Section>

          <Section title="OAuth account">
            <KV k="access token" v={result.oauth?.hasAccessToken ? "✓ stored" : "✗ MISSING"} />
            <KV k="refresh token" v={result.oauth?.hasRefreshToken ? "✓ stored" : "✗ MISSING"} />
            <KV k="expires" v={result.oauth?.expiresAt ?? "—"} />
            <KV k="scope" v={result.oauth?.scope ?? "—"} />
            {!result.oauth?.scope?.includes("gmail.readonly") && result.oauth?.scope && (
              <div className="text-vermilion mt-2">
                ⚠ gmail.readonly scope NOT granted. Sign out, then sign in again and approve all checkboxes.
              </div>
            )}
          </Section>

          <Section title="Gmail API">
            <KV k="profile email" v={result.gmail?.profileEmail ?? "—"} />
            <KV k="total messages in mailbox" v={result.gmail?.totalMessages?.toLocaleString() ?? "—"} />
          </Section>

          <Section title="Search result">
            <KV k="query used" v={result.search?.query ?? "—"} />
            <KV k="matched messages" v={String(result.search?.matched ?? 0)} />
            {result.search && result.search.matched === 0 && (
              <div className="text-vermilion mt-2">
                ⚠ No emails matched. The search is too narrow, OR the OAuth scope doesn&apos;t allow listing your inbox.
              </div>
            )}
            {result.search?.samples?.map((s, i) => (
              <div key={i} className="border-l-2 border-ink/20 pl-3 mt-3 text-[12px]">
                <div><strong>From:</strong> {s.from}</div>
                <div><strong>Subject:</strong> {s.subject}</div>
                <div><strong>Date:</strong> {s.date}</div>
                {s.parsed && (
                  <div className="mt-1 bg-cream p-2">
                    <div>Gemini said: <strong>{s.parsed.isJobRelated ? "✓ job-related" : "✗ not job-related"}</strong></div>
                    <div>Status: {s.parsed.status} · Company: {s.parsed.company ?? "—"} · Confidence: {s.parsed.confidence}</div>
                    <div className="italic text-ash">{s.parsed.reasoning}</div>
                  </div>
                )}
              </div>
            ))}
          </Section>

          <Section title="Database">
            <KV k="applications stored" v={String(result.db?.applications ?? 0)} />
            <KV k="emails stored" v={String(result.db?.emails ?? 0)} />
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-ink/15 p-4">
      <h2 className="font-display text-lg font-bold tracking-tightest mb-3 text-vermilion">{title}</h2>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

function KV({ k, v }: { k: string; v: string | undefined | null }) {
  return (
    <div className="flex gap-3">
      <div className="text-ash w-[180px] shrink-0">{k}</div>
      <div className="break-all">{v ?? "—"}</div>
    </div>
  );
}
