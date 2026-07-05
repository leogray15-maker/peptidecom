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

export const TRIGGER_EFFECTS = [
  { value: 1, label: "Seemed to help" },
  { value: 0, label: "No change" },
  { value: -1, label: "Seemed to flare me" },
] as const;

// ─── Funnel events (Firestore: funnelEvents) ─────────────────────────────────

export const FUNNEL_EVENTS = [
  "milestone_reached",
  "milestone_celebrated",
  "archives_view",
  "archives_nav_click",
  "archives_cta_click",
  "celebration_next_chapter_click",
] as const;
export type FunnelEvent = (typeof FUNNEL_EVENTS)[number];
