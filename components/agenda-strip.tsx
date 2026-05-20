"use client";

import { useStore } from "@/lib/store";
import { CalendarClock } from "lucide-react";

export function AgendaStrip() {
  const { filteredApplications: applications } = useStore();
  const upcoming = applications
    .flatMap((a) =>
      a.interviews
        .filter((iv) => new Date(iv.scheduledAt) > new Date())
        .map((iv) => ({ iv, app: a })),
    )
    .sort((a, b) => new Date(a.iv.scheduledAt).getTime() - new Date(b.iv.scheduledAt).getTime())
    .slice(0, 4);

  if (upcoming.length === 0) return null;

  return (
    <section className="px-8 py-6 rule-bottom">
      <div className="flex items-baseline justify-between mb-4">
        <div className="flex items-baseline gap-3">
          <h2 className="font-display text-2xl font-bold tracking-tightest">On the Calendar</h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-ash">
            next {upcoming.length} appointments
          </span>
        </div>
        <a href="/interviews" className="text-[12px] font-mono uppercase tracking-[0.18em] text-ash hover:text-vermilion">
          See all →
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {upcoming.map(({ iv, app }, i) => {
          const date = new Date(iv.scheduledAt);
          const isTomorrowOrLess = (date.getTime() - Date.now()) / (1000 * 60 * 60) < 36;
          return (
            <div
              key={iv.id}
              className="paper-card p-4 flex gap-4 relative"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {isTomorrowOrLess && (
                <span className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-vermilion text-paper font-mono text-[9px] uppercase tracking-[0.15em] rotate-[3deg]">
                  Soon
                </span>
              )}
              <div className="text-center shrink-0 px-3 py-2 border-r rule" style={{ borderRightWidth: 1 }}>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
                  {date.toLocaleString("en-US", { month: "short" })}
                </div>
                <div className="font-display text-4xl font-bold tabular leading-none mt-0.5">
                  {date.getDate()}
                </div>
                <div className="font-mono text-[10px] text-ash mt-1 tabular">
                  {date.toLocaleString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display text-base font-semibold leading-tight tracking-tightest truncate">
                  {app.company}
                </div>
                <div className="text-[12px] text-ink/75 truncate leading-snug">{iv.title}</div>
                <div className="flex items-center gap-1.5 mt-2 text-[11px] font-mono uppercase tracking-[0.15em] text-ash">
                  <CalendarClock className="w-3 h-3" strokeWidth={1.5} />
                  {iv.durationMins}m · {iv.type}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
