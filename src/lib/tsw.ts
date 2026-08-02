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

export interface TrackerStats {
  daysTracked: number;
  /** Consecutive logged days ending at the most recent log (0 if the last log
   * is more than a day old — the streak has lapsed). */
  streak: number;
  lastBadFlare: string | null;
  daysSinceBadFlare: number | null;
  hadFlareFreeWeek: boolean;
  avgSeverity7d: number | null;
}

/** Compute dashboard stats from logs sorted ascending by date. */
export function computeStats(logs: DailyLog[], today = dateKey()): TrackerStats {
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  const daysTracked = sorted.length;

  // Current streak: consecutive days ending at the last log, only if that log
  // is today or yesterday.
  let streak = 0;
  if (sorted.length > 0) {
    const last = sorted[sorted.length - 1].date;
    if (daysBetween(last, today) <= 1) {
      streak = 1;
      for (let i = sorted.length - 2; i >= 0; i--) {
        if (daysBetween(sorted[i].date, sorted[i + 1].date) === 1) streak++;
        else break;
      }
    }
  }

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

/**
 * The everyday suspects, as a one-tap checklist.
 *
 * The detailed trigger form (name + effect + note) is still there for anything
 * specific — this list exists so "what happened today?" is five taps instead of
 * five forms. `icon` is a lucide icon name, resolved in the client component.
 * Condition-specific suggestions are appended to this list at render time.
 */
export const COMMON_TRIGGERS = [
  { name: "Stress", kind: "stress", icon: "Brain" },
  { name: "Poor sleep", kind: "stress", icon: "Moon" },
  { name: "Sweating / exercise", kind: "environment", icon: "Dumbbell" },
  { name: "Hot shower", kind: "environment", icon: "ShowerHead" },
  { name: "Cold weather", kind: "environment", icon: "Snowflake" },
  { name: "Dry air / heating", kind: "environment", icon: "Wind" },
  { name: "Sun exposure", kind: "environment", icon: "Sun" },
  { name: "Dust / pollen", kind: "environment", icon: "Droplets" },
  { name: "Spicy / salty food", kind: "food", icon: "Utensils" },
  { name: "Alcohol", kind: "food", icon: "Wine" },
  { name: "New medication", kind: "routine", icon: "Pill" },
  { name: "Illness / infection", kind: "routine", icon: "BriefcaseMedical" },
  { name: "Skin injury", kind: "routine", icon: "Bandage" },
  { name: "Rough fabric / wool", kind: "environment", icon: "Shirt" },
  { name: "Skipped moisturiser", kind: "routine", icon: "Waves" },
  { name: "Smoking", kind: "routine", icon: "Cigarette" },
] as const;

export const TRIGGER_EFFECTS = [
  { value: 1, label: "Seemed to help" },
  { value: 0, label: "No change" },
  { value: -1, label: "Seemed to flare me" },
] as const;

// ─── Feature consents ────────────────────────────────────────────────────────
// The keys live here (shared, dependency-free) so both the client store in
// lib/consent.ts and the server route that persists them can use them without
// crossing the client/server boundary.

export const CONSENT_KEYS = ["photoEstimate", "toolHistory"] as const;
export type ConsentKey = (typeof CONSENT_KEYS)[number];

/** The on-device conveniences are on unless the member opts out. */
export const CONSENT_DEFAULTS: Record<ConsentKey, boolean> = {
  photoEstimate: true,
  toolHistory: true,
};

// ─── Itch check-ins ──────────────────────────────────────────────────────────
// The itch is the part people actually live with hour to hour, so it gets its
// own one-tap log rather than waiting for the end-of-day tracker.

/** What helped in the moment. Coping options only — never "just don't
 * scratch", which is advice nobody in a flare has ever needed to hear. */
export const ITCH_ACTIONS = [
  { id: "cold", label: "Cold compress" },
  { id: "moisturise", label: "Moisturised" },
  { id: "distract", label: "Distraction" },
  { id: "breathe", label: "Breathing" },
  { id: "pressure", label: "Pressed / tapped instead" },
  { id: "scratched", label: "Scratched" },
  { id: "nothing", label: "Rode it out" },
] as const;

export const itchActionLabel = (id?: string | null) =>
  ITCH_ACTIONS.find((a) => a.id === id)?.label ?? null;

/** Bands for the 0–10 scale — used for the colour and the copy. */
export function itchBand(level: number): { label: string; tone: string } {
  if (level >= 8) return { label: "Unbearable", tone: "rose" };
  if (level >= 6) return { label: "Intense", tone: "orange" };
  if (level >= 4) return { label: "Nagging", tone: "amber" };
  if (level >= 1) return { label: "Mild", tone: "emerald" };
  return { label: "None", tone: "emerald" };
}

export interface ItchPoint {
  date: string;
  at: string;
  level: number;
}

export interface ItchSummary {
  /** Check-ins logged today. */
  todayCount: number;
  /** Mean of today's check-ins, rounded to 1dp (null when none). */
  todayAvg: number | null;
  /** Worst level logged today (null when none). */
  todayPeak: number | null;
  /** Mean over the last 7 days (null when none). */
  weekAvg: number | null;
  /** Hour of day (0–23) the itch has peaked most often, or null if there
   * isn't enough history to say anything honest. */
  worstHour: number | null;
  /** Per-day means for the last 7 days, oldest first — drives the sparkline. */
  week: { date: string; avg: number | null }[];
}

/** Summarise itch check-ins. Pure, so the dashboard, the itch screen and the
 * coach all read the same numbers. */
export function summariseItch(points: ItchPoint[], today = dateKey()): ItchSummary {
  const todays = points.filter((p) => p.date === today);
  const mean = (xs: number[]) =>
    xs.length ? Math.round((xs.reduce((s, x) => s + x, 0) / xs.length) * 10) / 10 : null;

  // Last 7 days, oldest first.
  const week: { date: string; avg: number | null }[] = [];
  const todayMs = Date.UTC(
    Number(today.slice(0, 4)),
    Number(today.slice(5, 7)) - 1,
    Number(today.slice(8, 10))
  );
  for (let i = 6; i >= 0; i--) {
    const key = dateKey(new Date(todayMs - i * DAY_MS));
    week.push({ date: key, avg: mean(points.filter((p) => p.date === key).map((p) => p.level)) });
  }

  const weekLevels = points
    .filter((p) => week.some((d) => d.date === p.date))
    .map((p) => p.level);

  // Worst hour: only claim a pattern once there's a fortnight-ish of signal.
  let worstHour: number | null = null;
  if (points.length >= 14) {
    const byHour = new Map<number, number[]>();
    for (const p of points) {
      const hour = new Date(p.at).getHours();
      byHour.set(hour, [...(byHour.get(hour) ?? []), p.level]);
    }
    let best = -1;
    for (const [hour, levels] of byHour) {
      if (levels.length < 3) continue; // one bad night isn't a pattern
      const avg = levels.reduce((s, x) => s + x, 0) / levels.length;
      if (avg > best) {
        best = avg;
        worstHour = hour;
      }
    }
  }

  return {
    todayCount: todays.length,
    todayAvg: mean(todays.map((p) => p.level)),
    todayPeak: todays.length ? Math.max(...todays.map((p) => p.level)) : null,
    weekAvg: mean(weekLevels),
    worstHour,
    week,
  };
}

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
  "itch_logged",
  "forecast_checked",
  "forecast_saved",
  "triggers_day_saved",
] as const;
export type FunnelEvent = (typeof FUNNEL_EVENTS)[number];
