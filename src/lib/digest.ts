// Weekly personalised insight digest — payload generation.
//
// Safe to import from both server and client code (no server-only deps).
//
// Reuses the same pattern engine as the dashboard's "strongest pattern" card
// (computePersonalInsight) rather than growing a second, subtly-different
// notion of what a pattern is. If the card wouldn't show it, the digest
// doesn't claim it.
//
// SCOPE: this module produces payloads and decides eligibility. It does not
// send anything — there is no push/email transport in this repo. See
// docs/digest-delivery.md for what wiring one up involves.

import {
  type PersonalInsight,
  type TriggerLike,
  PATTERN_NOT_PROOF,
  computePersonalInsight,
} from "@/lib/insights";
import {
  type DigestPrefs,
  type PushDecision,
  pushDecision,
  resolveDigestPrefs,
} from "@/lib/notifications";
import { type DailyLog, type TrackerStats, computeStats } from "@/lib/tsw";

/** How many days of logs a member needs in the week before we bother them. */
export const MIN_LOGS_FOR_DIGEST = 3;

export interface DigestPayload {
  /** Notification title — short enough for a lock screen. */
  title: string;
  /** Notification body. */
  body: string;
  /** Deep link for the tap target. */
  url: string;
  /** The in-app card's fuller content. */
  sections: { heading: string; text: string }[];
  /** ISO week-ending date the digest covers. */
  weekEnding: string;
  /** Carried through so the client can render the same bucket/detail UI. */
  insight: PersonalInsight | null;
}

export interface DigestResult {
  /** Null when the member isn't eligible this week. */
  payload: DigestPayload | null;
  /** Why nothing was generated, for the job's summary counters. */
  skipped: "not-opted-in" | "too-few-logs" | null;
  /** Whether a push may go out now, or must wait for quiet hours to end.
   * Null when there's no payload to deliver. */
  push: PushDecision | null;
}

/**
 * Build this week's digest for one member.
 *
 * Opt-in is checked FIRST and hard: a member who never opted in gets no
 * payload generated at all, not a payload that's quietly withheld. Quiet hours
 * are a delivery-timing concern and only apply once there's something to send.
 */
export function buildDigest(
  logs: DailyLog[],
  triggers: TriggerLike[],
  prefsInput: DigestPrefs | null | undefined,
  today: string,
  now: Date = new Date()
): DigestResult {
  const prefs = resolveDigestPrefs(prefsInput);
  if (!prefs.enabled && !prefs.inApp) {
    return { payload: null, skipped: "not-opted-in", push: null };
  }

  const week = logs.filter((l) => withinDays(l.date, today, 7));
  if (week.length < MIN_LOGS_FOR_DIGEST) {
    return { payload: null, skipped: "too-few-logs", push: null };
  }

  const stats = computeStats(logs, today);
  const insight = computePersonalInsight(logs, triggers, today);
  const sections = buildSections(week, stats, insight);

  const payload: DigestPayload = {
    title: insight ? insight.headline : `Your week: ${week.length} days logged`,
    body: insight
      ? `${insight.detail} ${PATTERN_NOT_PROOF}`
      : `${week.length} days logged this week, averaging ${avgSeverity(week)}/10. Open to see the week in full.`,
    url: "/insights",
    sections,
    weekEnding: today,
    insight,
  };

  return { payload, skipped: null, push: pushDecision(prefs, now) };
}

function buildSections(
  week: DailyLog[],
  stats: TrackerStats,
  insight: PersonalInsight | null
): { heading: string; text: string }[] {
  const sections: { heading: string; text: string }[] = [
    {
      heading: "Your week",
      text: `${week.length} day${week.length === 1 ? "" : "s"} logged, averaging ${avgSeverity(week)}/10 severity.`,
    },
  ];

  if (stats.streak > 0) {
    sections.push({
      heading: "Streak",
      text: stats.streakUsedGrace
        ? `${stats.streak} days — a flare-day pass kept it alive through a hard day.`
        : `${stats.streak} days running. ${stats.daysTracked} days tracked in total.`,
    });
  } else if (stats.daysTracked > 0) {
    // Never a bare zero — the total is the number that keeps meaning something.
    sections.push({
      heading: "Your tracking",
      text: `${stats.daysTracked} days logged in total. Picking it back up today starts a new run.`,
    });
  }

  if (insight) {
    sections.push({
      heading: "Strongest pattern",
      text: `${insight.detail} ${PATTERN_NOT_PROOF} (${insight.n} day-pairs over the last ${insight.windowDays} days.)`,
    });
  }

  return sections;
}

function avgSeverity(logs: DailyLog[]): number {
  return Math.round((logs.reduce((s, l) => s + l.severity, 0) / logs.length) * 10) / 10;
}

function withinDays(date: string, today: string, days: number): boolean {
  const diff = (Date.parse(today) - Date.parse(date)) / 86_400_000;
  return diff >= 0 && diff < days;
}
