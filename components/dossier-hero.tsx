"use client";

import { useStore } from "@/lib/store";

export function DossierHero() {
  const { filteredApplications: applications } = useStore();
  const total = applications.length;
  const inProgress = applications.filter((a) => a.status === "interviewing").length;
  const hired = applications.filter((a) => a.status === "hired").length;
  const rejected = applications.filter((a) => a.status === "rejected").length;
  const responseRate = total === 0 ? 0 : Math.round(
    (applications.filter((a) => a.emails.length > 1).length / total) * 100,
  );
  const upcoming = applications.flatMap((a) => a.interviews).filter((i) => new Date(i.scheduledAt) > new Date()).length;

  return (
    <section className="px-8 pt-8 pb-2">
      <div className="grid grid-cols-12 gap-6 rule-bottom pb-8">
        <div className="col-span-12 lg:col-span-7">
          <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-vermilion mb-3">
            Lead Story · Spring 2026
          </div>
          <h1 className="font-display text-[64px] xl:text-[78px] font-bold leading-[0.95] tracking-tightest text-ink">
            {total} irons,<br />
            <span className="italic text-vermilion">{inProgress}</span> in the fire.
          </h1>
          <p className="mt-5 font-display text-[17px] italic text-ink/70 leading-relaxed max-w-[460px]">
            Your inbox has been read and filed. Below is the state of the search, organized as a daily edition. No spreadsheets. No copy-paste.
          </p>
          <div className="mt-6 flex items-center gap-4 text-[12px] text-ash">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-moss animate-pulse-dot" />
              <span className="font-mono uppercase tracking-[0.18em]">Live · auto-sync on</span>
            </span>
            <span className="font-mono uppercase tracking-[0.18em]">·</span>
            <span className="font-mono uppercase tracking-[0.18em]">Last reading: 2 min ago</span>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5 grid grid-cols-2 gap-x-6 gap-y-5 lg:border-l rule lg:pl-8">
          <Figure value={total} label="Applications filed" big />
          <Figure value={inProgress} label="In active process" accent />
          <Figure value={`${responseRate}%`} label="Response rate" />
          <Figure value={upcoming} label="Interviews ahead" />
          <Figure value={hired} label="Offers received" tone="moss" />
          <Figure value={rejected} label="Closed loops" tone="muted" />
        </div>
      </div>
    </section>
  );
}

function Figure({
  value,
  label,
  big,
  accent,
  tone,
}: {
  value: number | string;
  label: string;
  big?: boolean;
  accent?: boolean;
  tone?: "moss" | "muted";
}) {
  const valColor = accent
    ? "text-vermilion"
    : tone === "moss"
    ? "text-moss"
    : tone === "muted"
    ? "text-ink/40"
    : "text-ink";
  return (
    <div className="flex flex-col">
      <div className={`font-display font-bold tabular leading-none ${valColor} ${big ? "text-6xl" : "text-5xl"}`}>
        {typeof value === "number" ? value.toString().padStart(2, "0") : value}
      </div>
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-ash mt-2">{label}</div>
    </div>
  );
}
