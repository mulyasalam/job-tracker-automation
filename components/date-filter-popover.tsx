"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Calendar, ChevronDown, Check, X } from "lucide-react";
import { useState } from "react";
import { useStore } from "@/lib/store";
import {
  ALL_TIME,
  describeDateFilter,
  type DateFilter,
  type DateFilterMode,
} from "@/lib/date-filter";

const QUICK: { mode: DateFilterMode; label: string; description: string }[] = [
  { mode: "all", label: "All time", description: "Everything ever filed" },
  { mode: "today", label: "Today", description: "Activity in the last 24h" },
  { mode: "week", label: "This week", description: "Mon – Sun" },
  { mode: "month", label: "This month", description: "Calendar month" },
];

export function DateFilterPopover() {
  const { dateFilter, setDateFilter, filteredApplications, applications } = useStore();
  const [tab, setTab] = useState<"quick" | "date" | "range">("quick");
  const [localDate, setLocalDate] = useState(dateFilter.date ?? "");
  const [localStart, setLocalStart] = useState(dateFilter.startDate ?? "");
  const [localEnd, setLocalEnd] = useState(dateFilter.endDate ?? "");

  const isActive = dateFilter.mode !== "all";
  const label = describeDateFilter(dateFilter);

  const apply = (f: DateFilter) => {
    setDateFilter(f);
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className={`flex items-center gap-2 px-3 py-2 text-[12px] border transition-colors ${
            isActive
              ? "border-vermilion text-vermilion bg-vermilion/5"
              : "border-ink/15 text-ash hover:border-ink hover:text-ink"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span className="font-mono uppercase tracking-[0.15em] text-[10px]">{label}</span>
          {isActive && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                apply(ALL_TIME);
              }}
              className="ml-1 hover:text-ink"
              aria-label="Clear date filter"
            >
              <X className="w-3 h-3" strokeWidth={2} />
            </span>
          )}
          {!isActive && <ChevronDown className="w-3 h-3" strokeWidth={1.5} />}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="bg-paper border border-ink/15 shadow-xl w-[320px] z-50"
        >
          {/* Tabs */}
          <div className="flex border-b border-ink/10">
            {[
              { key: "quick" as const, label: "Quick" },
              { key: "date" as const, label: "Single date" },
              { key: "range" as const, label: "Range" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 py-2 text-[11px] font-mono uppercase tracking-[0.18em] transition-colors ${
                  tab === t.key ? "bg-ink text-paper" : "text-ash hover:text-ink"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "quick" && (
            <div className="py-2">
              {QUICK.map((opt) => {
                const active = dateFilter.mode === opt.mode;
                return (
                  <DropdownMenu.Item
                    key={opt.mode}
                    onSelect={() => apply({ mode: opt.mode })}
                    className={`flex items-start gap-3 px-3 py-2 text-[13px] cursor-pointer outline-none hover:bg-cream ${
                      active ? "bg-cream" : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{opt.label}</div>
                      <div className="text-[11px] text-ash">{opt.description}</div>
                    </div>
                    {active && <Check className="w-3.5 h-3.5 text-vermilion mt-0.5" strokeWidth={2} />}
                  </DropdownMenu.Item>
                );
              })}
            </div>
          )}

          {tab === "date" && (
            <div className="p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
              <label className="block">
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-ash mb-1.5">
                  Pick a date
                </div>
                <input
                  type="date"
                  value={localDate}
                  onChange={(e) => setLocalDate(e.target.value)}
                  className="w-full bg-cream border border-ink/15 px-3 py-2 text-[13px] focus:border-ink focus:outline-none"
                />
              </label>
              <button
                disabled={!localDate}
                onClick={() => apply({ mode: "date", date: localDate })}
                className="w-full bg-ink text-paper py-2 text-[12px] font-medium hover:bg-vermilion transition-colors disabled:opacity-40"
              >
                Apply
              </button>
            </div>
          )}

          {tab === "range" && (
            <div className="p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
              <label className="block">
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-ash mb-1.5">
                  From
                </div>
                <input
                  type="date"
                  value={localStart}
                  onChange={(e) => setLocalStart(e.target.value)}
                  max={localEnd || undefined}
                  className="w-full bg-cream border border-ink/15 px-3 py-2 text-[13px] focus:border-ink focus:outline-none"
                />
              </label>
              <label className="block">
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-ash mb-1.5">
                  To
                </div>
                <input
                  type="date"
                  value={localEnd}
                  onChange={(e) => setLocalEnd(e.target.value)}
                  min={localStart || undefined}
                  className="w-full bg-cream border border-ink/15 px-3 py-2 text-[13px] focus:border-ink focus:outline-none"
                />
              </label>
              <button
                disabled={!localStart || !localEnd}
                onClick={() => apply({ mode: "range", startDate: localStart, endDate: localEnd })}
                className="w-full bg-ink text-paper py-2 text-[12px] font-medium hover:bg-vermilion transition-colors disabled:opacity-40"
              >
                Apply
              </button>
            </div>
          )}

          {isActive && (
            <div className="border-t border-ink/10 px-3 py-2 flex items-center justify-between text-[11px]">
              <span className="font-mono text-ash uppercase tracking-[0.18em]">
                {filteredApplications.length} / {applications.length} match
              </span>
              <button
                onClick={() => apply(ALL_TIME)}
                className="text-ash hover:text-vermilion font-mono uppercase tracking-[0.18em]"
              >
                Clear
              </button>
            </div>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
