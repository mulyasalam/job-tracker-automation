"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { ApplicationDetail } from "./application-detail";
import { CompanyMark } from "@/components/ui/company-mark";
import { StatusStamp } from "@/components/ui/status-stamp";
import { formatDate, timeAgo } from "@/lib/utils";
import type { Application } from "@/lib/mock-data";

const STATUS_DOT: Record<string, string> = {
  applied: "bg-ash",
  interviewing: "bg-vermilion",
  hired: "bg-moss",
  rejected: "bg-oxblood/50",
};

export function ApplicationsTimeline() {
  const { filteredApplications: applications } = useStore();
  const [selected, setSelected] = useState<Application | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, Application[]>();
    const sorted = [...applications].sort(
      (a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime(),
    );
    for (const app of sorted) {
      const d = new Date(app.appliedAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(app);
    }
    return Array.from(map.entries()).map(([key, items]) => {
      const [y, m] = key.split("-").map(Number);
      return {
        key,
        label: new Date(y, m).toLocaleString("en-US", { month: "long", year: "numeric" }),
        items,
      };
    });
  }, [applications]);

  return (
    <>
      <section className="px-8 py-8">
        <div className="relative max-w-[860px] mx-auto">
          {/* Spine */}
          <div className="absolute left-[120px] top-2 bottom-2 w-px bg-ink/15" />

          <div className="space-y-12">
            {grouped.map((group, gIdx) => (
              <div key={group.key} className="relative" style={{ animationDelay: `${gIdx * 80}ms` }}>
                {/* Month label */}
                <div className="grid grid-cols-[120px_1fr] gap-8 items-start mb-5">
                  <div className="text-right pr-4">
                    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-ash mb-1">
                      Era
                    </div>
                    <div className="font-display text-2xl font-bold tracking-tightest leading-none text-ink">
                      {group.label.split(" ")[0]}
                    </div>
                    <div className="font-mono text-[11px] text-ash mt-1 tabular">
                      {group.label.split(" ")[1]}
                    </div>
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-ash pt-2 pl-6">
                    {group.items.length} {group.items.length === 1 ? "entry" : "entries"}
                  </div>
                </div>

                {/* Entries */}
                <div className="space-y-3">
                  {group.items.map((app, i) => (
                    <button
                      key={app.id}
                      onClick={() => setSelected(app)}
                      className="w-full grid grid-cols-[120px_1fr] gap-8 items-center group text-left animate-fade-up"
                      style={{ animationDelay: `${gIdx * 80 + i * 50}ms` }}
                    >
                      {/* Date column */}
                      <div className="text-right pr-4">
                        <div className="font-display text-3xl font-bold tabular leading-none text-ink/70 group-hover:text-ink transition-colors">
                          {new Date(app.appliedAt).getDate().toString().padStart(2, "0")}
                        </div>
                        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash mt-1">
                          {timeAgo(app.appliedAt)}
                        </div>
                      </div>

                      {/* Spine dot */}
                      <div className="relative">
                        <span
                          className={`absolute -left-[26px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full ${STATUS_DOT[app.status]} ring-4 ring-paper`}
                        />

                        {/* Card */}
                        <div className="paper-card px-4 py-3 flex items-center gap-4 group-hover:translate-x-1 group-hover:shadow-md transition-all">
                          <CompanyMark name={app.company} color={app.logoColor} size={36} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-3">
                              <span className="font-display text-lg font-bold tracking-tightest leading-tight truncate group-hover:text-vermilion transition-colors">
                                {app.company}
                              </span>
                              <span className="text-[12px] text-ash truncate">{app.jobTitle}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
                              <span>{app.location}</span>
                              <span>·</span>
                              <span>{app.source}</span>
                              {app.emails.length > 0 && (
                                <>
                                  <span>·</span>
                                  <span>{app.emails.length} {app.emails.length === 1 ? "msg" : "msgs"}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="shrink-0">
                            <StatusStamp status={app.status} />
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Start marker */}
            <div className="grid grid-cols-[120px_1fr] gap-8 items-center">
              <div className="text-right pr-4 font-mono text-[10px] uppercase tracking-[0.22em] text-ash">
                ⊥ Origin
              </div>
              <div className="relative">
                <span className="absolute -left-[26px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-ink ring-4 ring-paper" />
                <div className="font-display italic text-ash text-[14px]">
                  The job hunt begins.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <ApplicationDetail app={selected} onClose={() => setSelected(null)} />
    </>
  );
}
