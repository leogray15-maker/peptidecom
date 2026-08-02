// TSW / eczema recovery domain content and pure helpers.
// Safe to import from both server and client code (no server-only deps).
//
// Tone rule for all copy in this file: warm, reassuring, never clinical.
// Frame stage descriptions as "many people experience…" — never "you will…".

// ─── Body map zones ──────────────────────────────────────────────────────────

export interface BodyZone {
  id: string;
  label: string;
}

export const BODY_ZONES: BodyZone[] = [
  { id: "scalp", label: "Scalp" },
  { id: "face", label: "Face" },
  { id: "neck", label: "Neck" },
  { id: "shoulders", label: "Shoulders" },
  { id: "chest", label: "Chest" },
  { id: "stomach", label: "Stomach" },
  { id: "back", label: "Back" },
  { id: "arms", label: "Arms" },
  { id: "elbow-creases", label: "Elbow creases" },
  { id: "hands", label: "Hands" },
  { id: "legs", label: "Legs" },
  { id: "knee-creases", label: "Knee creases" },
  { id: "feet", label: "Feet" },
];

export const zoneLabel = (id: string) =>
  BODY_ZONES.find((z) => z.id === id)?.label ?? id;

// ─── Symptoms ────────────────────────────────────────────────────────────────

export const SYMPTOMS = [
  { id: "itch", label: "Itch" },
  { id: "redness", label: "Redness" },
  { id: "flaking", label: "Flaking" },
  { id: "ooze", label: "Ooze" },
  { id: "burning", label: "Burning" },
  { id: "swelling", label: "Swelling" },
] as const;

// ─── Daily log shape (Firestore: users/{uid}/dailyLogs/{YYYY-MM-DD}) ─────────

export interface DailyLog {
  date: string; // YYYY-MM-DD (doc id)
  areas: string[];
  severity: number; // 1–10
  symptoms: string[];
  sleep: number | null; // 1–5
  mood: number | null; // 1–5
  note?: string | null;
  /** Server date (YYYY-MM-DD) this log was FIRST written, which is not always
   * `date` — members backfill. Set once and never overwritten. Absent on logs
   * written before the field existed; those are treated as same-day (see
   * wasLoggedSameDay). Drives the flare-day grace rule, which must not be
   * claimable retroactively. */
  loggedOn?: string | null;
}

/** Whether a log was recorded on the day it describes. Legacy logs with no
 * `loggedOn` get the benefit of the doubt — refusing them grace would
 * retroactively break streaks that were legitimately earned. */
export function wasLoggedSameDay(log: DailyLog): boolean {
  return log.loggedOn == null || log.loggedOn === log.date;
}

/** Severity at or above this counts as a "bad flare" day. */
export const BAD_FLARE_SEVERITY = 7;
/** Severity at or below this counts as a calm day (used for flare-free streaks). */
export const CALM_SEVERITY = 3;

// ─── Withdrawal timeline stages ──────────────────────────────────────────────

export interface TswStage {
  id: string;
  name: string;
  timeframe: string;
  summary: string;
  experiences: string[]; // always framed "many people experience…"
  /** What usually marks the move OUT of this stage into the next one. Surfaced
   * in the stage sheet so the taxonomy isn't a black box. Describes what
   * members typically notice — stage marking stays a member's own call. */
  movesOnWhen?: string;
}

