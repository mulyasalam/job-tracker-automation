"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { X, Sparkles, Plus } from "lucide-react";
import { useStore, type NewApplicationInput } from "@/lib/store";
import type { ApplicationStatus } from "@/lib/mock-data";

const STATUSES: { value: ApplicationStatus; label: string }[] = [
  { value: "applied", label: "Submitted" },
  { value: "interviewing", label: "In Process" },
  { value: "hired", label: "Offered" },
  { value: "rejected", label: "Closed" },
];

const SOURCES = ["LinkedIn", "Company website", "Referral", "Hacker News", "Twitter", "Newsletter", "Direct application", "Other"];

export function LogApplicationDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { addApplication } = useStore();
  const [form, setForm] = useState<NewApplicationInput>({
    company: "",
    jobTitle: "",
    location: "",
    status: "applied",
    source: "Company website",
    salary: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const update = <K extends keyof NewApplicationInput>(key: K, value: NewApplicationInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company.trim() || !form.jobTitle.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      addApplication({
        ...form,
        location: form.location.trim() || "—",
        salary: form.salary?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
      });
      setSubmitting(false);
      setJustSaved(true);
      setTimeout(() => {
        setJustSaved(false);
        onOpenChange(false);
        setForm({
          company: "",
          jobTitle: "",
          location: "",
          status: "applied",
          source: "Company website",
          salary: "",
          notes: "",
        });
      }, 900);
    }, 400);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-ink/40 backdrop-blur-[2px] z-40" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-50 overflow-y-auto focus:outline-none"
        >
          <div className="min-h-full flex items-start sm:items-center justify-center px-4 py-8">
            <div
              className="relative w-full max-w-[640px] bg-paper shadow-2xl"
              style={{ animation: "fade-up 0.32s cubic-bezier(0.22, 1, 0.36, 1) both" }}
            >
          {/* Masthead */}
          <div className="px-8 pt-7 pb-5 rule-bottom">
            <div className="flex items-center justify-between mb-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-vermilion">
                ¶ New Entry · Form
              </div>
              <Dialog.Close className="text-ash hover:text-ink p-1" aria-label="Close">
                <X className="w-4 h-4" strokeWidth={1.5} />
              </Dialog.Close>
            </div>
            <Dialog.Title className="font-display text-4xl font-bold leading-[1] tracking-tightest">
              File a new dossier.
            </Dialog.Title>
            <p className="mt-2 font-display italic text-ink/70 text-[14px]">
              Manual entry, for when the inbox hasn't caught up yet.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <Field label="Company" required>
                <input
                  required
                  autoFocus
                  value={form.company}
                  onChange={(e) => update("company", e.target.value)}
                  placeholder="Linear"
                  className={INPUT}
                />
              </Field>
              <Field label="Role" required>
                <input
                  required
                  value={form.jobTitle}
                  onChange={(e) => update("jobTitle", e.target.value)}
                  placeholder="Senior Product Engineer"
                  className={INPUT}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <Field label="Location">
                <input
                  value={form.location}
                  onChange={(e) => update("location", e.target.value)}
                  placeholder="Remote, EU"
                  className={INPUT}
                />
              </Field>
              <Field label="Compensation">
                <input
                  value={form.salary}
                  onChange={(e) => update("salary", e.target.value)}
                  placeholder="€110k–€140k"
                  className={INPUT}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <Field label="Source">
                <select
                  value={form.source}
                  onChange={(e) => update("source", e.target.value)}
                  className={INPUT + " appearance-none cursor-pointer"}
                >
                  {SOURCES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label="Status">
                <div className="flex gap-1.5 flex-wrap">
                  {STATUSES.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => update("status", s.value)}
                      className={`px-2.5 py-1.5 text-[11px] font-mono uppercase tracking-[0.15em] border transition-colors ${
                        form.status === s.value
                          ? "bg-ink text-paper border-ink"
                          : "border-ink/20 text-ash hover:border-ink hover:text-ink"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            <Field label="Editor's notes">
              <textarea
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="Why this role excites you, prep notes, anything worth remembering…"
                rows={3}
                className={INPUT + " resize-none font-display italic"}
              />
            </Field>

            <div className="rule-top pt-4 flex items-center justify-between">
              <div className="flex items-start gap-2 text-[11px] text-ash leading-relaxed max-w-[300px]">
                <Sparkles className="w-3 h-3 mt-0.5 text-vermilion shrink-0" strokeWidth={2} />
                <span>Future emails from this company will auto-attach to this dossier.</span>
              </div>
              <div className="flex items-center gap-2">
                <Dialog.Close className="px-4 py-2.5 text-[13px] font-medium text-ash hover:text-ink">
                  Cancel
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={submitting || !form.company.trim() || !form.jobTitle.trim()}
                  className="bg-ink text-paper px-5 py-2.5 text-[13px] font-medium hover:bg-vermilion transition-colors disabled:opacity-40 disabled:hover:bg-ink flex items-center gap-2"
                >
                  {justSaved ? "Filed ✓" : submitting ? "Filing…" : <><Plus className="w-3.5 h-3.5" strokeWidth={2} /> File Dossier</>}
                </button>
              </div>
            </div>
          </form>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

const INPUT =
  "w-full bg-cream border border-ink/15 px-3.5 py-2.5 text-[14px] placeholder:text-ash/70 focus:border-ink focus:outline-none transition-colors";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-ash mb-1.5 flex items-center gap-1">
        {label} {required && <span className="text-vermilion">*</span>}
      </div>
      {children}
    </label>
  );
}
