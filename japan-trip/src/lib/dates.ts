// Trip days are plain "YYYY-MM-DD" strings so they never shift with time zones.

function parse(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function format(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function todayIso(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(iso: string, n: number): string {
  const d = parse(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return format(d);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((parse(to).getTime() - parse(from).getTime()) / 86_400_000);
}

/** Every date from start to end inclusive (capped at 60 days to protect against typos). */
export function tripDays(start?: string | null, end?: string | null): string[] {
  if (!start || !end || end < start) return [];
  const n = Math.min(daysBetween(start, end), 59);
  return Array.from({ length: n + 1 }, (_, i) => addDays(start, i));
}

export function formatDay(iso: string, opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" }): string {
  return parse(iso).toLocaleDateString(undefined, { ...opts, timeZone: "UTC" });
}

export function formatTime(hhmm?: string | null): string {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(Date.UTC(2000, 0, 1, h, m));
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", timeZone: "UTC" });
}

export type TripPhase =
  | { phase: "undated" }
  | { phase: "before"; daysToGo: number }
  | { phase: "during"; dayNumber: number; totalDays: number }
  | { phase: "after" };

export function tripPhase(start?: string | null, end?: string | null, today = todayIso()): TripPhase {
  if (!start || !end) return { phase: "undated" };
  if (today < start) return { phase: "before", daysToGo: daysBetween(today, start) };
  if (today > end) return { phase: "after" };
  return { phase: "during", dayNumber: daysBetween(start, today) + 1, totalDays: daysBetween(start, end) + 1 };
}
