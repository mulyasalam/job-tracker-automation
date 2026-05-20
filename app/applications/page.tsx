"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/top-bar";
import { CompanyMark } from "@/components/ui/company-mark";
import { StatusStamp } from "@/components/ui/status-stamp";
import { ApplicationDetail } from "@/components/application-detail";
import { type Application } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { formatDate, timeAgo } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export default function ApplicationsPage() {
  const { filteredApplications: applications, searchQuery, applications: allApplications } = useStore();
  const [selected, setSelected] = useState<Application | null>(null);
  const [sortBy] = useState<"recent" | "name">("recent");

  const sorted = [...applications].sort((a, b) =>
    sortBy === "recent"
      ? new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
      : a.company.localeCompare(b.company),
  );

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <TopBar title="The Index" edition="Tabular Reading" />

        <section className="px-8 py-8 rule-bottom">
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-vermilion mb-3">
            Index · All entries
          </div>
          <h1 className="font-display text-5xl font-bold leading-none tracking-tightest">
            The complete record.
          </h1>
          <p className="mt-3 font-display text-[16px] italic text-ink/70 max-w-[520px]">
            Every application, in chronological order. Click a row to open its dossier.
          </p>
        </section>

        <section className="px-8 py-6">
          <div className="paper-card overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[40px_2fr_2fr_1.2fr_1fr_120px_100px] gap-3 px-5 py-3 rule-bottom bg-bone/40 font-mono text-[10px] uppercase tracking-[0.2em] text-ash items-center">
              <span>№</span>
              <span className="flex items-center gap-1 cursor-pointer hover:text-ink">
                Company <ChevronDown className="w-3 h-3" />
              </span>
              <span>Role</span>
              <span>Location</span>
              <span>Last activity</span>
              <span>Status</span>
              <span className="text-right">Filed</span>
            </div>

            {/* Rows */}
            <div>
              {sorted.length === 0 && (
                <div className="px-5 py-10 text-center text-ash italic text-[13px]">
                  {searchQuery
                    ? `No applications match "${searchQuery}". ${allApplications.length} total in the archive.`
                    : "No applications filed yet."}
                </div>
              )}
              {sorted.map((app, i) => (
                <button
                  key={app.id}
                  onClick={() => setSelected(app)}
                  className="w-full grid grid-cols-[40px_2fr_2fr_1.2fr_1fr_120px_100px] gap-3 px-5 py-4 rule-bottom last:border-b-0 items-center hover:bg-bone/30 transition-colors text-left group"
                >
                  <span className="font-mono text-[11px] text-ash tabular">
                    {(i + 1).toString().padStart(2, "0")}
                  </span>
                  <span className="flex items-center gap-3 min-w-0">
                    <CompanyMark name={app.company} color={app.logoColor} size={32} />
                    <span className="min-w-0">
                      <span className="block font-display text-[15px] font-semibold tracking-tightest truncate group-hover:text-vermilion transition-colors">
                        {app.company}
                      </span>
                      <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
                        {app.source}
                      </span>
                    </span>
                  </span>
                  <span className="text-[13px] truncate">{app.jobTitle}</span>
                  <span className="text-[12px] text-ash truncate">{app.location}</span>
                  <span className="text-[12px] text-ash">{timeAgo(app.lastActivityAt)}</span>
                  <span><StatusStamp status={app.status} /></span>
                  <span className="text-[11px] font-mono text-ash text-right">
                    {formatDate(app.appliedAt, { month: "short", day: "numeric" })}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>

      <ApplicationDetail app={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
