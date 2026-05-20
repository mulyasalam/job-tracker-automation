"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  X,
  CalendarClock,
  ExternalLink,
  MapPin,
  Briefcase,
  Banknote,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  Pencil,
  Trash2,
  Check,
  ChevronDown,
} from "lucide-react";
import { CompanyMark } from "@/components/ui/company-mark";
import { StatusStamp } from "@/components/ui/status-stamp";
import type { Application, ApplicationStatus } from "@/lib/mock-data";
import { formatDate, timeAgo } from "@/lib/utils";
import { useStore } from "@/lib/store";

const STATUS_OPTIONS: { value: ApplicationStatus; label: string; description: string }[] = [
  { value: "applied", label: "Submitted", description: "Awaiting reply" },
  { value: "interviewing", label: "In Process", description: "Conversations underway" },
  { value: "hired", label: "Offered", description: "Decisions to make" },
  { value: "rejected", label: "Closed", description: "Lessons archived" },
];

export function ApplicationDetail({
  app,
  onClose,
}: {
  app: Application | null;
  onClose: () => void;
}) {
  const { updateApplication, deleteApplication } = useStore();
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [form, setForm] = useState({
    company: "",
    jobTitle: "",
    location: "",
    source: "",
    salary: "",
    notes: "",
  });

  useEffect(() => {
    if (app) {
      document.body.style.overflow = "hidden";
      setForm({
        company: app.company,
        jobTitle: app.jobTitle,
        location: app.location,
        source: app.source,
        salary: app.salary ?? "",
        notes: app.notes ?? "",
      });
      setEditing(false);
      setConfirming(false);
    } else {
      document.body.style.overflow = "";
    }
  }, [app]);

  if (!app) return null;

  const upcomingInterviews = app.interviews.filter((i) => new Date(i.scheduledAt) >= new Date());
  const pastInterviews = app.interviews.filter((i) => new Date(i.scheduledAt) < new Date());

  const saveEdits = async () => {
    await updateApplication(app.id, {
      company: form.company,
      jobTitle: form.jobTitle,
      location: form.location,
      source: form.source,
      salary: form.salary || null,
      notes: form.notes || null,
    });
    setEditing(false);
  };

  const handleDelete = async () => {
    await deleteApplication(app.id);
    setConfirming(false);
    onClose();
  };

  return (
    <Dialog.Root open={!!app} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-ink/40 backdrop-blur-[2px] z-40 data-[state=open]:animate-fade-up" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed top-0 right-0 h-screen w-full max-w-[640px] bg-paper z-50 overflow-y-auto rule shadow-2xl"
          style={{ animation: "fade-up 0.4s cubic-bezier(0.22, 1, 0.36, 1) both" }}
        >
          <Dialog.Title className="sr-only">{app.company} — {app.jobTitle}</Dialog.Title>

          {/* Cover */}
          <div className="relative px-8 pt-7 pb-6 rule-bottom" style={{ background: `linear-gradient(180deg, ${app.logoColor}15 0%, transparent 100%)` }}>
            <div className="flex items-start justify-between mb-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-ash">
                Dossier № {app.id.slice(0, 8).toUpperCase()}
                {" · "}
                Filed {formatDate(app.appliedAt, { month: "long", day: "numeric" })}
              </div>
              <Dialog.Close className="text-ash hover:text-ink p-1" aria-label="Close">
                <X className="w-4 h-4" strokeWidth={1.5} />
              </Dialog.Close>
            </div>

            <div className="flex items-start gap-5">
              <CompanyMark name={app.company} color={app.logoColor} size={64} />
              <div className="min-w-0 flex-1">
                {editing ? (
                  <input
                    value={form.company}
                    onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
                    className="w-full bg-transparent border-b border-ink/30 font-display text-4xl font-bold leading-[1.05] tracking-tightest focus:border-ink focus:outline-none"
                  />
                ) : (
                  <h2 className="font-display text-4xl font-bold leading-[1.05] tracking-tightest">{app.company}</h2>
                )}
                {editing ? (
                  <input
                    value={form.jobTitle}
                    onChange={(e) => setForm((p) => ({ ...p, jobTitle: e.target.value }))}
                    className="mt-1 w-full bg-transparent border-b border-ink/15 font-display text-lg italic focus:border-ink focus:outline-none"
                  />
                ) : (
                  <p className="font-display text-lg text-ash italic mt-1">{app.jobTitle}</p>
                )}
                <div className="mt-4 flex items-center gap-3">
                  <StatusSwitcher app={app} />
                </div>
              </div>
            </div>

            {/* Action toolbar */}
            <div className="mt-6 flex items-center gap-2 rule-top pt-4">
              {editing ? (
                <>
                  <button
                    onClick={saveEdits}
                    className="flex items-center gap-1.5 bg-ink text-paper px-3 py-1.5 text-[12px] font-medium hover:bg-moss"
                  >
                    <Check className="w-3.5 h-3.5" strokeWidth={2} />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setForm({
                        company: app.company,
                        jobTitle: app.jobTitle,
                        location: app.location,
                        source: app.source,
                        salary: app.salary ?? "",
                        notes: app.notes ?? "",
                      });
                    }}
                    className="px-3 py-1.5 text-[12px] text-ash hover:text-ink"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-1.5 border border-ink/15 hover:border-ink px-3 py-1.5 text-[12px] font-medium"
                  >
                    <Pencil className="w-3.5 h-3.5" strokeWidth={1.5} />
                    Edit
                  </button>
                  <button
                    onClick={() => setConfirming(true)}
                    className="flex items-center gap-1.5 border border-oxblood/30 text-oxblood hover:border-vermilion hover:text-vermilion hover:bg-vermilion/5 px-3 py-1.5 text-[12px] font-medium ml-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                    Delete
                  </button>
                </>
              )}
            </div>

            {confirming && (
              <div className="mt-4 border border-vermilion/40 bg-vermilion/5 p-4">
                <div className="font-display text-[15px] font-semibold text-oxblood">
                  Delete this dossier?
                </div>
                <p className="text-[12px] text-ink/70 mt-1">
                  All emails and interviews attached to this application will also be removed. This cannot be undone.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={handleDelete}
                    className="bg-vermilion text-paper px-3 py-1.5 text-[12px] font-medium hover:bg-oxblood"
                  >
                    Yes, delete
                  </button>
                  <button
                    onClick={() => setConfirming(false)}
                    className="px-3 py-1.5 text-[12px] text-ash hover:text-ink"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Quick facts */}
            <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-[12px]">
              <Fact
                icon={<MapPin className="w-3 h-3" strokeWidth={1.5} />}
                label="Location"
                value={app.location}
                editing={editing}
                onChange={(v) => setForm((p) => ({ ...p, location: v }))}
                editValue={form.location}
              />
              <Fact
                icon={<Briefcase className="w-3 h-3" strokeWidth={1.5} />}
                label="Source"
                value={app.source}
                editing={editing}
                onChange={(v) => setForm((p) => ({ ...p, source: v }))}
                editValue={form.source}
              />
              <Fact
                icon={<CalendarClock className="w-3 h-3" strokeWidth={1.5} />}
                label="Applied"
                value={timeAgo(app.appliedAt)}
              />
              <Fact
                icon={<Banknote className="w-3 h-3" strokeWidth={1.5} />}
                label="Compensation"
                value={app.salary ?? "—"}
                editing={editing}
                onChange={(v) => setForm((p) => ({ ...p, salary: v }))}
                editValue={form.salary}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="px-8 py-5 rule-bottom">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-vermilion mb-2">
              <Sparkles className="w-3 h-3" strokeWidth={2} />
              Editor&apos;s Annotation
            </div>
            {editing ? (
              <textarea
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                rows={3}
                placeholder="Notes about this application…"
                className="w-full bg-cream border border-ink/15 px-3 py-2 text-[14px] font-display italic focus:border-ink focus:outline-none resize-none"
              />
            ) : app.notes ? (
              <p className="font-display text-[15px] italic leading-relaxed text-ink/90">
                &ldquo;{app.notes}&rdquo;
              </p>
            ) : (
              <p className="text-[12px] text-ash italic">No notes yet.</p>
            )}
          </div>

          {(upcomingInterviews.length > 0 || pastInterviews.length > 0) && (
            <section className="px-8 py-6 rule-bottom">
              <SectionHeader kicker="Schedule" title="Calendar Entries" />
              <div className="mt-4 space-y-3">
                {upcomingInterviews.map((iv) => (
                  <InterviewRow key={iv.id} interview={iv} upcoming />
                ))}
                {pastInterviews.map((iv) => (
                  <InterviewRow key={iv.id} interview={iv} />
                ))}
              </div>
            </section>
          )}

          <section className="px-8 py-6">
            <SectionHeader kicker="Correspondence" title="Email Thread" count={app.emails.length} />
            <div className="mt-5 relative">
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-ink/15" />
              <div className="space-y-5">
                {app.emails.length === 0 && (
                  <div className="text-ash italic text-sm py-6 text-center">
                    No correspondence detected yet. The archive will fill as replies arrive.
                  </div>
                )}
                {app.emails.map((e) => (
                  <article key={e.id} className="relative pl-7">
                    <span
                      className={`absolute left-0 top-2 w-[15px] h-[15px] rounded-full grid place-items-center ${
                        e.direction === "incoming" ? "bg-vermilion text-paper" : "bg-ink text-paper"
                      }`}
                    >
                      {e.direction === "incoming" ? (
                        <ArrowDownLeft className="w-2.5 h-2.5" strokeWidth={2.5} />
                      ) : (
                        <ArrowUpRight className="w-2.5 h-2.5" strokeWidth={2.5} />
                      )}
                    </span>
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[13px] font-medium truncate">{e.sender}</div>
                        <div className="font-mono text-[10px] text-ash truncate">{e.senderEmail}</div>
                      </div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ash shrink-0">
                        {timeAgo(e.receivedAt)}
                      </div>
                    </div>
                    <div className="mt-2 font-display text-[15px] font-semibold leading-snug">
                      {e.subject}
                    </div>
                    <p className="mt-1 text-[13px] text-ink/75 leading-relaxed">{e.snippet}</p>
                    <button className="mt-2 inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-[0.18em] text-ash hover:text-vermilion">
                      Open in Gmail <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
                    </button>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function StatusSwitcher({ app }: { app: Application }) {
  const { updateApplication } = useStore();
  const current = STATUS_OPTIONS.find((s) => s.value === app.status);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="group flex items-center gap-2 hover:opacity-80 transition-opacity">
          <StatusStamp status={app.status} />
          <ChevronDown className="w-3.5 h-3.5 text-ash group-hover:text-ink" strokeWidth={1.5} />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={6}
          className="bg-paper border border-ink/15 shadow-xl py-1.5 min-w-[220px] z-50"
        >
          <div className="px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.25em] text-ash border-b border-ink/10 mb-1">
            Move to
          </div>
          {STATUS_OPTIONS.map((opt) => (
            <DropdownMenu.Item
              key={opt.value}
              onSelect={() => {
                if (opt.value !== app.status) updateApplication(app.id, { status: opt.value });
              }}
              className={`flex items-start gap-3 px-3 py-2 text-[13px] cursor-pointer outline-none hover:bg-cream ${
                opt.value === app.status ? "bg-cream" : ""
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium">{opt.label}</div>
                <div className="text-[11px] text-ash">{opt.description}</div>
              </div>
              {opt.value === app.status && <Check className="w-3.5 h-3.5 text-vermilion mt-0.5" strokeWidth={2} />}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function Fact({
  icon,
  label,
  value,
  editing,
  editValue,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  editing?: boolean;
  editValue?: string;
  onChange?: (v: string) => void;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-ash mt-0.5">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-ash">{label}</div>
        {editing && onChange ? (
          <input
            value={editValue ?? ""}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-transparent border-b border-ink/15 text-[13px] text-ink focus:border-ink focus:outline-none py-0.5"
          />
        ) : (
          <div className="text-[13px] text-ink truncate">{value}</div>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ kicker, title, count }: { kicker: string; title: string; count?: number }) {
  return (
    <div className="flex items-baseline justify-between rule-bottom pb-2">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-ash">{kicker}</div>
        <h3 className="font-display text-xl font-bold tracking-tightest mt-1">{title}</h3>
      </div>
      {count !== undefined && (
        <div className="font-display text-2xl tabular text-ink/30 font-bold">
          {count.toString().padStart(2, "0")}
        </div>
      )}
    </div>
  );
}

function InterviewRow({ interview, upcoming }: { interview: import("@/lib/mock-data").InterviewRecord; upcoming?: boolean }) {
  const date = new Date(interview.scheduledAt);
  return (
    <div className={`flex gap-4 paper-card p-4 ${upcoming ? "border-l-[3px] !border-l-vermilion" : "opacity-70"}`}>
      <div className="text-center shrink-0 w-12">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
          {date.toLocaleString("en-US", { month: "short" })}
        </div>
        <div className="font-display text-3xl font-bold tabular leading-none mt-0.5">
          {date.getDate()}
        </div>
        <div className="font-mono text-[10px] text-ash mt-1">
          {date.toLocaleString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-medium leading-snug">{interview.title}</div>
        <div className="text-[12px] text-ash mt-0.5">
          {interview.durationMins} min · {interview.type} {interview.location && `· ${interview.location}`}
        </div>
        <div className="mt-2 flex items-center gap-2">
          {upcoming && !interview.isReminded && (
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ochre border border-ochre/40 px-1.5 py-0.5">
              Reminder scheduled
            </span>
          )}
          {upcoming && interview.isReminded && (
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-moss border border-moss/40 px-1.5 py-0.5">
              Reminded
            </span>
          )}
          {!upcoming && (
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ash border border-ink/15 px-1.5 py-0.5">
              Completed
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
