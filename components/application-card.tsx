"use client";

import { CompanyMark } from "@/components/ui/company-mark";
import type { Application } from "@/lib/mock-data";
import { timeAgo } from "@/lib/utils";
import { CalendarClock, Mail, Sparkles, MapPin } from "lucide-react";

export function ApplicationCard({
  app,
  onOpen,
  index = 0,
  draggable = false,
  onDragStart,
  onDragEnd,
}: {
  app: Application;
  onOpen: (app: Application) => void;
  index?: number;
  draggable?: boolean;
  onDragStart?: (app: Application) => void;
  onDragEnd?: () => void;
}) {
  const upcomingInterview = app.interviews
    .filter((i) => new Date(i.scheduledAt) > new Date())
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0];

  const lastEmail = app.emails[app.emails.length - 1];
  const isHot = app.status === "interviewing" && upcomingInterview;

  return (
    <article
      onClick={() => onOpen(app)}
      draggable={draggable}
      onDragStart={(e) => {
        if (!draggable) return;
        e.dataTransfer.setData("text/plain", app.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart?.(app);
      }}
      onDragEnd={() => onDragEnd?.()}
      style={{ animationDelay: `${index * 60}ms` }}
      className={`group cursor-pointer paper-card animate-fade-up p-4 hover:translate-y-[-2px] hover:shadow-lg transition-all relative ${draggable ? "active:cursor-grabbing" : ""}`}
    >
      {/* Tape strip for "hot" applications */}
      {isHot && (
        <div className="absolute -top-2 left-6 px-2 py-0.5 bg-vermilion text-paper font-mono text-[9px] uppercase tracking-[0.18em] rotate-[-2deg]">
          Active Thread
        </div>
      )}

      <div className="flex items-start gap-3">
        <CompanyMark name={app.company} color={app.logoColor} size={36} />
        <div className="min-w-0 flex-1">
          <div className="font-display text-lg font-semibold leading-[1.1] text-ink tracking-tightest">
            {app.company}
          </div>
          <div className="text-[13px] text-ink/80 leading-snug mt-0.5">
            {app.jobTitle}
          </div>
        </div>
      </div>

      {/* Metadata grid */}
      <div className="mt-3 pt-3 rule-top space-y-1.5">
        <Row icon={<MapPin className="w-3 h-3" strokeWidth={1.5} />} text={app.location} />
        {upcomingInterview && (
          <Row
            icon={<CalendarClock className="w-3 h-3 text-vermilion" strokeWidth={1.5} />}
            text={
              <span className="text-vermilion font-medium">
                {new Intl.DateTimeFormat("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                }).format(new Date(upcomingInterview.scheduledAt))}
              </span>
            }
          />
        )}
        {lastEmail && !upcomingInterview && (
          <Row
            icon={<Mail className="w-3 h-3" strokeWidth={1.5} />}
            text={`${timeAgo(lastEmail.receivedAt)} · ${lastEmail.subject}`}
          />
        )}
      </div>

      {/* AI confidence ribbon */}
      <div className="mt-3 pt-2 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.2em] text-ash">
        <span className="flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5 text-vermilion" strokeWidth={2} />
          Auto-tracked
        </span>
        <span>№ {app.id.toUpperCase().replace("A-", "")}</span>
      </div>
    </article>
  );
}

function Row({ icon, text }: { icon: React.ReactNode; text: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[12px] text-ash">
      <span className="text-ash">{icon}</span>
      <span className="truncate">{text}</span>
    </div>
  );
}
