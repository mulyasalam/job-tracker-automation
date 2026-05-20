"use client";

import { createContext, useContext, useMemo, useState, useCallback, useEffect } from "react";
import { applications as seed, type Application, type ApplicationStatus } from "@/lib/mock-data";
import {
  listApplications,
  createApplication,
  updateApplication as updateApplicationAction,
  deleteApplication as deleteApplicationAction,
  type ApplicationDTO,
  type ApplicationPatch,
} from "@/app/actions/applications";
import { runSyncNow, triggerInitialBackfillIfNeeded, getLastSync } from "@/app/actions/sync";

export interface Notification {
  id: string;
  type: "interview" | "email" | "status" | "system";
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  appId?: string;
}

interface StoreShape {
  applications: Application[];
  filteredApplications: Application[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  matchesQuery: (app: Application) => boolean;
  addApplication: (input: NewApplicationInput) => Application;
  updateApplication: (id: string, patch: ApplicationPatch) => Promise<void>;
  deleteApplication: (id: string) => Promise<void>;
  notifications: Notification[];
  unreadCount: number;
  markAllRead: () => void;
  markRead: (id: string) => void;
  syncing: boolean;
  triggerSync: () => void;
  isBackendActive: boolean;
  lastSyncAt: string | null;
  syncMessage: string | null;
  refresh: () => Promise<void>;
}

export interface NewApplicationInput {
  company: string;
  jobTitle: string;
  location: string;
  status: ApplicationStatus;
  source: string;
  salary?: string;
  notes?: string;
  logoColor?: string;
}

const StoreContext = createContext<StoreShape | null>(null);

const PALETTE = ["#C44536", "#5E6AD2", "#3ECF8E", "#635BFF", "#A259FF", "#FF6363", "#181613", "#F38020", "#D97757", "#FF4D00"];

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function dtoToApplication(dto: ApplicationDTO): Application {
  return {
    id: dto.id,
    company: dto.company,
    jobTitle: dto.jobTitle,
    location: dto.location,
    status: dto.status,
    appliedAt: dto.appliedAt,
    lastActivityAt: dto.lastActivityAt,
    source: dto.source,
    salary: dto.salary,
    notes: dto.notes,
    logoColor: dto.logoColor,
    emails: dto.emails,
    interviews: dto.interviews,
  };
}

function buildNotifications(apps: Application[]): Notification[] {
  const now = Date.now();
  const result: Notification[] = [];

  for (const app of apps) {
    for (const iv of app.interviews) {
      const scheduled = new Date(iv.scheduledAt).getTime();
      const hoursAway = (scheduled - now) / 3_600_000;
      if (hoursAway > 0 && hoursAway < 48) {
        result.push({
          id: `n-iv-${iv.id}`,
          type: "interview",
          title: `${app.company} interview ${hoursAway < 24 ? "tomorrow" : "in 2 days"}`,
          body: `${iv.title} — ${new Date(iv.scheduledAt).toLocaleString("en-US", { weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false })}`,
          createdAt: new Date(now - hoursAway * 600_000).toISOString(),
          read: iv.isReminded,
          appId: app.id,
        });
      }
    }
    const latestEmail = app.emails[app.emails.length - 1];
    if (latestEmail && latestEmail.direction === "incoming") {
      const ageHours = (now - new Date(latestEmail.receivedAt).getTime()) / 3_600_000;
      if (ageHours < 72) {
        result.push({
          id: `n-em-${latestEmail.id}`,
          type: "email",
          title: `${latestEmail.sender} replied`,
          body: latestEmail.subject,
          createdAt: latestEmail.receivedAt,
          read: ageHours > 24,
          appId: app.id,
        });
      }
    }
    if (app.status === "hired") {
      result.push({
        id: `n-st-${app.id}`,
        type: "status",
        title: `Offer from ${app.company}`,
        body: "Status moved to Offered. Time to celebrate.",
        createdAt: app.lastActivityAt,
        read: false,
        appId: app.id,
      });
    }
  }

  return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

const READ_STORAGE_KEY = "dossier:notifications:read";

function loadReadIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(READ_STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveReadIds(set: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

function buildHaystack(app: Application): string {
  const parts: string[] = [
    app.company,
    app.jobTitle,
    app.location,
    app.status,
    app.source,
    app.salary ?? "",
    app.notes ?? "",
  ];
  for (const e of app.emails) {
    parts.push(e.sender, e.senderEmail, e.subject, e.snippet);
  }
  for (const iv of app.interviews) {
    parts.push(iv.title, iv.location ?? "", iv.type);
  }
  return parts.join("  ").toLowerCase();
}

function tokensFromQuery(q: string): string[] {
  return q
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [applications, setApplications] = useState<Application[]>(seed);
  const [extraReads, setExtraReads] = useState<Set<string>>(new Set());
  const [syncing, setSyncing] = useState(false);
  const [isBackendActive, setIsBackendActive] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setExtraReads(loadReadIds());
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [remote, last] = await Promise.all([listApplications(), getLastSync()]);
      setLastSyncAt(last);
      if (remote.length > 0) {
        setApplications(remote.map(dtoToApplication));
        setIsBackendActive(true);
      } else if (last) {
        setApplications([]);
        setIsBackendActive(true);
      } else {
        setApplications(seed);
        setIsBackendActive(false);
      }
    } catch {
      setIsBackendActive(false);
      setApplications(seed);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
      const probe = await getLastSync().catch(() => null);
      if (probe !== null) {
        if (!probe || new Date(probe).getTime() === 0) {
          setSyncing(true);
          setSyncMessage("Reading your inbox for the first time… this may take a minute.");
        }
        const result = await triggerInitialBackfillIfNeeded().catch(() => null);
        setSyncing(false);
        if (result && "imported" in result && (result.imported ?? 0) > 0) {
          setSyncMessage(`Imported ${result.imported} emails · ${result.newApplications ?? 0} applications`);
          await refresh();
          setTimeout(() => setSyncMessage(null), 8000);
        } else if (result && "error" in result) {
          setSyncMessage(`Backfill failed: ${result.error}`);
        } else {
          setSyncMessage(null);
        }
      }
    })();
  }, [refresh]);

