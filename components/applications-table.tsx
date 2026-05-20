"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { ApplicationDetail } from "./application-detail";
import { CompanyMark } from "@/components/ui/company-mark";
import { StatusStamp } from "@/components/ui/status-stamp";
import { formatDate, timeAgo } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import type { Application } from "@/lib/mock-data";

export function ApplicationsTable() {
  const { filteredApplications: applications } = useStore();
  const [selected, setSelected] = useState<Application | null>(null);

  const sorted = [...applications].sort(
    (a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime(),
  );

  return (
    <>
      <section className="px-8 py-6">
        <div className="paper-card overflow-hidden">
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
          <div>
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
      <ApplicationDetail app={selected} onClose={() => setSelected(null)} />
    </>
  );
}