export const TSW_STAGES: TswStage[] = [
  {
    id: "just-stopped",
    name: "Just stopped",
    timeframe: "The first days and weeks",
    summary:
      "You've made a big decision, and the first stretch can feel intense. Whatever your skin is doing right now, it doesn't predict how your whole journey will go.",
    experiences: [
      "A rebound flare that spreads beyond the areas steroids were used on",
      "Skin that feels hot, tight or 'sunburned'",
      "Anxiety and second-guessing — completely normal at this point",
    ],
    movesOnWhen:
      "The rebound flare stops spreading to new areas and settles into a rhythm of waves rather than one continuous escalation.",
  },
  {
    id: "early",
    name: "Early withdrawal",
    timeframe: "Roughly the first 6 months",
    summary:
      "Often the hardest chapter — and the one where support matters most. Flares tend to come in waves. A bad week is a wave, not a verdict.",
    experiences: [
      "Cycles of flaring, oozing, flaking and shedding",
      "Disturbed sleep and the 'itch that doesn't quit'",
      "Temperature swings, nerve zingers, and skin that changes week to week",
      "First glimpses of calm patches between waves",
    ],
    movesOnWhen:
      "Calm patches start lasting days rather than hours, and the gaps between flares become something you can count.",
  },
  {
    id: "middle",
    name: "The long middle",
    timeframe: "Roughly months 6–12",
    summary:
      "Progress here is real but rarely linear. Many people describe it as 'two steps forward, one step back' — the gaps between flares slowly stretch out.",
    experiences: [
      "Flares that are shorter or less intense than early ones",
      "Longer calm stretches — sometimes whole flare-free weeks",
      "Frustration at setbacks after good runs (grieve them, then keep going)",
      "Sleep gradually improving",
    ],
    movesOnWhen:
      "Flares become events with a start and an end rather than the background state, and good runs outlast bad ones.",
  },
  {
    id: "late",
    name: "Late recovery",
    timeframe: "Often somewhere in years 1–2",
    summary:
      "The trend line points up. Many people find flares become occasional events rather than a way of life, and start getting pieces of normal life back.",
    experiences: [
      "Mostly calm skin with occasional, manageable flares",
      "Skin texture and resilience returning",
      "Rebuilding confidence — social life, exercise, clothes you'd stopped wearing",
    ],
    movesOnWhen:
      "Weeks pass without skin being the thing that decides your day.",
  },
  {
    id: "recovered",
    name: "Recovered & maintaining",
    timeframe: "You define this one",
    summary:
      "Only you get to say when you're here. For many it means skin is no longer the first thing they think about in the morning. Your story can now carry someone else through their worst week.",
    experiences: [
      "Stable skin with ordinary ups and downs",
      "A maintenance routine that feels like habit, not survival",
      "Looking back and realising how far you've come",
    ],
    movesOnWhen:
      "This one's yours to define — nobody else marks it for you.",
  },
];

export const stageName = (id?: string | null) =>
  TSW_STAGES.find((s) => s.id === id)?.name ?? null;

// ─── Milestones (Firestore: users/{uid}/milestones/{key}) ────────────────────

export interface MilestoneDef {
  key: string;
  title: string;
  message: string; // the congratulation — always first
  bridge: string; // the soft "next chapter" line — always second
}

export const MILESTONE_DEFS: Record<string, MilestoneDef> = {
  first_log: {
    key: "first_log",
    title: "First log ✦",
    message:
      "You just did something most people never do: you started paying attention on purpose. Every entry from here builds a picture only you can see.",
    bridge:
      "Recovery is a practice of showing up for yourself. That skill outlives the skin part.",
  },
  streak_7: {
    key: "streak_7",
    title: "7-day tracking streak",
    message:
      "Seven days in a row. Through good skin days and bad ones, you kept showing up. That consistency is the quiet engine of recovery.",
    bridge:
      "You're proving to yourself that you can keep promises to yourself. Hold onto that.",
  },
  days_30: {
    key: "days_30",
    title: "30 days tracked",
    message:
      "A whole month of data. Patterns are starting to form that no doctor's five-minute appointment could ever see. You're becoming the expert on you.",
    bridge:
      "This is what taking your story back looks like — one small entry at a time.",
  },
  days_90: {
    key: "days_90",
    title: "The three-month mark",
    message:
      "Ninety days tracked. Look back at your photos and your chart — the person who started this would be proud of you. However your skin looks today, you are further along than you were.",
    bridge:
      "You've built resilience most people never have to. When you're ready, there's a next chapter for everything you've learned about yourself.",
  },
  flare_free_week: {
    key: "flare_free_week",
    title: "First flare-free week",
    message:
      "Seven calm days in a row. Read that again. Your skin just showed you it remembers how to be at peace — and what happened once can happen again, for longer.",
    bridge:
      "Calm skin gives you room to ask a bigger question: who do you want to be on the other side of this?",
  },
  recovered: {
    key: "recovered",
    title: "You marked yourself recovered",
    message:
      "Nobody handed you this — you walked through it. This milestone belongs entirely to you, and your story is now proof for everyone still in the tunnel.",
    bridge:
      "The discipline, patience and self-trust you built here don't retire when your skin heals. The Archives is where that next chapter lives.",
  },
};

// ─── Pure stats helpers ──────────────────────────────────────────────────────

const DAY_MS = 86_400_000;

/** Local-date key (YYYY-MM-DD) — uses the runtime's local timezone. */
export function dateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toUtcMs(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((toUtcMs(b) - toUtcMs(a)) / DAY_MS);
}

