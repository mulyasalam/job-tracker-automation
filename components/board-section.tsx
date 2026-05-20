"use client";

import { useState } from "react";
import { LayoutGrid, Table2, GitCommit, type LucideIcon } from "lucide-react";
import { KanbanBoard } from "./kanban-board";
import { ApplicationsTable } from "./applications-table";
import { ApplicationsTimeline } from "./applications-timeline";

type View = "kanban" | "table" | "timeline";

const VIEWS: { key: View; label: string; icon: LucideIcon }[] = [
  { key: "kanban", label: "Kanban", icon: LayoutGrid },
  { key: "table", label: "Table", icon: Table2 },
  { key: "timeline", label: "Timeline", icon: GitCommit },
];

export function BoardSection() {
  const [view, setView] = useState<View>("kanban");

  return (
    <>
      <section className="px-8 pt-6 pb-2 flex items-baseline justify-between rule-bottom">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-ash">Section II</div>
          <h2 className="font-display text-3xl font-bold tracking-tightest mt-1">The Board</h2>
        </div>
        <div className="flex items-center gap-0 font-mono text-[10px] uppercase tracking-[0.18em] border border-ink/20">
          {VIEWS.map((v) => {
            const Icon = v.icon;
            const active = view === v.key;
            return (
              <button
                key={v.key}
                onClick={() => setView(v.key)}
                className={`px-3 py-2 flex items-center gap-2 transition-colors ${
                  active ? "bg-ink text-paper" : "text-ash hover:bg-ink/5"
                }`}
              >
                <Icon className="w-3 h-3" strokeWidth={1.5} />
                {v.label}
              </button>
            );
          })}
        </div>
      </section>

      <div key={view} className="animate-fade-up">
        {view === "kanban" && <KanbanBoard />}
        {view === "table" && <ApplicationsTable />}
        {view === "timeline" && <ApplicationsTimeline />}
      </div>
    </>
  );
}
