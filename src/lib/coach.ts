// The coach: turns everything the member has already logged into a short,
// ordered list of what's worth doing today, plus what their own data is saying.
//
// Pure and dependency-free (no server-only imports) so it can be unit-tested
// and shared. It invents nothing: every action and every observation traces
// back to a log the member made, and when there isn't enough data to say
// something honest it says nothing at all.
//
// Tone rule: suggestions, never instructions. Nothing here is medical advice.

import { type DailyLog, type ItchSummary, daysBetween } from "@/lib/tsw";

export interface CoachAction {
  id: string;
  title: string;
  detail: string;
  href: string;
  cta: string;
  /** Higher sorts first. */
  priority: number;
}

export interface CoachObservation {
  headline: string;
  detail: string;
}

export interface CoachInput {
  today: string;
  logs: DailyLog[];
  triggers: { date: string; name: string; effect: number }[];
  itch: ItchSummary;
  /** ISO date of the most recent photo, if any. */
  lastPhotoDate: string | null;
  /** ISO timestamp of the most recent saved POEM score, if any. */
  lastPoemAt: string | null;
  /** Today's saved flare-forecast score, when the member has saved one. */
  todayForecast: { score: number; band: string } | null;
  /** Whether the member has ever run the forecast (i.e. has a location). */
  hasForecastLocation: boolean;
}

const dateOf = (iso: string) => iso.slice(0, 10);
const round1 = (n: number) => Math.round(n * 10) / 10;

/** What's worth doing today, most important first. */
export function coachActions(input: CoachInput): CoachAction[] {
  const { today, logs, triggers, itch } = input;
  const actions: CoachAction[] = [];

  const loggedToday = logs.some((l) => l.date === today);
  if (!loggedToday) {
    actions.push({
      id: "log-today",
      title: "Log today",
      detail:
        "Twenty seconds. Severity, where it is and how you slept — it's the entry everything else on this screen is built from.",
      href: "/tracker",
      cta: "Open the tracker",
      priority: 100,
    });
  }

  if (itch.todayPeak != null && itch.todayPeak >= 7) {
    actions.push({
      id: "support",
      title: "Today has been a rough one",
      detail: `You logged an itch of ${itch.todayPeak}/10 today. The flare-day screen has the cold, breathing and distraction tools in one place.`,
      href: "/support",
      cta: "Flare-day support",
      priority: 95,
    });
  }

  const forecast = input.todayForecast;
  if (forecast && forecast.score >= 50) {
    actions.push({
      id: "forecast-high",
      title: `Conditions are ${forecast.band.toLowerCase()} today`,
      detail:
        "Today's weather scores high for skin like yours. Worth reading the tips before you head out.",
      href: "/forecast",
      cta: "See today's tips",
      priority: 90,
    });
  } else if (!input.hasForecastLocation) {
    actions.push({
      id: "forecast-setup",
      title: "Switch on the flare forecast",
      detail:
        "Local humidity, cold, wind and pollen, scored against your condition — a heads-up before the day gets going.",
      href: "/forecast",
      cta: "Set it up",
      priority: 45,
    });
  }

  const daysSincePoem = input.lastPoemAt ? daysBetween(dateOf(input.lastPoemAt), today) : null;
  if (daysSincePoem == null || daysSincePoem >= 7) {
    actions.push({
      id: "poem",
      title: daysSincePoem == null ? "Take your first POEM score" : "This week's POEM is due",
      detail:
        "Seven questions about the last week. It's the measure clinicians recognise, so it's the one worth bringing to an appointment.",
      href: "/poem",
      cta: "Score this week",
      priority: 70,
    });
  }

  const daysSincePhoto = input.lastPhotoDate ? daysBetween(input.lastPhotoDate, today) : null;
  if (daysSincePhoto == null || daysSincePhoto >= 7) {
    actions.push({
      id: "photo",
      title: daysSincePhoto == null ? "Take your first progress photo" : "Time for a progress photo",
      detail:
        "Recovery is far too slow to see in a mirror. A weekly photo in the same light is how you'll actually notice it.",
      href: "/photos",
      cta: "Add a photo",
      priority: 60,
    });
  }

  const lastTrigger = triggers
    .map((t) => t.date)
    .sort()
    .pop();
  const daysSinceTrigger = lastTrigger ? daysBetween(lastTrigger, today) : null;
  if ((daysSinceTrigger == null || daysSinceTrigger >= 3) && logs.length >= 3) {
    actions.push({
      id: "triggers",
      title: "Catch up your triggers",
      detail:
        "Products, food, weather, stress — the patterns only surface once there's a few weeks of them next to your severity.",
      href: "/triggers",
      cta: "Log today's",
      priority: 50,
    });
  }

  return actions.sort((a, b) => b.priority - a.priority);
}

/** What the member's own numbers are saying. Only claims a pattern when
 * there's enough data behind it to be worth reading. */
export function coachObservations(input: CoachInput): CoachObservation[] {
  const { today, logs, triggers, itch } = input;
  const out: CoachObservation[] = [];

  // Severity: this week against the week before.
  const inWindow = (l: DailyLog, from: number, to: number) => {
    const d = daysBetween(l.date, today);
    return d >= from && d < to;
  };
  const thisWeek = logs.filter((l) => inWindow(l, 0, 7));
  const lastWeek = logs.filter((l) => inWindow(l, 7, 14));
  if (thisWeek.length >= 3 && lastWeek.length >= 3) {
    const mean = (xs: DailyLog[]) => xs.reduce((s, l) => s + l.severity, 0) / xs.length;
    const delta = round1(mean(thisWeek) - mean(lastWeek));
    if (Math.abs(delta) >= 0.5) {
      out.push(
        delta < 0
          ? {
              headline: "Your week is calmer than the last one",
              detail: `Severity is averaging ${Math.abs(delta)} lower than the previous seven days. Whatever you're doing, it's worth keeping boring and consistent.`,
            }
          : {
              headline: "This week is running hotter",
              detail: `Severity is averaging ${delta} higher than the previous seven days. Flares come in waves — this is a wave, not a verdict.`,
            }
      );
    } else {
      out.push({
        headline: "Holding steady",
        detail:
          "Your last two weeks are averaging about the same. Steady is genuinely good news in the middle of this.",
      });
    }
  }

  if (itch.worstHour != null) {
    out.push({
      headline: "Your itch has a time of day",
      detail: `Across your check-ins it peaks most often around ${itch.worstHour}:00. Getting the cooling and moisturising in before that window is the cheapest win available.`,
    });
  }

  // Most-flagged flare trigger in the last 60 days, once it's been logged
  // enough times to be more than a coincidence.
  const recent = triggers.filter((t) => daysBetween(t.date, today) < 60 && t.effect === -1);
  const counts = new Map<string, { name: string; n: number }>();
  for (const t of recent) {
    const key = t.name.trim().toLowerCase();
    const cur = counts.get(key) ?? { name: t.name, n: 0 };
    cur.n++;
    counts.set(key, cur);
  }
  const top = [...counts.values()].sort((a, b) => b.n - a.n)[0];
  if (top && top.n >= 3) {
    out.push({
      headline: `“${top.name}” keeps coming up`,
      detail: `You've marked it as flaring you ${top.n} times in the last two months. Worth a deliberate two weeks without it to see what changes.`,
    });
  }

  return out;
}