// ─── Streak & the flare-day grace pass ───────────────────────────────────────

/** Length of the rolling window in which only one grace pass may be spent. */
export const GRACE_WINDOW_DAYS = 7;

export interface StreakResult {
  /** Consecutive logged days ending at the most recent log, with single-day
   * gaps bridged by a grace pass where one was available. */
  streak: number;
  /** Dates of the flare days whose grace pass is currently holding the streak
   * together. Empty when the streak needed no help. */
  graceDatesUsed: string[];
  /** True when at least one pass is holding the current streak together — the
   * dashboard says so rather than silently inflating the number. */
  usedGrace: boolean;
  /** Whether a pass is available right now, i.e. none spent in the last
   * GRACE_WINDOW_DAYS ending today. */
  graceAvailable: boolean;
}

/**
 * Current tracking streak with the flare-day grace mechanic.
 *
 * The rule, stated once:
 *   A single missed day does not reset the streak IF the last logged day
 *   before the gap was a bad-flare day (severity ≥ BAD_FLARE_SEVERITY) that
 *   was logged on the day itself — and no other pass has been spent within the
 *   preceding GRACE_WINDOW_DAYS.
 *
 * Consequences that are deliberate, not accidents:
 *   · Gaps of two or more missed days always reset the streak to 0. There is
 *     no way to chain passes across a long absence.
 *   · Backfilling a bad day later never rescues a broken streak
 *     (wasLoggedSameDay), so the mechanic can't be farmed after the fact.
 *   · A reset streak is still not a dead end: daysTracked keeps counting, and
 *     the dashboard shows that framing instead of a bare "0 days".
 */
export function computeStreak(logs: DailyLog[], today = dateKey()): StreakResult {
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const empty: StreakResult = {
    streak: 0,
    graceDatesUsed: [],
    usedGrace: false,
    graceAvailable: true,
  };
  if (sorted.length === 0) return empty;

  const graceDatesUsed: string[] = [];

  /** A pass may be spent on `flareDate` only if the last one spent (we walk
   * backwards, so that's the most recently pushed) is at least a full window
   * away. */
  const canSpend = (flareDate: string) => {
    const last = graceDatesUsed[graceDatesUsed.length - 1];
    return last === undefined || daysBetween(flareDate, last) >= GRACE_WINDOW_DAYS;
  };

  /** Can the gap ending at `laterDate` be bridged by the log at `earlier`? */
  const bridges = (earlier: DailyLog, laterDate: string) =>
    daysBetween(earlier.date, laterDate) === 2 &&
    earlier.severity >= BAD_FLARE_SEVERITY &&
    wasLoggedSameDay(earlier) &&
    canSpend(earlier.date);

  // Anchor: the streak is live if the last log is today or yesterday, or if a
  // grace pass covers a single missed day between the last log and today.
  const last = sorted[sorted.length - 1];
  const sinceLast = daysBetween(last.date, today);
  if (sinceLast > 1) {
    if (!bridges(last, today)) return empty;
    graceDatesUsed.push(last.date);
  }

  let streak = 1;
  for (let i = sorted.length - 2; i >= 0; i--) {
    const gap = daysBetween(sorted[i].date, sorted[i + 1].date);
    if (gap === 1) {
      streak++;
      continue;
    }
    if (bridges(sorted[i], sorted[i + 1].date)) {
      graceDatesUsed.push(sorted[i].date);
      streak++;
      continue;
    }
    break;
  }

  return {
    streak,
    graceDatesUsed,
    usedGrace: graceDatesUsed.length > 0,
    graceAvailable: graceDatesUsed.every((d) => daysBetween(d, today) >= GRACE_WINDOW_DAYS),
  };
}

export interface TrackerStats {
  daysTracked: number;
  /** Consecutive logged days ending at the most recent log (0 if the last log
   * is more than a day old and no grace pass covers the gap). */
  streak: number;
  /** True when a flare-day grace pass is holding the current streak together. */
  streakUsedGrace: boolean;
  /** Whether an unspent grace pass is available in the current window. */
  graceAvailable: boolean;
  lastBadFlare: string | null;
  daysSinceBadFlare: number | null;
  hadFlareFreeWeek: boolean;
  avgSeverity7d: number | null;
}

