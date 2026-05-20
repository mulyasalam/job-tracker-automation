"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Bell, Mail, CalendarClock, Sparkles, Check } from "lucide-react";
import { useStore } from "@/lib/store";
import { timeAgo } from "@/lib/utils";

const ICONS = {
  interview: CalendarClock,
  email: Mail,
  status: Sparkles,
  system: Bell,
};

const TONES = {
  interview: "text-vermilion",
  email: "text-ink",
  status: "text-moss",
  system: "text-ash",
};

export function NotificationsPopover() {
  const { notifications, unreadCount, markAllRead, markRead } = useStore();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="relative p-2 text-ash hover:text-ink focus:outline-none" aria-label="Notifications">
          <Bell className="w-4 h-4" strokeWidth={1.5} />
          {unreadCount > 0 && (
            <>
              <span className="absolute top-1 right-1 w-2 h-2 bg-vermilion rounded-full" />
              <span className="absolute top-0.5 right-0.5 w-3 h-3 bg-vermilion/30 rounded-full animate-pulse-dot" />
            </>
          )}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="w-[420px] max-h-[520px] overflow-y-auto bg-paper shadow-2xl rule z-50"
          style={{ animation: "fade-up 0.22s cubic-bezier(0.22, 1, 0.36, 1) both" }}
        >
          <div className="px-5 pt-5 pb-3 rule-bottom flex items-baseline justify-between">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-vermilion mb-1">
                ¶ The Bulletin
              </div>
              <h3 className="font-display text-2xl font-bold tracking-tightest leading-none">
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
              </h3>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash hover:text-vermilion flex items-center gap-1"
              >
                <Check className="w-3 h-3" strokeWidth={2} /> Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <div className="font-display italic text-ash text-[14px]">
                — quiet inbox, focused mind —
              </div>
            </div>
          ) : (
            <div>
              {notifications.map((n) => {
                const Icon = ICONS[n.type];
                return (
                  <button
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={`w-full px-5 py-3.5 rule-bottom last:border-b-0 text-left flex items-start gap-3 transition-colors hover:bg-bone/40 relative ${
                      !n.read ? "bg-cream" : ""
                    }`}
                  >
                    {!n.read && (
                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-vermilion rounded-full" />
                    )}
                    <span className={`shrink-0 mt-0.5 ${TONES[n.type]}`}>
                      <Icon className="w-4 h-4" strokeWidth={1.5} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="text-[13px] font-medium truncate">{n.title}</span>
                        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ash shrink-0">
                          {timeAgo(n.createdAt)}
                        </span>
                      </span>
                      <span className="block text-[12px] text-ink/70 leading-snug mt-0.5 line-clamp-2">
                        {n.body}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="px-5 py-3 rule-top bg-bone/30 font-mono text-[10px] uppercase tracking-[0.22em] text-ash text-center">
            Reminders fire 24h and 2h before each interview
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
