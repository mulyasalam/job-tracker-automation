import type { Application } from "@/lib/mock-data";

export type DateFilterMode = "all" | "today" | "week" | "month" | "date" | "range";

export interface DateFilter {
  mode: DateFilterMode;
  date?: string;       // YYYY-MM-DD for "date" mode
  startDate?: string;  // YYYY-MM-DD for "range" mode
  endDate?: string;    // YYYY-MM-DD for "range" mode
}

export const ALL_TIME: DateFilter = { mode: "all" };

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function startOfWeek(d: Date): Date {
  const x = startOfDay(d);
  const day = x.getDay();
  // Treat Monday as start of week (European convention)
  const diff = (day + 6) % 7;
  x.setDate(x.getDate() - diff);
  return x;
}

function endOfWeek(d: Date): Date {
  const s = startOfWeek(d);
  const e = new Date(s);
  e.setDate(s.getDate() + 6);
  return endOfDay(e);
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function parseDateInput(s: string): Date {
  // YYYY-MM-DD → local Date (avoid UTC interpretation)
  const [y, m, day] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, day ?? 1);
}

export function resolveDateFilterRange(
  filter: DateFilter,
  now: Date = new Date(),
): { start: Date | null; end: Date | null } {
  switch (filter.mode) {
    case "all":
      return { start: null, end: null };
    case "today":
      return { start: startOfDay(now), end: endOfDay(now) };
    case "week":
      return { start: startOfWeek(now), end: endOfWeek(now) };
    case "month":
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case "date": {
      if (!filter.date) return { start: null, end: null };
      const d = parseDateInput(filter.date);
      return { start: startOfDay(d), end: endOfDay(d) };
    }
    case "range": {
      const s = filter.startDate ? startOfDay(parseDateInput(filter.startDate)) : null;
      const e = filter.endDate ? endOfDay(parseDateInput(filter.endDate)) : null;
      return { start: s, end: e };
    }
  }
}

function isInRange(iso: string, start: Date | null, end: Date | null): boolean {
  const t = new Date(iso).getTime();
  if (start && t < start.getTime()) return false;
  if (end && t > end.getTime()) return false;
  return true;
}

export function applicationMatchesDateFilter(app: Application, filter: DateFilter): boolean {
  if (filter.mode === "all") return true;
  const { start, end } = resolveDateFilterRange(filter);
  if (!start && !end) return true;

  if (isInRange(app.appliedAt, start, end)) return true;
  if (isInRange(app.lastActivityAt, start, end)) return true;
  for (const e of app.emails) {
    if (isInRange(e.receivedAt, start, end)) return true;
  }
  for (const iv of app.interviews) {
    if (isInRange(iv.scheduledAt, start, end)) return true;
  }
  return false;
}

export function describeDateFilter(filter: DateFilter): string {
  const now = new Date();
  switch (filter.mode) {
    case "all":
      return "All time";
    case "today":
      return "Today";
    case "week":
      return "This week";
    case "month":
      return now.toLocaleString("en-US", { month: "long", year: "numeric" });
    case "date":
      if (!filter.date) return "Pick a date";
      return parseDateInput(filter.date).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
    case "range":
      if (!filter.startDate || !filter.endDate) return "Pick a range";
      return `${parseDateInput(filter.startDate).toLocaleString("en-US", { month: "short", day: "numeric" })} – ${parseDateInput(filter.endDate).toLocaleString("en-US", { month: "short", day: "numeric" })}`;
  }
}
