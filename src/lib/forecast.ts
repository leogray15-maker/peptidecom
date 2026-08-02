// Flare forecast: turns today's local weather into a skin-barrier risk score.
//
// Pure and dependency-free so both the API route and the client can use it, and
// so scripts/forecast.test.ts can exercise it without a network call.
//
// The model is deliberately simple and explainable: every input contributes a
// signed number of points with a plain-English reason attached, the points are
// summed and clamped to 0–100, and the UI shows the reasons rather than a black
// box. Weightings differ per condition — cold dry air is the classic eczema/TSW
// enemy, heat and sun drive rosacea, sweat and humidity drive acne.
//
// Tone rule (same as lib/tsw.ts): this is a heads-up, never a prediction and
// never medical advice. Copy says "conditions that tend to…", not "you will…".

export interface ForecastLocation {
  lat: number;
  lon: number;
  /** Human label ("Manchester"), when the geocoder gave us one. */
  label?: string | null;
  savedAt?: string | null;
}

export interface WeatherSnapshot {
  /** °C */
  temperature: number;
  /** % relative humidity */
  humidity: number;
  /** km/h */
  wind: number;
  /** UV index (0–11+). */
  uv: number | null;
  /** Peak pollen across birch/grass/ragweed, grains/m³. Null when the
   * air-quality API has no coverage for this location. */
  pollen: number | null;
  /** ISO timestamp the readings were taken. */
  observedAt: string;
}

export type RiskTone = "emerald" | "amber" | "orange" | "rose";

export interface RiskFactor {
  /** Short label for the chip ("Dry air"). */
  label: string;
  /** Points this factor added (always > 0 — calming factors are separate). */
  points: number;
  /** The tip this factor earns, shown in "Today's tips". */
  tip: string;
}

export interface FlareRisk {
  /** 0–100. */
  score: number;
  band: string;
  tone: RiskTone;
  factors: RiskFactor[];
  tips: string[];
}

export interface RiskBand {
  label: string;
  tone: RiskTone;
  min: number;
}

export const RISK_BANDS: RiskBand[] = [
  { label: "VERY HIGH", tone: "rose", min: 75 },
  { label: "HIGH", tone: "orange", min: 50 },
  { label: "MODERATE", tone: "amber", min: 25 },
  { label: "LOW", tone: "emerald", min: 0 },
];

export function riskBand(score: number): RiskBand {
  return RISK_BANDS.find((b) => score >= b.min) ?? RISK_BANDS[RISK_BANDS.length - 1];
}

/** How much each condition cares about each driver. 1 = the baseline weight. */
interface ConditionWeights {
  dryAir: number;
  cold: number;
  heat: number;
  humidity: number;
  wind: number;
  pollen: number;
  uv: number;
}

const BASE_WEIGHTS: ConditionWeights = {
  dryAir: 1,
  cold: 1,
  heat: 1,
  humidity: 1,
  wind: 1,
  pollen: 1,
  uv: 0.5,
};

const CONDITION_WEIGHTS: Record<string, Partial<ConditionWeights>> = {
  // Barrier-driven: dry, cold, windy air is the classic trigger stack.
  tsw: { dryAir: 1.2, cold: 1.2, wind: 1.1, pollen: 0.9 },
  eczema: { dryAir: 1.2, cold: 1.1, pollen: 1.2 },
  // Cold and dry still bite, but pollen much less so.
  psoriasis: { dryAir: 1.1, cold: 1.2, uv: 0.2, pollen: 0.4 },
  // Sweat, heat and humidity are the drivers; cold dry air barely registers.
  acne: { dryAir: 0.4, cold: 0.3, heat: 1.3, humidity: 1.4, pollen: 0.3, uv: 0.8 },
  // Heat, sun and wind flush the face; humidity matters little.
  rosacea: { dryAir: 0.8, cold: 0.9, heat: 1.5, wind: 1.3, humidity: 0.5, pollen: 0.5, uv: 1.4 },
};

/** A missing or unknown condition resolves to TSW — the same rule the rest of
 * the app follows (see lib/conditions.ts). */
function weightsFor(condition?: string | null): ConditionWeights {
  const overrides = CONDITION_WEIGHTS[condition ?? ""] ?? CONDITION_WEIGHTS.tsw;
  return { ...BASE_WEIGHTS, ...overrides };
}

/** Extra context from the member's own tracker — a skin that's already angry
 * reacts harder to the same weather. */
export interface PersonalContext {
  /** Mean severity (1–10) over the last few logged days, if any. */
  recentSeverity?: number | null;
  /** True when the member logged a bad flare in the last 3 days. */
  recentBadFlare?: boolean;
}

const round = (n: number) => Math.round(n);

/**
 * Score today's flare risk. Returns 0–100 plus the reasons behind it.
 *
 * Calm conditions genuinely score 0 — the screen should be allowed to say
 * "nothing to worry about today" rather than manufacturing anxiety.
 */
