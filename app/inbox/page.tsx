"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/top-bar";
import { ApplicationDetail } from "@/components/application-detail";
import { CompanyMark } from "@/components/ui/company-mark";
import { type Application } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { timeAgo } from "@/lib/utils";
import { ArrowDownLeft, ArrowUpRight, Sparkles } from "lucide-react";

export default function InboxPage() {
  const { filteredApplications: applications } = useStore();
  const [selected, setSelected] = useState<Application | null>(null);

  const allEmails = applications
    .flatMap((app) => app.emails.map((e) => ({ e, app })))
    .sort((a, b) => new Date(b.e.receivedAt).getTime() - new Date(a.e.receivedAt).getTime());

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <TopBar title="The Inbox" edition="Parsed Correspondence" />

        <section className="px-8 py-8 rule-bottom">
          <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-vermilion mb-3 flex items-center gap-2">
            <Sparkles className="w-3 h-3" strokeWidth={2} /> AI · Gemini 1.5 Flash · Reading silently
          </div>
          <h1 className="font-display text-5xl font-bold leading-[1] tracking-tightest">
            {allEmails.length} messages, <br />
            <span className="italic text-ash">all filed</span>.
          </h1>
        </section>

        <section className="px-8 py-6">
          <div className="paper-card">
            {allEmails.map(({ e, app }, i) => (
              <button
                key={e.id}
                onClick={() => setSelected(app)}
                className="w-full grid grid-cols-[40px_1.5fr_3fr_120px] gap-4 items-center px-5 py-4 rule-bottom last:border-b-0 hover:bg-bone/30 transition-colors text-left group"
              >
                <span
                  className={`w-7 h-7 rounded-full grid place-items-center shrink-0 ${
                    e.direction === "incoming" ? "bg-vermilion text-paper" : "bg-ink text-paper"
                  }`}
                >
                  {e.direction === "incoming" ? (
                    <ArrowDownLeft className="w-3 h-3" strokeWidth={2.5} />
                  ) : (
                    <ArrowUpRight className="w-3 h-3" strokeWidth={2.5} />
                  )}
                </span>
                <span className="flex items-center gap-2.5 min-w-0">
                  <CompanyMark name={app.company} color={app.logoColor} size={26} />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium truncate group-hover:text-vermilion transition-colors">
                      {e.sender}
                    </span>
                    <span className="block font-mono text-[10px] text-ash truncate">{app.company}</span>
                  </span>
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-[15px] font-semibold truncate">
                    {e.subject}
                  </span>
                  <span className="block text-[12px] text-ash truncate">{e.snippet}</span>
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash text-right">
                  {timeAgo(e.receivedAt)}
                </span>
              </button>
            ))}
          </div>
        </section>
      </main>
      <ApplicationDetail app={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