  const baseNotifications = useMemo(() => buildNotifications(applications), [applications]);

  const notifications = useMemo(
    () => baseNotifications.map((n) => (extraReads.has(n.id) ? { ...n, read: true } : n)),
    [baseNotifications, extraReads],
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addApplication = useCallback((input: NewApplicationInput) => {
    const now = new Date().toISOString();
    const color = input.logoColor ?? PALETTE[Math.floor(Math.random() * PALETTE.length)];
    const optimistic: Application = {
      id: makeId("a"),
      company: input.company,
      jobTitle: input.jobTitle,
      location: input.location,
      status: input.status,
      appliedAt: now,
      lastActivityAt: now,
      source: input.source,
      salary: input.salary,
      logoColor: color,
      emails: [],
      interviews: [],
      notes: input.notes,
    };
    setApplications((prev) => [optimistic, ...prev]);
    createApplication({
      company: input.company,
      jobTitle: input.jobTitle,
      location: input.location,
      status: input.status,
      source: input.source,
      salary: input.salary,
      notes: input.notes,
    })
      .then(() => refresh())
      .catch(() => {});
    return optimistic;
  }, [refresh]);

  const updateApplication = useCallback(async (id: string, patch: ApplicationPatch) => {
    setApplications((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              ...(patch.company !== undefined ? { company: patch.company } : {}),
              ...(patch.jobTitle !== undefined ? { jobTitle: patch.jobTitle } : {}),
              ...(patch.location !== undefined ? { location: patch.location } : {}),
              ...(patch.status !== undefined ? { status: patch.status } : {}),
              ...(patch.source !== undefined ? { source: patch.source } : {}),
              ...(patch.salary !== undefined ? { salary: patch.salary ?? undefined } : {}),
              ...(patch.notes !== undefined ? { notes: patch.notes ?? undefined } : {}),
              lastActivityAt: new Date().toISOString(),
            }
          : a,
      ),
    );
    try {
      await updateApplicationAction(id, patch);
    } catch {
      await refresh();
    }
  }, [refresh]);

  const deleteApplication = useCallback(async (id: string) => {
    setApplications((prev) => prev.filter((a) => a.id !== id));
    try {
      await deleteApplicationAction(id);
    } catch {
      await refresh();
    }
  }, [refresh]);

  const markAllRead = useCallback(() => {
    setExtraReads((prev) => {
      const next = new Set(prev);
      for (const n of baseNotifications) next.add(n.id);
      saveReadIds(next);
      return next;
    });
  }, [baseNotifications]);

  const markRead = useCallback((id: string) => {
    setExtraReads((prev) => {
      const next = new Set(prev).add(id);
      saveReadIds(next);
      return next;
    });
  }, []);

  const triggerSync = useCallback(() => {
    setSyncing(true);
    setSyncMessage("Reading your inbox…");
    runSyncNow(14)
      .then(async (res) => {
        if (res.ok) {
          setSyncMessage(`Imported ${res.imported} new · ${res.newApplications} new applications`);
          await refresh();
        } else {
          setSyncMessage(`Sync failed: ${res.reason}`);
        }
      })
      .catch((err) => setSyncMessage(`Sync failed: ${err.message}`))
      .finally(() => {
        setSyncing(false);
        setTimeout(() => setSyncMessage(null), 6000);
      });
  }, [refresh]);

  const tokens = useMemo(() => tokensFromQuery(searchQuery), [searchQuery]);

  const matchesQuery = useCallback(
    (app: Application) => {
      if (tokens.length === 0) return true;
      const haystack = buildHaystack(app);
      return tokens.every((t) => haystack.includes(t));
    },
    [tokens],
  );

  const filteredApplications = useMemo(
    () => (tokens.length === 0 ? applications : applications.filter(matchesQuery)),
    [applications, matchesQuery, tokens.length],
  );

  const value = useMemo(
    () => ({
      applications,
      filteredApplications,
      searchQuery,
      setSearchQuery,
      matchesQuery,
      addApplication,
      updateApplication,
      deleteApplication,
      notifications,
      unreadCount,
      markAllRead,
      markRead,
      syncing,
      triggerSync,
      isBackendActive,
      lastSyncAt,
      syncMessage,
      refresh,
    }),
    [applications, filteredApplications, searchQuery, matchesQuery, addApplication, updateApplication, deleteApplication, notifications, unreadCount, markAllRead, markRead, syncing, triggerSync, isBackendActive, lastSyncAt, syncMessage, refresh],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
