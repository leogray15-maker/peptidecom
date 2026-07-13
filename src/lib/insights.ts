// Cohort + personal insights: pure maths and statement building.
// Safe to import from both server and client code (no server-only deps).
//
// Privacy model: `UserFeatures` exists only in memory inside the nightly
// aggregation run. What gets persisted (`CohortAggregates`) contains cohort
// statistics only — no uids, emails, names, notes, or any per-user series —
// and every stat carries the number of contributing users so small cohorts
// can be suppressed. See MIN_COHORT.

import { BAD_FLARE_SEVERITY, type DailyLog, daysBetween, stageName } from "@/lib/tsw";

/** Minimum number of distinct users behind a stat before it may be shown
 * (or even written). Guards against small-sample noise and re-identification. */
export const MIN_COHORT = 20;

/** Sleep ratings at or below this count as a "rough night" (scale is 1–5). */
export const LOW_SLEEP = 2;
/** Sleep ratings at or above this count as a "good night". */
export const HIGH_SLEEP = 4;

/** Per-user minimum observations before that user contributes to a lagged
 * stat — one coincidence shouldn't count as a pattern. */
const MIN_OBS_PER_USER = 3;

// ─── Pure helpers ────────────────────────────────────────────────────────────

export function pearson(pairs: [number, number][]): number | null {
  const n = pairs.length;
  if (n < 7) return null;
  const mx = pairs.reduce((s, p) => s + p[0], 0) / n;
  const my = pairs.reduce((s, p) => s + p[1], 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (const [x, y] of pairs) {
    num += (x - mx) * (y - my);
    dx += (x - mx) ** 2;
    dy += (y - my) ** 2;
  }
  if (dx === 0 || dy === 0) return null;
  return num / Math.sqrt(dx * dy);
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

// ─── Per-user feature extraction ─────────────────────────────────────────────

export interface StageEvent {
  stage: string;
  at: string; // ISO timestamp
}

export interface TriggerLike {
  date: string;
  kind: string;
  name: string;
}

/** Everything the aggregator needs to know about one user — already stripped
 * of identity. Never persisted; lives only inside the aggregation run. */
export interface UserFeatures {
  stage: string | null;
  /** Per-week (since anchor) mean severity. Week = floor(days/7), capped. */
  severityByWeek: Map<number, number>;
  /** Next-day outcomes after low- vs high-rated sleep nights. */
  sleep: {
    lowN: number;
    lowFlares: number;
    lowSevSum: number;
    highN: number;
    highFlares: number;
    highSevSum: number;
  };
  /** Mean next-day severity delta per trigger kind. */
  triggerDeltas: Map<string, { n: number; deltaSum: number }>;
  /** Days spent between consecutive stage marks. */
  stageDurations: { from: string; to: string; days: number }[];
}

const MAX_WEEK = 156; // cap the curve at 3 years

/** Extract anonymous features from one user's raw data.
 * `logs` must be sorted ascending by date. */
export function computeUserFeatures(
  logs: DailyLog[],
  triggers: TriggerLike[],
  profile: { recoveryStage?: string | null; tswStartDate?: string | null },
  stageEvents: StageEvent[]
): UserFeatures | null {
  if (logs.length === 0 && stageEvents.length < 2) return null;

  // Recovery clock anchor: explicit start date when set, else first log.
  const anchor = profile.tswStartDate ?? logs[0]?.date ?? null;

  const severityByWeek = new Map<number, number>();
  if (anchor) {
    const sums = new Map<number, { sum: number; n: number }>();
    for (const l of logs) {
      const days = daysBetween(anchor, l.date);
      if (days < 0) continue;
      const week = Math.min(Math.floor(days / 7), MAX_WEEK);
      const cur = sums.get(week) ?? { sum: 0, n: 0 };
      cur.sum += l.severity;
      cur.n++;
      sums.set(week, cur);
    }
    for (const [week, { sum, n }] of sums) severityByWeek.set(week, sum / n);
  }

  // Lagged sleep → next-day severity, on consecutive logged days only.
  const byDate = new Map(logs.map((l) => [l.date, l]));
  const sleep = { lowN: 0, lowFlares: 0, lowSevSum: 0, highN: 0, highFlares: 0, highSevSum: 0 };
  for (let i = 0; i < logs.length - 1; i++) {
    const day = logs[i];
    const next = logs[i + 1];
    if (daysBetween(day.date, next.date) !== 1 || day.sleep == null) continue;
    const flare = next.severity >= BAD_FLARE_SEVERITY ? 1 : 0;
    if (day.sleep <= LOW_SLEEP) {
      sleep.lowN++;
      sleep.lowFlares += flare;
      sleep.lowSevSum += next.severity;
    } else if (day.sleep >= HIGH_SLEEP) {
      sleep.highN++;
      sleep.highFlares += flare;
      sleep.highSevSum += next.severity;
    }
  }

  // Lagged trigger → next-day severity change, needs both days logged.
  const triggerDeltas = new Map<string, { n: number; deltaSum: number }>();
  for (const t of triggers) {
    const day = byDate.get(t.date);
    const nextKey = addDays(t.date, 1);
    const next = byDate.get(nextKey);
    if (!day || !next) continue;
    const cur = triggerDeltas.get(t.kind) ?? { n: 0, deltaSum: 0 };
    cur.n++;
    cur.deltaSum += next.severity - day.severity;
    triggerDeltas.set(t.kind, cur);
  }

  // Time spent between consecutive stage marks.
  const orderedEvents = [...stageEvents].sort((a, b) => a.at.localeCompare(b.at));
  const stageDurations: UserFeatures["stageDurations"] = [];
  for (let i = 0; i < orderedEvents.length - 1; i++) {
    const from = orderedEvents[i];
    const to = orderedEvents[i + 1];
    if (from.stage === to.stage) continue;
    const days = (new Date(to.at).getTime() - new Date(from.at).getTime()) / 86_400_000;
    if (days > 0) stageDurations.push({ from: from.stage, to: to.stage, days });
  }

  return {
    stage: profile.recoveryStage ?? null,
    severityByWeek,
    sleep,
    triggerDeltas,
    stageDurations,
  };
}

export function addDays(dateKeyStr: string, n: number): string {
  const [y, m, d] = dateKeyStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

// ─── Cohort aggregation ──────────────────────────────────────────────────────

/** What gets persisted to Firestore (insights_aggregates/latest).
 * Cohort statistics only — nothing here can be traced to a user, and every
 * stat already satisfies MIN_COHORT (enforced in aggregateCohort). */
export interface CohortAggregates {
  generatedAt: string;
  totalUsers: number; // users who contributed anything (safe: single global count)
  severityByWeek: { week: number; avgSeverity: number; nUsers: number }[];
  sleepNextDay: {
    nUsers: number;
    lowFlareRate: number; // mean of per-user flare rates after rough nights
    highFlareRate: number;
    lowAvgSeverity: number;
    highAvgSeverity: number;
  } | null;
  triggerKinds: { kind: string; avgNextDayDelta: number; nUsers: number }[];
  stageTransitions: { from: string; to: string; medianDays: number; nUsers: number }[];
}

export function aggregateCohort(features: UserFeatures[]): CohortAggregates {
  // Severity by week-since-start: average each contributing user's own weekly
  // mean, so prolific loggers don't dominate.
  const weekAcc = new Map<number, { sum: number; n: number }>();
  for (const f of features) {
    for (const [week, avg] of f.severityByWeek) {
      const cur = weekAcc.get(week) ?? { sum: 0, n: 0 };
      cur.sum += avg;
      cur.n++;
      weekAcc.set(week, cur);
    }
  }
  const severityByWeek = [...weekAcc.entries()]
    .filter(([, v]) => v.n >= MIN_COHORT)
    .map(([week, v]) => ({ week, avgSeverity: round1(v.sum / v.n), nUsers: v.n }))
    .sort((a, b) => a.week - b.week);

  // Sleep → next day, per-user rates first, then averaged across users.
  const sleepUsers = features.filter(
    (f) => f.sleep.lowN >= MIN_OBS_PER_USER && f.sleep.highN >= MIN_OBS_PER_USER
  );
  let sleepNextDay: CohortAggregates["sleepNextDay"] = null;
  if (sleepUsers.length >= MIN_COHORT) {
    const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
    sleepNextDay = {
      nUsers: sleepUsers.length,
      lowFlareRate: round1(mean(sleepUsers.map((f) => f.sleep.lowFlares / f.sleep.lowN)) * 100) / 100,
      highFlareRate: round1(mean(sleepUsers.map((f) => f.sleep.highFlares / f.sleep.highN)) * 100) / 100,
      lowAvgSeverity: round1(mean(sleepUsers.map((f) => f.sleep.lowSevSum / f.sleep.lowN))),
      highAvgSeverity: round1(mean(sleepUsers.map((f) => f.sleep.highSevSum / f.sleep.highN))),
    };
  }

  // Trigger kinds: mean of per-user mean deltas.
  const kindAcc = new Map<string, { sum: number; n: number }>();
  for (const f of features) {
    for (const [kind, { n, deltaSum }] of f.triggerDeltas) {
      if (n < MIN_OBS_PER_USER) continue;
      const cur = kindAcc.get(kind) ?? { sum: 0, n: 0 };
      cur.sum += deltaSum / n;
      cur.n++;
      kindAcc.set(kind, cur);
    }
  }
  const triggerKinds = [...kindAcc.entries()]
    .filter(([, v]) => v.n >= MIN_COHORT)
    .map(([kind, v]) => ({ kind, avgNextDayDelta: round1(v.sum / v.n), nUsers: v.n }))
    .sort((a, b) => b.avgNextDayDelta - a.avgNextDayDelta);

  // Stage transitions: median days per from→to pair.
  const transAcc = new Map<string, { days: number[]; users: Set<number> }>();
  features.forEach((f, idx) => {
    for (const d of f.stageDurations) {
      const key = `${d.from}→${d.to}`;
      const cur = transAcc.get(key) ?? { days: [], users: new Set<number>() };
      cur.days.push(d.days);
      cur.users.add(idx);
      transAcc.set(key, cur);
    }
  });
  const stageTransitions = [...transAcc.entries()]
    .filter(([, v]) => v.users.size >= MIN_COHORT)
    .map(([key, v]) => {
      const [from, to] = key.split("→");
      return { from, to, medianDays: Math.round(median(v.days) ?? 0), nUsers: v.users.size };
    });

  return {
    generatedAt: new Date().toISOString(),
    totalUsers: features.length,
    severityByWeek,
    sleepNextDay,
    triggerKinds,
    stageTransitions,
  };
}

// ─── Cohort statements for the dashboard ─────────────────────────────────────

export interface CohortStatement {
  id: string;
  text: string;
  /** Higher = more relevant to this user; used to order before rotation. */
  relevance: number;
}

const KIND_PHRASES: Record<string, string> = {
  product: "trying a new product",
  food: "a logged food trigger",
  environment: "a logged environment trigger",
  stress: "a logged stress trigger",
  routine: "a routine change",
};

/** Turn the aggregate doc into human sentences, most relevant first.
 * Every stat here already passed MIN_COHORT at aggregation time. */
export function buildCohortStatements(
  agg: CohortAggregates,
  user: { stage?: string | null; weeksSinceStart?: number | null }
): CohortStatement[] {
  const out: CohortStatement[] = [];

  if (agg.sleepNextDay) {
    const { lowFlareRate, highFlareRate, nUsers, lowAvgSeverity, highAvgSeverity } = agg.sleepNextDay;
    if (highFlareRate > 0 && lowFlareRate > highFlareRate) {
      const pct = Math.round(((lowFlareRate - highFlareRate) / highFlareRate) * 100);
      out.push({
        id: "sleep-flares",
        text: `After nights rated ≤${LOW_SLEEP}/5 for sleep, members logged bad-flare days ${pct}% more often the next day (${nUsers} members' data).`,
        relevance: 3,
      });
    } else if (lowAvgSeverity > highAvgSeverity) {
      out.push({
        id: "sleep-severity",
        text: `Across ${nUsers} members, the day after a rough night ran ${round1(lowAvgSeverity - highAvgSeverity)} points higher on the severity scale than after a good night.`,
        relevance: 3,
      });
    }
  }

  // Stage transition starting from where this user is → most relevant stat.
  for (const t of agg.stageTransitions) {
    const fromName = stageName(t.from) ?? t.from;
    const toName = stageName(t.to) ?? t.to;
    const isUsers = user.stage === t.from;
    out.push({
      id: `stage-${t.from}-${t.to}`,
      text: isUsers
        ? `From where you are (“${fromName}”), members typically marked “${toName}” after ~${t.medianDays} days (median, ${t.nUsers} members).`
        : `Members typically moved from “${fromName}” to “${toName}” in ~${t.medianDays} days (median, ${t.nUsers} members).`,
      relevance: isUsers ? 5 : 1,
    });
  }

  // The user's neighbourhood of the severity curve.
  if (agg.severityByWeek.length >= 2) {
    const week = user.weeksSinceStart ?? null;
    const near =
      week != null
        ? agg.severityByWeek.reduce((best, p) =>
            Math.abs(p.week - week) < Math.abs(best.week - week) ? p : best
          )
        : null;
    const later = near ? agg.severityByWeek.filter((p) => p.week >= near.week + 4) : [];
    if (near && later.length > 0 && later[later.length - 1].avgSeverity < near.avgSeverity) {
      const far = later[later.length - 1];
      out.push({
        id: "curve-ahead",
        text: `Members around week ${near.week} averaged ${near.avgSeverity}/10 — by week ${far.week} that cohort average was down to ${far.avgSeverity}/10. The trend line points where you're going.`,
        relevance: 4,
      });
    } else {
      const first = agg.severityByWeek[0];
      const last = agg.severityByWeek[agg.severityByWeek.length - 1];
      if (last.avgSeverity < first.avgSeverity) {
        out.push({
          id: "curve-overall",
          text: `Across the whole community, average severity fell from ${first.avgSeverity}/10 around week ${first.week} to ${last.avgSeverity}/10 by week ${last.week}.`,
          relevance: 2,
        });
      }
    }
  }

  for (const k of agg.triggerKinds) {
    if (k.avgNextDayDelta <= 0.2) continue; // only clearly-elevated kinds read well
    out.push({
      id: `trigger-${k.kind}`,
      text: `The day after ${KIND_PHRASES[k.kind] ?? `a logged ${k.kind} trigger`}, severity ran +${k.avgNextDayDelta} on average across ${k.nUsers} members.`,
      relevance: 2,
    });
  }

  return out.sort((a, b) => b.relevance - a.relevance);
}

/** Deterministic daily rotation: same picks all day, fresh picks tomorrow. */
export function rotateStatements(
  statements: CohortStatement[],
  count: number,
  date = new Date()
): CohortStatement[] {
  if (statements.length <= count) return statements;
  const dayIndex = Math.floor(date.getTime() / 86_400_000);
  // Always keep the single most relevant stat; rotate the rest of the slots.
  const [top, ...rest] = statements;
  const picked: CohortStatement[] = [top];
  for (let i = 0; i < count - 1; i++) {
    picked.push(rest[(dayIndex + i) % rest.length]);
  }
  // De-dupe in the unlikely case rotation wrapped onto the same item.
  return [...new Map(picked.map((s) => [s.id, s])).values()];
}

// ─── Personal insight (the user's own data — can be specific) ────────────────

export interface PersonalInsight {
  headline: string;
  detail: string;
}

/** "Your top correlated trigger this month" from the user's own logs.
 * Falls back to their sleep↔severity correlation, then to null. */
export function computePersonalInsight(
  logs: DailyLog[],
  triggers: TriggerLike[],
  today: string
): PersonalInsight | null {
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const byDate = new Map(sorted.map((l) => [l.date, l]));
  const recentTriggers = triggers.filter((t) => daysBetween(t.date, today) < 60);

  // Per trigger *name*: mean next-day severity change.
  const byName = new Map<string, { name: string; n: number; deltaSum: number }>();
  for (const t of recentTriggers) {
    const day = byDate.get(t.date);
    const next = byDate.get(addDays(t.date, 1));
    if (!day || !next) continue;
    const key = t.name.trim().toLowerCase();
    const cur = byName.get(key) ?? { name: t.name, n: 0, deltaSum: 0 };
    cur.n++;
    cur.deltaSum += next.severity - day.severity;
    byName.set(key, cur);
  }
  const candidates = [...byName.values()]
    .filter((c) => c.n >= MIN_OBS_PER_USER)
    .map((c) => ({ ...c, avg: c.deltaSum / c.n }))
    .sort((a, b) => b.avg - a.avg);

  const top = candidates[0];
  if (top && top.avg >= 0.5) {
    return {
      headline: `Your top correlated trigger: ${top.name}`,
      detail: `Across ${top.n} logged days in the last two months, the day after “${top.name}” averaged +${round1(top.avg)} severity in your own data. Worth an experiment — not a verdict.`,
    };
  }

  // Fallback: the user's own sleep ↔ next-day severity relationship.
  const pairs: [number, number][] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    if (
      daysBetween(sorted[i].date, sorted[i + 1].date) === 1 &&
      sorted[i].sleep != null &&
      daysBetween(sorted[i].date, today) < 60
    ) {
      pairs.push([sorted[i].sleep as number, sorted[i + 1].severity]);
    }
  }
  const r = pearson(pairs);
  if (r != null && r <= -0.3) {
    return {
      headline: "Your strongest pattern: sleep",
      detail: `In your last two months of logs, better-rated nights lined up with calmer next days (r = ${round1(r)}). Protecting your evenings looks worth it in your own data.`,
    };
  }

  return null;
}

/** How many weeks into recovery this user is, using the same anchor rule as
 * the cohort curve (explicit start date, else first log). */
export function weeksSinceStart(
  logs: DailyLog[],
  profile: { tswStartDate?: string | null },
  today: string
): number | null {
  const first = [...logs].sort((a, b) => a.date.localeCompare(b.date))[0]?.date ?? null;
  const anchor = profile.tswStartDate ?? first;
  if (!anchor) return null;
  const days = daysBetween(anchor, today);
  return days >= 0 ? Math.floor(days / 7) : null;
}
