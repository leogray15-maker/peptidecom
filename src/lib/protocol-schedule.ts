// Dose-protocol scheduling: pure helpers shared by the peptide tracker's
// "Today" view and the API. Safe for server and client (no server-only deps).
//
// A protocol says "this peptide, this dose, on these days". The Today view
// derives what's due, what's been logged (by matching peptide names against
// the existing dose log), the member's adherence streak, and a 7-day strip —
// the daily loop that turns a passive log into a habit.

import { type PeptideLog } from "@/lib/tsw-db";
import { daysBetween } from "@/lib/tsw";

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export interface ProtocolSchedule {
  /** "daily" = every day; "weekly" = only on `days` (0=Sun … 6=Sat). */
  type: "daily" | "weekly";
  days?: number[];
}

export interface PeptideProtocol {
  id: string;
  peptide: string;
  doseMg: number;
  schedule: ProtocolSchedule;
  /** Optional reminder-style time label, e.g. "09:00". Display only. */
  time?: string | null;
  purpose?: string | null; // RESEARCH_GOALS id
  active: boolean;
  createdAt: string;
}

/** Local weekday (0=Sun … 6=Sat) for a YYYY-MM-DD key. */
export function weekdayOf(dateKeyStr: string): number {
  const [y, m, d] = dateKeyStr.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}

export function isDueOn(protocol: PeptideProtocol, dateKeyStr: string): boolean {
  if (!protocol.active) return false;
  if (protocol.schedule.type === "daily") return true;
  return (protocol.schedule.days ?? []).includes(weekdayOf(dateKeyStr));
}

/** Human description: "Daily" or "Mon, Thu". */
export function scheduleLabel(schedule: ProtocolSchedule): string {
  if (schedule.type === "daily") return "Daily";
  const days = [...(schedule.days ?? [])].sort((a, b) => a - b);
  if (days.length === 7) return "Daily";
  if (days.length === 0) return "No days set";
  return days.map((d) => WEEKDAY_LABELS[d]).join(", ");
}

const norm = (name: string) => name.trim().toLowerCase();

/** Was a dose of this protocol's peptide logged on this date? Matched by
 * peptide name (case-insensitive) — dose amounts may legitimately differ
 * (titration), so the name is the signal. */
export function isLoggedOn(
  protocol: PeptideProtocol,
  logsByDate: Map<string, Set<string>>,
  dateKeyStr: string
): boolean {
  return logsByDate.get(dateKeyStr)?.has(norm(protocol.peptide)) ?? false;
}

/** Index dose logs as date → set of normalised peptide names. */
export function indexLogs(logs: Pick<PeptideLog, "date" | "peptide">[]): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const l of logs) {
    const set = map.get(l.date) ?? new Set<string>();
    set.add(norm(l.peptide));
    map.set(l.date, set);
  }
  return map;
}

export interface DayAdherence {
  date: string;
  due: number;
  logged: number;
}

export interface Adherence {
  /** Protocols due today with their logged state, in creation order. */
  today: { protocol: PeptideProtocol; logged: boolean }[];
  /** Consecutive fully-adhered days ending today (or yesterday, so an
   * unfinished today doesn't kill the streak). Days with nothing due are
   * skipped, not broken. */
  streak: number;
  /** Last 7 days, oldest first. */
  week: DayAdherence[];
}

export function computeAdherence(
  protocols: PeptideProtocol[],
  logs: Pick<PeptideLog, "date" | "peptide">[],
  today: string,
  addDays: (date: string, n: number) => string
): Adherence {
  const byDate = indexLogs(logs);
  const active = protocols.filter((p) => p.active);

  const dayState = (date: string): DayAdherence => {
    const due = active.filter((p) => isDueOn(p, date));
    return {
      date,
      due: due.length,
      logged: due.filter((p) => isLoggedOn(p, byDate, date)).length,
    };
  };

  const todayDue = active.filter((p) => isDueOn(p, today));

  // Streak: walk backwards. Today only counts once complete; an in-progress
  // today is neutral. Days with nothing due are neutral too.
  let streak = 0;
  let date = today;
  let first = true;
  const earliest = protocols.length
    ? protocols.reduce((min, p) => (p.createdAt < min ? p.createdAt : min), protocols[0].createdAt).slice(0, 10)
    : today;
  for (let guard = 0; guard < 365; guard++) {
    const s = dayState(date);
    if (s.due > 0) {
      const complete = s.logged >= s.due;
      if (complete) streak++;
      else if (first) {
        // an unfinished today is neutral — keep walking
      } else break;
    }
    first = false;
    date = addDays(date, -1);
    if (daysBetween(earliest, date) < 0) break;
  }

  const week: DayAdherence[] = [];
  for (let i = 6; i >= 0; i--) week.push(dayState(addDays(today, -i)));

  return {
    today: todayDue.map((protocol) => ({
      protocol,
      logged: isLoggedOn(protocol, byDate, today),
    })),
    streak,
    week,
  };
}
