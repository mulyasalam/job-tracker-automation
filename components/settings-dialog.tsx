"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { X, Mail, Bell, Sparkles, LogOut, Trash2, ShieldCheck, RefreshCw } from "lucide-react";
import { useStore } from "@/lib/store";
import { useSession, signOut } from "@/lib/auth-client";
import {
  getPreferences,
  updatePreferences,
  deleteAccount,
  type Preferences,
} from "@/app/actions/preferences";

function timeAgo(iso: string | null): string {
  if (!iso) return "never";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function SettingsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { applications, triggerSync, syncing, lastSyncAt } = useStore();
  const { data: session } = useSession();
  const user = session?.user;
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [savingKey, setSavingKey] = useState<keyof Preferences | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;
    getPreferences().then(setPrefs).catch(() => setPrefs(null));
  }, [open]);

  const togglePref = async (key: keyof Preferences, value: boolean) => {
    if (!prefs) return;
    const optimistic = { ...prefs, [key]: value };
    setPrefs(optimistic);
    setSavingKey(key);
    try {
      const saved = await updatePreferences({ [key]: value });
      setPrefs(saved);
    } catch {
      setPrefs(prefs);
    } finally {
      setSavingKey(null);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    window.location.href = "/login";
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      await signOut();
    } finally {
      window.location.href = "/login";
    }
  };

  const memberSince = user && "createdAt" in user && user.createdAt
    ? new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(user.createdAt as string | number | Date))
    : "—";

  const displayName = user?.name ?? user?.email?.split("@")[0] ?? "—";
  const displayEmail = user?.email ?? "—";

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
              className="relative w-full max-w-[680px] bg-paper shadow-2xl"
              style={{ animation: "fade-up 0.32s cubic-bezier(0.22, 1, 0.36, 1) both" }}
            >
              <div className="px-8 pt-7 pb-5 rule-bottom flex items-start justify-between">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-vermilion mb-2">
                    ¶ Editorial Office · Preferences
                  </div>
                  <Dialog.Title className="font-display text-4xl font-bold leading-[1] tracking-tightest">
                    Account &amp; Settings
                  </Dialog.Title>
                  <p className="mt-2 font-display italic text-ink/70 text-[14px]">
                    Manage the press, the inbox, and the staff (just you).
                  </p>
                </div>
                <Dialog.Close className="text-ash hover:text-ink p-1" aria-label="Close">
                  <X className="w-4 h-4" strokeWidth={1.5} />
                </Dialog.Close>
              </div>

              <Section title="Profile" kicker="Section A">
                <div className="flex items-center gap-4">
                  {user?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.image} alt="" className="w-14 h-14 rounded-full object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-ink text-paper grid place-items-center font-display font-bold text-2xl">
                      {displayName[0]?.toUpperCase() ?? "—"}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-xl font-semibold tracking-tightest">{displayName}</div>
                    <div className="font-mono text-[11px] text-ash">{displayEmail}</div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash mt-1">
                      Member since {memberSince}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-3xl font-bold tabular leading-none">{applications.length}</div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash mt-1">Dossiers filed</div>
                  </div>
                </div>
              </Section>

              <Section title="Connected Inbox" kicker="Section B">
                <div className="paper-card p-4 flex items-center gap-4">
                  <div className="w-10 h-10 grid place-items-center bg-cream border border-ink/15">
                    <Mail className="w-4 h-4" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium flex items-center gap-2">
                      Gmail
                      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-moss border border-moss/40 px-1.5 py-0.5">
                        {user ? "Connected" : "Not connected"}
                      </span>
                    </div>
                    <div className="font-mono text-[11px] text-ash mt-0.5">
                      Read-only OAuth · Last sync {timeAgo(lastSyncAt)}
                    </div>
                  </div>
                  <button
                    onClick={triggerSync}
                    disabled={syncing}
                    className="flex items-center gap-2 text-[12px] font-mono uppercase tracking-[0.15em] text-ash hover:text-ink border border-ink/15 hover:border-ink px-3 py-2 disabled:opacity-60"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} strokeWidth={1.5} />
                    {syncing ? "Syncing…" : "Resync"}
                  </button>
                </div>
                <div className="mt-3 flex items-start gap-2 text-[11px] text-ash leading-relaxed">
                  <ShieldCheck className="w-3 h-3 mt-0.5 shrink-0 text-moss" strokeWidth={1.5} />
                  <span>We hold a read-only token. We cannot send mail, mark messages, or delete anything. Disconnect at any time.</span>
                </div>
              </Section>

              <Section title="Notifications" kicker="Section C">
                {!prefs ? (
                  <div className="text-[12px] text-ash italic py-4">Loading preferences…</div>
                ) : (
                  <div className="space-y-1">
                    <Toggle
                      label="Interview reminders"
                      description="24h and 2h before each scheduled conversation"
                      icon={<Bell className="w-3.5 h-3.5" strokeWidth={1.5} />}
                      checked={prefs.interviewReminders}
                      saving={savingKey === "interviewReminders"}
                      onChange={(v) => togglePref("interviewReminders", v)}
                    />
                    <Toggle
                      label="Status changes"
                      description="When AI detects a stage move based on email replies"
                      icon={<Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />}
                      checked={prefs.statusUpdates}
                      saving={savingKey === "statusUpdates"}
                      onChange={(v) => togglePref("statusUpdates", v)}
                    />
                    <Toggle
                      label="Weekly digest"
                      description="Sunday evening summary of the week's activity"
                      icon={<Mail className="w-3.5 h-3.5" strokeWidth={1.5} />}
                      checked={prefs.weeklyDigest}
                      saving={savingKey === "weeklyDigest"}
                      onChange={(v) => togglePref("weeklyDigest", v)}
                    />
                  </div>
                )}
              </Section>

              <Section title="Automation" kicker="Section D">
                {!prefs ? (
                  <div className="text-[12px] text-ash italic py-4">Loading…</div>
                ) : (
                  <div className="space-y-1">
                    <Toggle
                      label="Auto-archive rejections"
                      description="Move closed loops out of the main view after 14 days"
                      checked={prefs.autoArchive}
                      saving={savingKey === "autoArchive"}
                      onChange={(v) => togglePref("autoArchive", v)}
                    />
                    <Toggle
                      label="AI editor's annotations"
                      description="Gemini summarizes long email threads into one-line notes"
                      icon={<Sparkles className="w-3.5 h-3.5 text-vermilion" strokeWidth={1.5} />}
                      checked={prefs.aiNotes}
                      saving={savingKey === "aiNotes"}
                      onChange={(v) => togglePref("aiNotes", v)}
                    />
                  </div>
                )}
              </Section>

              <Section title="The Last Page" kicker="Section E" danger>
                <div className="space-y-2">
                  <button
                    onClick={handleSignOut}
                    disabled={signingOut || deleting}
                    className="w-full flex items-center justify-between border border-ink/15 hover:border-ink px-4 py-3 text-left disabled:opacity-60"
                  >
                    <span>
                      <span className="block text-[13px] font-medium">{signingOut ? "Signing out…" : "Sign out"}</span>
                      <span className="block text-[11px] text-ash">End this session on this device</span>
                    </span>
                    <LogOut className="w-4 h-4 text-ash" strokeWidth={1.5} />
                  </button>

                  {!confirmingDelete ? (
                    <button
                      onClick={() => setConfirmingDelete(true)}
                      disabled={signingOut || deleting}
                      className="w-full flex items-center justify-between border border-oxblood/30 hover:border-vermilion hover:bg-vermilion/5 px-4 py-3 text-left group disabled:opacity-60"
                    >
                      <span>
                        <span className="block text-[13px] font-medium text-oxblood group-hover:text-vermilion">
                          Delete dossier
                        </span>
                        <span className="block text-[11px] text-ash">
                          Permanently erase all applications, emails, and tokens. Cannot be undone.
                        </span>
                      </span>
                      <Trash2 className="w-4 h-4 text-oxblood group-hover:text-vermilion" strokeWidth={1.5} />
                    </button>
                  ) : (
                    <div className="border border-vermilion/40 bg-vermilion/5 p-4">
                      <div className="font-display text-[15px] font-semibold text-oxblood">
                        Delete your entire dossier?
                      </div>
                      <p className="text-[12px] text-ink/70 mt-1 leading-relaxed">
                        Every application ({applications.length}), every email, every interview, and your OAuth tokens will be permanently removed. You&apos;ll be signed out.
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={handleDelete}
                          disabled={deleting}
                          className="bg-vermilion text-paper px-3 py-1.5 text-[12px] font-medium hover:bg-oxblood disabled:opacity-60"
                        >
                          {deleting ? "Deleting…" : "Yes, erase everything"}
                        </button>
                        <button
                          onClick={() => setConfirmingDelete(false)}
                          disabled={deleting}
                          className="px-3 py-1.5 text-[12px] text-ash hover:text-ink disabled:opacity-60"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </Section>

              <div className="px-8 py-4 rule-top bg-bone/30 flex items-center justify-between">
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-ash">
                  Dossier v0.1 · {user?.id ? `U-${user.id.slice(0, 6)}` : "anonymous"}
                </div>
                <Dialog.Close className="bg-ink text-paper px-5 py-2.5 text-[13px] font-medium hover:bg-vermilion transition-colors">
                  Done
                </Dialog.Close>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Section({
  title,
  kicker,
  danger,
  children,
}: {
  title: string;
  kicker: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="px-8 py-5 rule-bottom">
      <div className="flex items-baseline justify-between mb-4">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ash">{kicker}</span>
          <h3 className={`font-display text-xl font-bold tracking-tightest ${danger ? "text-oxblood" : ""}`}>
            {title}
          </h3>
        </div>
      </div>
      {children}
    </section>
  );
}

function Toggle({
  label,
  description,
  icon,
  checked,
  onChange,
  saving,
}: {
  label: string;
  description: string;
  icon?: React.ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  saving?: boolean;
}) {
  return (
    <label className="flex items-center gap-3 py-2.5 cursor-pointer group">
      {icon && <span className="text-ash group-hover:text-ink">{icon}</span>}
      <span className="flex-1 min-w-0">
        <span className="block text-[13px] font-medium">{label}</span>
        <span className="block text-[11px] text-ash leading-snug">{description}</span>
      </span>
      {saving && <span className="font-mono text-[10px] text-ash italic mr-1">saving…</span>}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 w-10 h-6 transition-colors ${checked ? "bg-ink" : "bg-ink/15"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-paper transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </label>
  );
}
