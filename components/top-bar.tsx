"use client";

import { Search, Plus, RefreshCw, ChevronDown, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatDate } from "@/lib/utils";
import { LogApplicationDialog } from "./log-application-dialog";
import { NotificationsPopover } from "./notifications-popover";
import { useStore } from "@/lib/store";
import { UserMenu } from "./user-menu";

function timeAgo(iso: string | null): string {
  if (!iso) return "never";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function TopBar({ title, edition }: { title?: string; edition?: string }) {
  const [now, setNow] = useState<Date | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const {
    syncing,
    triggerSync,
    applications,
    filteredApplications,
    searchQuery,
    setSearchQuery,
    lastSyncAt,
    syncMessage,
    isBackendActive,
  } = useStore();

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
      if (e.key === "Escape" && document.activeElement === searchRef.current) {
        setSearchQuery("");
        searchRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setSearchQuery]);

  const totalApps = applications.length;
  const upcomingInterview = applications
    .flatMap((a) => a.interviews.map((iv) => ({ ...iv, company: a.company })))
    .filter((iv) => new Date(iv.scheduledAt).getTime() > Date.now())
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0];

  return (
    <header className="rule-bottom bg-paper sticky top-0 z-30">
      <div className="flex items-center justify-between px-8 pt-4 pb-2">
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-ash">
          {now ? formatDate(now, { weekday: "long", month: "long", day: "numeric", year: "numeric" }).toUpperCase() : ""}
          {" · "}
          <span className="text-vermilion">{edition ?? "The Daily Dossier"}</span>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-ash">
          Issue №{now ? Math.floor((now.getTime() / 86400000) % 999).toString().padStart(3, "0") : "001"}
        </div>
      </div>

      <div className="overflow-hidden rule-top rule-bottom bg-bone/40">
        <div className="flex whitespace-nowrap py-1.5 marquee">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center gap-8 px-4 font-mono text-[10px] text-ash uppercase tracking-[0.2em] shrink-0">
              <span className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse-dot ${isBackendActive ? "bg-moss" : "bg-ash"}`} />
                {isBackendActive ? `Gmail · synced ${timeAgo(lastSyncAt)}` : "Demo mode · sign in to sync Gmail"}
              </span>
              <span>· {totalApps} application{totalApps === 1 ? "" : "s"} tracked ·</span>
              {upcomingInterview && (
                <span className="text-vermilion">
                  {upcomingInterview.company} {upcomingInterview.title} · {new Date(upcomingInterview.scheduledAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} ·
                </span>
              )}
              {syncMessage && <span className="text-moss">{syncMessage}</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-6 px-8 py-4">
        <div className="flex items-baseline gap-5">
          {title && (
            <h1 className="font-display font-bold text-2xl tracking-tightest leading-none">
              {title}
            </h1>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ash" strokeWidth={1.5} />
            <input
              ref={searchRef}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search company, role, email…"
              className="bg-cream border border-ink/15 pl-9 pr-16 py-2 text-sm w-[320px] placeholder:text-ash focus:border-ink"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-ash hover:text-ink p-1"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            ) : (
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[10px] text-ash border border-ink/15 px-1.5 py-0.5">
                ⌘K
              </kbd>
            )}
          </div>
          {searchQuery && (
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ash">
              {filteredApplications.length} / {applications.length} matched
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={triggerSync}
            disabled={syncing}
            className="flex items-center gap-2 px-3 py-2 text-xs font-mono uppercase tracking-[0.15em] text-ash hover:text-ink border border-transparent hover:border-ink/15 disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} strokeWidth={1.5} />
            {syncing ? "Syncing…" : "Resync"}
          </button>
          <NotificationsPopover />
          <button
            onClick={() => setLogOpen(true)}
            className="flex items-center gap-2 bg-ink text-paper hover:bg-vermilion transition-colors px-4 py-2 text-sm font-medium"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            Log Application
            <ChevronDown className="w-3 h-3 opacity-70" strokeWidth={2} />
          </button>
          <UserMenu />
        </div>
      </div>

      <LogApplicationDialog open={logOpen} onOpenChange={setLogOpen} />
    </header>
  );
}
