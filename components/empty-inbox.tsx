"use client";

import { RefreshCw, Mail, Sparkles } from "lucide-react";
import { useStore } from "@/lib/store";

export function EmptyInbox() {
  const { applications, isBackendActive, syncing, triggerSync, syncMessage } = useStore();

  if (!isBackendActive || applications.length > 0) return null;

  return (
    <section className="px-8 py-16">
      <div className="max-w-[680px] mx-auto text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-vermilion mb-4">
          ¶ Section A · The First Read
        </div>
        <h2 className="font-display text-5xl font-bold tracking-tightest leading-[1.05]">
          Your archive is<br />
          <span className="italic text-ash">empty.</span>
        </h2>
        <p className="mt-5 font-display italic text-[16px] text-ink/70 leading-relaxed max-w-[480px] mx-auto">
          We haven&apos;t read your inbox yet — or there&apos;s nothing job-related in the last few months. Click below to scan now.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={triggerSync}
            disabled={syncing}
            className="flex items-center gap-2 bg-ink text-paper px-6 py-3 text-[14px] font-medium hover:bg-vermilion transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} strokeWidth={2} />
            {syncing ? "Reading…" : "Scan inbox now"}
          </button>
        </div>

        {syncMessage && (
          <div className="mt-6 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-moss">
            <Sparkles className="w-3 h-3" strokeWidth={2} />
            {syncMessage}
          </div>
        )}

        <div className="mt-12 rule-top pt-6 grid grid-cols-3 gap-4 text-left">
          <div className="flex items-start gap-2">
            <Mail className="w-3.5 h-3.5 mt-0.5 text-ash shrink-0" strokeWidth={1.5} />
            <div className="text-[11px] text-ash leading-snug">
              Reads Gmail with read-only OAuth. Nothing is sent or deleted.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 mt-0.5 text-vermilion shrink-0" strokeWidth={1.5} />
            <div className="text-[11px] text-ash leading-snug">
              Gemini extracts company, role, status, and interview dates.
            </div>
          </div>
          <div className="flex items-start gap-2">
            <RefreshCw className="w-3.5 h-3.5 mt-0.5 text-ash shrink-0" strokeWidth={1.5} />
            <div className="text-[11px] text-ash leading-snug">
              Resyncs every 15 minutes once Inngest is running.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