export function scoreFlareRisk(
  weather: WeatherSnapshot,
  opts: { condition?: string | null; personal?: PersonalContext } = {}
): FlareRisk {
  const w = weightsFor(opts.condition);
  const factors: RiskFactor[] = [];

  const add = (label: string, points: number, tip: string) => {
    if (points >= 1) factors.push({ label, points: round(points), tip });
  };

  // ── Dry air: the single biggest driver of trans-epidermal water loss ──────
  if (weather.humidity < 30) {
    add(
      "Very dry air",
      22 * w.dryAir,
      "Humidity is very low — moisturise more often than usual and consider a humidifier where you sleep."
    );
  } else if (weather.humidity < 40) {
    add(
      "Dry air",
      12 * w.dryAir,
      "Air is on the dry side. An extra layer of emollient after washing goes a long way today."
    );
  }

  // ── Muggy air: sweat sits on the skin and stings broken barrier ───────────
  if (weather.humidity > 75 && weather.temperature > 20) {
    add(
      "Humid and warm",
      12 * w.humidity,
      "Muggy conditions mean more sweat. Rinse off cool after any exertion and pat — never rub — dry."
    );
  }

  // ── Cold ─────────────────────────────────────────────────────────────────
  if (weather.temperature < 2) {
    add(
      "Hard frost",
      20 * w.cold,
      "Freezing air pulls moisture straight out of skin. Cover exposed areas and re-apply your barrier cream before you head out."
    );
  } else if (weather.temperature < 8) {
    add(
      "Cold day",
      12 * w.cold,
      "Cold air outside and dry heating inside is a rough combination for the barrier — layer up and moisturise before both."
    );
  }

  // ── Heat ─────────────────────────────────────────────────────────────────
  if (weather.temperature > 28) {
    add(
      "Hot day",
      18 * w.heat,
      "Heat drives sweat and itch. Keep cool, wear loose cotton, and keep your moisturiser in the fridge if that helps."
    );
  } else if (weather.temperature > 24) {
    add(
      "Warm day",
      9 * w.heat,
      "Warm enough to sweat. Loose clothing and a cool rinse after any exercise will keep the itch down."
    );
  }

  // ── Wind ─────────────────────────────────────────────────────────────────
  if (weather.wind > 30) {
    add(
      "Strong wind",
      12 * w.wind,
      "Strong wind strips moisture and chaps exposed skin. An occlusive layer on face and hands helps before you go out."
    );
  } else if (weather.wind > 18) {
    add(
      "Breezy",
      6 * w.wind,
      "Breezy enough to dry skin out — worth topping up your moisturiser if you're outside for long."
    );
  }

  // ── Pollen ───────────────────────────────────────────────────────────────
  if (weather.pollen != null) {
    if (weather.pollen > 50) {
      add(
        "High pollen",
        16 * w.pollen,
        "Pollen is high. Rinse your face and change clothes when you get home, and dry laundry indoors today."
      );
    } else if (weather.pollen > 20) {
      add(
        "Some pollen",
        8 * w.pollen,
        "Moderate pollen about — a quick rinse when you get in keeps it off your skin."
      );
    }
  }

  // ── UV ───────────────────────────────────────────────────────────────────
  if (weather.uv != null && weather.uv >= 6) {
    add(
      "Strong sun",
      12 * w.uv,
      "UV is strong. A mineral SPF on exposed skin and shade in the middle of the day are the gentle options."
    );
  }

  // ── The member's own recent skin ──────────────────────────────────────────
  const personal = opts.personal ?? {};
  if (personal.recentBadFlare) {
    add(
      "Already flaring",
      14,
      "You've logged a bad flare in the last few days, so today's conditions land on skin that's already working hard. Be extra gentle."
    );
  } else if ((personal.recentSeverity ?? 0) >= 5) {
    add(
      "Skin unsettled",
      8,
      "Your recent logs are running above your calm range — worth being deliberate with your routine today."
    );
  }

  const score = Math.max(0, Math.min(100, round(factors.reduce((s, f) => s + f.points, 0))));
  const band = riskBand(score);
  const sorted = [...factors].sort((a, b) => b.points - a.points);

  const tips = sorted.slice(0, 4).map((f) => f.tip);
  if (tips.length === 0) {
    tips.push("Conditions look favourable for your skin barrier today.");
    tips.push("A calm day is a good day to keep the routine boring and consistent.");
  }

  return { score, band: band.label, tone: band.tone, factors: sorted, tips };
}

/** Mean severity of logs in the last `days` days, and whether any was a bad
 * flare. Kept here so the forecast route doesn't have to reimplement it. */
export function personalContext(
  logs: { date: string; severity: number }[],
  today: string,
  badFlareSeverity: number,
  days = 3
): PersonalContext {
  const cutoff = new Date(`${today}T00:00:00Z`).getTime() - days * 86_400_000;
  const recent = logs.filter((l) => new Date(`${l.date}T00:00:00Z`).getTime() >= cutoff);
  if (recent.length === 0) return {};
  return {
    recentSeverity:
      Math.round((recent.reduce((s, l) => s + l.severity, 0) / recent.length) * 10) / 10,
    recentBadFlare: recent.some((l) => l.severity >= badFlareSeverity),
  };
}
