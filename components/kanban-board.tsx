"use client";

import { useState } from "react";
import { statusColumns, type Application, type ApplicationStatus } from "@/lib/mock-data";
import { useStore } from "@/lib/store";
import { ApplicationCard } from "./application-card";
import { ApplicationDetail } from "./application-detail";
import { cn } from "@/lib/utils";

const COLUMN_ACCENT: Record<string, string> = {
  applied: "text-ash",
  interviewing: "text-vermilion",
  hired: "text-moss",
  rejected: "text-oxblood/60",
};

export function KanbanBoard() {
  const { filteredApplications: applications, updateApplication } = useStore();
  const [selected, setSelected] = useState<Application | null>(null);
  const [dragging, setDragging] = useState<Application | null>(null);
  const [dragOverCol, setDragOverCol] = useState<ApplicationStatus | null>(null);

  const handleDrop = (target: ApplicationStatus) => {
    if (dragging && dragging.status !== target) {
      updateApplication(dragging.id, { status: target });
    }
    setDragging(null);
    setDragOverCol(null);
  };

  return (
    <>
      <section className="px-8 pb-12 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {statusColumns.map((col, colIdx) => {
            const items = applications.filter((a) => a.status === col.key);
            const isDropTarget = dragOverCol === col.key && dragging?.status !== col.key;
            return (
              <div
                key={col.key}
                onDragOver={(e) => {
                  if (!dragging) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  setDragOverCol(col.key);
                }}
                onDragLeave={(e) => {
                  if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                  setDragOverCol((c) => (c === col.key ? null : c));
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDrop(col.key);
                }}
                className={cn(
                  "flex flex-col min-h-[200px] transition-colors",
                  isDropTarget && "bg-vermilion/5 outline outline-2 outline-vermilion/40 outline-offset-[-2px]",
                )}
              >
                <div className="flex items-baseline justify-between rule-bottom pb-3 mb-4">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-ash mb-1">
                      Section {String.fromCharCode(65 + colIdx)}
                    </div>
                    <h2 className={cn("font-display text-2xl font-bold leading-none tracking-tightest", COLUMN_ACCENT[col.key])}>
                      {col.label}
                    </h2>
                    <div className="text-[11px] italic text-ash mt-1.5">{col.subtitle}</div>
                  </div>
                  <div className="font-display text-3xl font-bold tabular leading-none text-ink/30">
                    {items.length.toString().padStart(2, "0")}
                  </div>
                </div>
                <div className="space-y-3 flex-1">
                  {items.length === 0 && (
                    <div
                      className={cn(
                        "text-center py-10 text-ash text-[12px] italic font-display border border-dashed transition-colors",
                        isDropTarget ? "border-vermilion text-vermilion" : "border-ink/15",
                      )}
                    >
                      {isDropTarget ? `Drop to mark as ${col.label}` : "— column quiet —"}
                    </div>
                  )}
                  {items.map((app, i) => (
                    <div
                      key={app.id}
                      className={cn(
                        "transition-opacity",
                        dragging?.id === app.id && "opacity-40",
                      )}
                    >
                      <ApplicationCard
                        app={app}
                        index={i}
                        onOpen={setSelected}
                        draggable
                        onDragStart={setDragging}
                        onDragEnd={() => {
                          setDragging(null);
                          setDragOverCol(null);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {dragging && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-ink text-paper px-4 py-2 text-[12px] font-mono uppercase tracking-[0.18em] shadow-xl z-50 pointer-events-none">
            Drop on a column to move {dragging.company}
          </div>
        )}
      </section>

      <ApplicationDetail app={selected} onClose={() => setSelected(null)} />
    </>
  );
}