/** Compute dashboard stats from logs sorted ascending by date. */
export function computeStats(logs: DailyLog[], today = dateKey()): TrackerStats {
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const daysTracked = sorted.length;

  const { streak, usedGrace, graceAvailable } = computeStreak(sorted, today);

  // Bad flares & flare-free week
  let lastBadFlare: string | null = null;
  let hadFlareFreeWeek = false;
  let calmRun = 0;
  let prevDate: string | null = null;
  for (const log of sorted) {
    if (log.severity >= BAD_FLARE_SEVERITY) lastBadFlare = log.date;
    const consecutive = prevDate !== null && daysBetween(prevDate, log.date) === 1;
    if (log.severity <= CALM_SEVERITY) {
      calmRun = consecutive ? calmRun + 1 : 1;
      if (calmRun >= 7) hadFlareFreeWeek = true;
    } else {
      calmRun = 0;
    }
    prevDate = log.date;
  }

  const recent = sorted.filter((l) => daysBetween(l.date, today) < 7);
  const avgSeverity7d =
    recent.length > 0
      ? Math.round((recent.reduce((s, l) => s + l.severity, 0) / recent.length) * 10) / 10
      : null;

  return {
    daysTracked,
    streak,
    streakUsedGrace: usedGrace,
    graceAvailable,
    lastBadFlare,
    daysSinceBadFlare: lastBadFlare ? daysBetween(lastBadFlare, today) : null,
    hadFlareFreeWeek,
    avgSeverity7d,
  };
}

/** Which milestone keys the user has earned, given their logs and stage. */
export function earnedMilestones(
  stats: TrackerStats,
  recoveryStage?: string | null
): string[] {
  const keys: string[] = [];
  if (stats.daysTracked >= 1) keys.push("first_log");
  if (stats.streak >= 7) keys.push("streak_7");
  if (stats.daysTracked >= 30) keys.push("days_30");
  if (stats.daysTracked >= 90) keys.push("days_90");
  if (stats.hadFlareFreeWeek) keys.push("flare_free_week");
  if (recoveryStage === "recovered") keys.push("recovered");
  return keys;
}

// ─── Trigger log kinds ───────────────────────────────────────────────────────

export const TRIGGER_KINDS = [
  { id: "product", label: "Product / moisturiser" },
  { id: "food", label: "Food & drink" },
  { id: "environment", label: "Environment" },
  { id: "stress", label: "Stress / life" },
  { id: "routine", label: "Routine change" },
] as const;

export const TRIGGER_EFFECTS = [
  { value: 1, label: "Seemed to help" },
  { value: 0, label: "No change" },
  { value: -1, label: "Seemed to flare me" },
] as const;

// ─── Research goals (journal + peptide tracker) ──────────────────────────────
// People run peptides for very different reasons — the journal and tracker are
// goal-agnostic so weight is just one lens among many.

export const RESEARCH_GOALS = [
  { id: "weight-loss", label: "Weight loss", emoji: "⚖️" },
  { id: "muscle", label: "Muscle & strength", emoji: "💪" },
  { id: "skin", label: "Skin & anti-aging", emoji: "✨" },
  { id: "cognitive", label: "Cognitive function", emoji: "🧠" },
  { id: "sleep", label: "Sleep", emoji: "🌙" },
  { id: "energy", label: "Energy & mood", emoji: "⚡" },
  { id: "healing", label: "Healing & recovery", emoji: "🩹" },
  { id: "general", label: "General wellbeing", emoji: "🌿" },
] as const;

export const goalLabel = (id?: string | null) =>
  RESEARCH_GOALS.find((g) => g.id === id)?.label ?? null;

export const goalEmoji = (id?: string | null) =>
  RESEARCH_GOALS.find((g) => g.id === id)?.emoji ?? "";

// ─── Funnel events (Firestore: funnelEvents) ─────────────────────────────────

export const FUNNEL_EVENTS = [
  "milestone_reached",
  "milestone_celebrated",
  "archives_view",
  "archives_nav_click",
  "archives_cta_click",
  "celebration_next_chapter_click",
  // Retention instrumentation — so the impact of the grace-day streak, the
  // reworked insight card and the clinician-confirm flag is measurable later.
  "streak_grace_used",
  "streak_zero_prompt_click",
  "insight_card_tap",
  "insight_numbers_view",
  "insight_privacy_view",
  "stage_sheet_open",
  "derm_confirm_toggled",
  "ai_grading_consent_accepted",
  "digest_opt_in",
  "digest_opt_out",
] as const;
export type FunnelEvent = (typeof FUNNEL_EVENTS)[number];
