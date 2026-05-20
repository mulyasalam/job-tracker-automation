"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { LogOut, RefreshCw, Settings } from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";
import { useState } from "react";
import { SettingsDialog } from "./settings-dialog";

export function UserMenu() {
  const { data, isPending } = useSession();
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (isPending) {
    return <div className="w-9 h-9 rounded-full bg-ink/10 animate-pulse" />;
  }

  if (!data?.user) {
    return (
      <a
        href="/login"
        className="text-[12px] font-mono uppercase tracking-[0.15em] text-ash hover:text-ink border border-ink/15 hover:border-ink px-3 py-2"
      >
        Sign in
      </a>
    );
  }

  const user = data.user;
  const initials = (user.name ?? user.email).slice(0, 1).toUpperCase();

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            className="w-9 h-9 rounded-full bg-ink text-paper grid place-items-center font-display font-bold text-sm hover:bg-vermilion transition-colors"
            aria-label="User menu"
          >
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt="" className="w-9 h-9 rounded-full object-cover" />
            ) : (
              initials
            )}
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={8}
            className="bg-paper border border-ink/15 shadow-xl py-2 min-w-[240px] z-50"
          >
            <div className="px-4 py-2 border-b border-ink/10">
              <div className="font-display text-[14px] font-semibold tracking-tight">{user.name ?? "—"}</div>
              <div className="font-mono text-[11px] text-ash truncate">{user.email}</div>
            </div>
            <DropdownMenu.Item
              onSelect={() => setSettingsOpen(true)}
              className="flex items-center gap-3 px-4 py-2 text-[13px] hover:bg-cream cursor-pointer outline-none"
            >
              <Settings className="w-3.5 h-3.5 text-ash" strokeWidth={1.5} />
              Settings
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={async () => {
                await signOut();
                window.location.href = "/login";
              }}
              className="flex items-center gap-3 px-4 py-2 text-[13px] hover:bg-cream cursor-pointer outline-none text-oxblood"
            >
              <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} />
              Sign out
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}
