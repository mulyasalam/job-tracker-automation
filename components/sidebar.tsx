"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutGrid,
  Table2,
  CalendarDays,
  Mail,
  Settings2,
  Sparkles,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useSession } from "@/lib/auth-client";
import { SettingsDialog } from "./settings-dialog";

const NAV = [
  { href: "/", label: "Dossier", icon: LayoutGrid, shortcut: "D" },
  { href: "/applications", label: "All Applications", icon: Table2, shortcut: "A" },
  { href: "/interviews", label: "Interviews", icon: CalendarDays, shortcut: "I" },
  { href: "/inbox", label: "Inbox", icon: Mail, shortcut: "M" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { applications } = useStore();
  const { data: session } = useSession();
  const user = session?.user;
  const displayName = user?.name ?? user?.email?.split("@")[0] ?? "—";
  const displayEmail = user?.email ?? "Not signed in";
  const [settingsOpen, setSettingsOpen] = useState(false);

  const inProgress = applications.filter((a) => a.status === "interviewing").length;
  const pendingReminders = applications
    .flatMap((a) => a.interviews)
    .filter((i) => !i.isReminded && new Date(i.scheduledAt) > new Date()).length;

  return (
    <aside className="hidden lg:flex flex-col w-[260px] shrink-0 h-screen sticky top-0 border-r rule bg-paper">
      <div className="px-6 pt-7 pb-5 rule-bottom">
        <div className="flex items-baseline justify-between">
          <Link href="/" className="group">
            <div className="font-display font-bold text-3xl leading-none tracking-tightest">
              Dossier<span className="text-vermilion">.</span>
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-ash mt-1.5">
              Est. 2026 · Vol I
            </div>
          </Link>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-0.5">
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center justify-between gap-3 px-3 py-2 text-[13px] transition-colors",
                active ? "bg-ink text-paper" : "text-ink/80 hover:bg-ink/5",
              )}
            >
              <span className="flex items-center gap-3">
                <Icon className="w-4 h-4" strokeWidth={1.5} />
                <span className="font-medium">{item.label}</span>
              </span>
              <kbd
                className={cn(
                  "font-mono text-[10px] px-1.5 py-0.5 border",
                  active ? "border-paper/30 text-paper/70" : "border-ink/15 text-ash",
                )}
              >
                {item.shortcut}
              </kbd>
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 rule-top space-y-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-ash">
          Today's Edition
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Counter label="Live" value={inProgress} tone="vermilion" />
          <Counter label="Pending" value={pendingReminders} tone="ochre" />
        </div>
      </div>

      <div className="px-5 py-4 rule-top flex items-center gap-3">
        {user?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt="" className="w-9 h-9 rounded-full object-cover" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-ink text-paper grid place-items-center font-display font-bold">
            {displayName[0]?.toUpperCase() ?? "—"}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium truncate">{displayName}</div>
          <div className="text-[11px] text-ash truncate font-mono">{displayEmail}</div>
        </div>
        <button
          onClick={() => setSettingsOpen(true)}
          className="text-ash hover:text-ink p-1 transition-colors"
          aria-label="Settings"
        >
          <Settings2 className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>

      <div className="px-5 py-4 rule-top text-[11px] text-ash leading-relaxed flex items-start gap-2">
        <Sparkles className="w-3 h-3 mt-0.5 text-vermilion shrink-0" strokeWidth={2} />
        <span>
          Parsing inbox <span className="text-ink font-medium">silently</span>. Gemini reads, you decide.
        </span>
      </div>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </aside>
  );
}

function Counter({ label, value, tone }: { label: string; value: number; tone: "vermilion" | "ochre" }) {
  return (
    <div className="flex flex-col">
      <div className={cn("font-display text-3xl leading-none tabular", tone === "vermilion" ? "text-vermilion" : "text-ochre")}>
        {value.toString().padStart(2, "0")}
      </div>
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash mt-1">
        {label}
      </div>
    </div>
  );
}
