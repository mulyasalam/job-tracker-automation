"use client";

import { useState, useMemo } from "react";
import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/top-bar";
import { CompanyMark } from "@/components/ui/company-mark";
import { ApplicationDetail } from "@/components/application-detail";
import { type Application, type InterviewRecord } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { Bell, MapPin, Video, Phone, FileText, Building } from "lucide-react";

const TYPE_ICON = {
  phone: Phone,
  video: Video,
  onsite: Building,
  assessment: FileText,
};

export default function InterviewsPage() {
  const { filteredApplications: applications } = useStore();
  const [selected, setSelected] = useState<Application | null>(null);

  const events = useMemo(() => {
    return applications
      .flatMap((app) =>
        app.interviews.map((iv) => ({ iv, app })),
      )
      .sort((a, b) => new Date(a.iv.scheduledAt).getTime() - new Date(b.iv.scheduledAt).getTime());
  }, [applications]);

  const upcoming = events.filter((e) => new Date(e.iv.scheduledAt) >= new Date());
  const past = events.filter((e) => new Date(e.iv.scheduledAt) < new Date());

  // Group upcoming by week
  const grouped = groupByWeek(upcoming);

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <TopBar title="The Calendar" edition="Scheduled Conversations" />

        {/* Hero stats */}
        <section className="px-8 py-8 rule-bottom grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-7">
            <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-vermilion mb-3">
              Section III · Calendar
            </div>
            <h1 className="font-display text-6xl font-bold leading-[0.95] tracking-tightest">
              {upcoming.length === 0 ? (
                <>The calendar is <span className="italic text-ash">quiet</span>.</>
              ) : (
                <>
                  <span className="text-vermilion">{upcoming.length}</span> conversations<br />
                  on the horizon.
                </>
              )}
            </h1>
            <p className="mt-4 font-display text-[16px] italic text-ink/70 max-w-[480px]">
              Reminders fire automatically — one day prior, and again two hours before. The system reads your inbox so you don't forget.
            </p>
          </div>
          <div className="col-span-12 lg:col-span-5 lg:border-l rule lg:pl-8 flex flex-col justify-end">
            <div className="flex items-baseline gap-6">
              <div>
                <div className="font-display text-6xl font-bold tabular leading-none text-ink">
                  {upcoming.length.toString().padStart(2, "0")}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-ash mt-2">
                  Upcoming
                </div>
              </div>
              <div>
                <div className="font-display text-6xl font-bold tabular leading-none text-ash/40">
                  {past.length.toString().padStart(2, "0")}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-ash mt-2">
                  Completed
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Schedule */}
        <section className="px-8 py-6 space-y-10">
          {grouped.map((group) => (
            <div key={group.label}>
              <div className="rule-bottom pb-2 mb-5 flex items-baseline justify-between">
                <h2 className="font-display text-2xl font-bold tracking-tightest">{group.label}</h2>
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ash">
                  {group.items.length} {group.items.length === 1 ? "entry" : "entries"}
                </span>
              </div>
              <div className="space-y-3">
                {group.items.map(({ iv, app }) => (
                  <InterviewListItem
                    key={iv.id}
                    iv={iv}
                    app={app}
                    onOpen={() => setSelected(app)}
                  />
                ))}
              </div>
            </div>
          ))}

          {past.length > 0 && (
            <div>
              <div className="rule-bottom pb-2 mb-5">
                <h2 className="font-display text-2xl font-bold tracking-tightest text-ash">Archived</h2>
              </div>
              <div className="space-y-3 opacity-70">
                {past.slice(0, 5).map(({ iv, app }) => (
                  <InterviewListItem
                    key={iv.id}
                    iv={iv}
                    app={app}
                    onOpen={() => setSelected(app)}
                    archived
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      <ApplicationDetail app={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function InterviewListItem({
  iv,
  app,
  onOpen,
  archived,
}: {
  iv: InterviewRecord;
  app: Application;
  onOpen: () => void;
  archived?: boolean;
}) {
  const date = new Date(iv.scheduledAt);
  const Icon = TYPE_ICON[iv.type];
  return (
    <button
      onClick={onOpen}
      className="w-full paper-card p-5 flex items-center gap-5 hover:translate-y-[-1px] hover:shadow-md transition-all text-left group"
    >
      {/* Date block */}
      <div className="text-center shrink-0 w-16 border-r rule pr-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
          {date.toLocaleString("en-US", { weekday: "short" })}
        </div>
        <div className="font-display text-4xl font-bold tabular leading-none mt-1">
          {date.getDate()}
        </div>
        <div className="font-mono text-[10px] text-ash tabular mt-1">
          {date.toLocaleString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
        </div>
      </div>

      {/* Company mark */}
      <CompanyMark name={app.company} color={app.logoColor} size={44} />

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-xl font-bold tracking-tightest leading-tight">
            {app.company}
          </span>
          <span className="text-[12px] text-ash truncate">{app.jobTitle}</span>
        </div>
        <div className="text-[14px] text-ink/85 mt-1 truncate">{iv.title}</div>
        <div className="flex items-center gap-4 mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
          <span className="flex items-center gap-1.5">
            <Icon className="w-3 h-3" strokeWidth={1.5} />
            {iv.type} · {iv.durationMins}m
          </span>
          {iv.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3" strokeWidth={1.5} />
              {iv.location}
            </span>
          )}
        </div>
      </div>

      {/* Reminder status */}
      {!archived && (
        <div className="shrink-0">
          {iv.isReminded ? (
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-moss border border-moss/40 px-2 py-1 flex items-center gap-1.5">
              <Bell className="w-3 h-3" strokeWidth={1.5} /> Notified
            </span>
          ) : (
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ochre border border-ochre/40 px-2 py-1 flex items-center gap-1.5">
              <Bell className="w-3 h-3" strokeWidth={1.5} /> Queued
            </span>
          )}
        </div>
      )}
    </button>
  );
}

function groupByWeek(events: { iv: InterviewRecord; app: Application }[]) {
  const groups: { label: string; items: { iv: InterviewRecord; app: Application }[] }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const todayItems = events.filter((e) => {
    const d = new Date(e.iv.scheduledAt);
    return d >= today && d < tomorrow;
  });
  const weekItems = events.filter((e) => {
    const d = new Date(e.iv.scheduledAt);
    return d >= tomorrow && d < weekEnd;
  });
  const laterItems = events.filter((e) => new Date(e.iv.scheduledAt) >= weekEnd);

  if (todayItems.length) groups.push({ label: "Today", items: todayItems });
  if (weekItems.length) groups.push({ label: "This Week", items: weekItems });
  if (laterItems.length) groups.push({ label: "Later", items: laterItems });
  return groups;
}
