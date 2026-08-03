import { NextResponse } from "next/server";
import { z } from "zod";
import { requireMember } from "@/lib/api-auth";
import { getCondition } from "@/lib/conditions";
import {
  type WeatherSnapshot,
  personalContext,
  riskBand,
  scoreFlareRisk,
} from "@/lib/forecast";
import { safe } from "@/lib/safe-db";
import { BAD_FLARE_SEVERITY, type DailyLog, dateKey } from "@/lib/tsw";
import {
  type TswProfile,
  getProfile,
  listLogs,
  logFunnel,
  saveForecast,
  setLocation,
  tswKey,
} from "@/lib/tsw-db";

// Flare forecast.
//
// Weather comes from Open-Meteo (free, no API key, no account needed) and
// pollen from its air-quality sibling. Only the coordinates leave the app —
// no account identifier is sent with them — and the scoring itself happens
// here, in src/lib/forecast.ts, against the member's own condition and logs.

const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";
const AIR_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";

/** Readings are cached for 15 minutes — the weather doesn't move faster than
 * that, and it keeps a pull-to-refresh habit from hammering the upstream. */
const CACHE_SECONDS = 900;

const coords = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

interface OpenMeteoCurrent {
  current?: Record<string, number | string | null>;
  timezone?: string;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { next: { revalidate: CACHE_SECONDS } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

/** "Europe/London" → "London". The only place name we can offer without asking
 * a geocoder (and another third party) for one. */
function placeFromTimezone(tz?: string): string | null {
  if (!tz) return null;
  const city = tz.split("/").pop();
  return city ? city.replace(/_/g, " ") : null;
}

async function readWeather(
  lat: number,
  lon: number
): Promise<{ weather: WeatherSnapshot; place: string | null } | null> {
  const [weather, air] = await Promise.all([
    fetchJson<OpenMeteoCurrent>(
      `${WEATHER_URL}?latitude=${lat}&longitude=${lon}` +
        "&current=temperature_2m,relative_humidity_2m,wind_speed_10m,uv_index&timezone=auto"
    ),
    // Pollen coverage is European-only upstream; elsewhere the fields come back
    // null and the risk engine simply leaves pollen out of the score.
    fetchJson<OpenMeteoCurrent>(
      `${AIR_URL}?latitude=${lat}&longitude=${lon}` +
        "&current=birch_pollen,grass_pollen,ragweed_pollen,alder_pollen,mugwort_pollen,olive_pollen"
    ),
  ]);

  const current = weather?.current;
  const temperature = num(current?.temperature_2m);
  const humidity = num(current?.relative_humidity_2m);
  if (temperature == null || humidity == null) return null;

  const pollenValues = [
    "birch_pollen",
    "grass_pollen",
    "ragweed_pollen",
    "alder_pollen",
    "mugwort_pollen",
    "olive_pollen",
  ]
    .map((k) => num(air?.current?.[k]))
    .filter((v): v is number => v != null);

  return {
    weather: {
      temperature: Math.round(temperature * 10) / 10,
      humidity: Math.round(humidity),
      wind: Math.round((num(current?.wind_speed_10m) ?? 0) * 10) / 10,
      uv: num(current?.uv_index),
      pollen: pollenValues.length ? Math.round(Math.max(...pollenValues) * 10) / 10 : null,
      observedAt: new Date().toISOString(),
    },
    place: placeFromTimezone(typeof weather?.timezone === "string" ? weather.timezone : undefined),
  };
}

/** GET /api/forecast?lat=&lon= — today's risk for a location. */
export async function GET(req: Request) {
  const gate = await requireMember();
  if (gate.error) return gate.error;
  const user = gate.user;

  const url = new URL(req.url);
  const uid = tswKey(user);
  const profile = await safe(() => getProfile(uid), {} as TswProfile);

  // Fall back to the location saved on the profile, so a second device opens
  // straight onto the member's forecast instead of asking for GPS again.
  const parsed = coords.safeParse({
    lat: url.searchParams.get("lat") ?? profile.location?.lat,
    lon: url.searchParams.get("lon") ?? profile.location?.lon,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Location needed." }, { status: 400 });
  }
  const { lat, lon } = parsed.data;

  const reading = await readWeather(lat, lon);
  if (!reading) {
    return NextResponse.json(
      { error: "Couldn't reach the weather service. Try again in a moment." },
      { status: 503 }
    );
  }

  const logs = await safe(() => listLogs(uid), [] as DailyLog[]);
  const today = dateKey();
  const risk = scoreFlareRisk(reading.weather, {
    condition: profile.condition,
    personal: personalContext(logs, today, BAD_FLARE_SEVERITY),
  });

  // Remember where we ran it, and note the check — both best-effort.
  const fromQuery = url.searchParams.has("lat");
  await Promise.all([
    fromQuery
      ? safe(
          () => setLocation(uid, { lat, lon, label: reading.place, savedAt: new Date().toISOString() }),
          undefined
        )
      : Promise.resolve(undefined),
    logFunnel(uid, "forecast_checked", { score: risk.score, band: risk.band }),
  ]);

  return NextResponse.json({
    date: today,
    weather: reading.weather,
    place: reading.place,
    risk,
    condition: getCondition(profile.condition).label,
  });
}

const saveSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  place: z.string().max(120).nullable().optional(),
  weather: z.object({
    temperature: z.number(),
    humidity: z.number(),
    wind: z.number(),
    uv: z.number().nullable(),
    pollen: z.number().nullable(),
    observedAt: z.string(),
  }),
  score: z.number().min(0).max(100),
});

/** POST — pin today's forecast to the member's history, so a bad week can be
 * read back against the weather that came with it. */
export async function POST(req: Request) {
  const gate = await requireMember();
  if (gate.error) return gate.error;
  const user = gate.user;

  const parsed = saveSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  const uid = tswKey(user);
  const { date, weather, place } = parsed.data;

  try {
    // Re-score server-side rather than trusting the number the client sent.
    const [profile, logs] = await Promise.all([
      safe(() => getProfile(uid), {} as TswProfile),
      safe(() => listLogs(uid), [] as DailyLog[]),
    ]);
    const risk = scoreFlareRisk(weather, {
      condition: profile.condition,
      personal: personalContext(logs, date, BAD_FLARE_SEVERITY),
    });
    await saveForecast(uid, date, risk, weather, place ?? null);
    await logFunnel(uid, "forecast_saved", { score: risk.score, band: riskBand(risk.score).label });
    return NextResponse.json({ ok: true, risk });
  } catch (err) {
    console.error("Failed to save forecast:", err);
    return NextResponse.json(
      { error: "Couldn't save — the database isn't reachable yet." },
      { status: 503 }
    );
  }
}
