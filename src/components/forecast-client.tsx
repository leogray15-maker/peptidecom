"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CloudSun,
  Download,
  Lightbulb,
  Loader2,
  MapPin,
  RefreshCw,
  Thermometer,
} from "lucide-react";
import { FeatureGate } from "@/components/feature-gate";
import type { FlareRisk, ForecastLocation, WeatherSnapshot } from "@/lib/forecast";
import { dateKey } from "@/lib/tsw";
import { cn, formatDate } from "@/lib/utils";

export interface SavedForecastItem {
  date: string;
  score: number;
  band: string;
  tone: string;
  factors: string[];
  place: string | null;
}

interface ForecastResponse {
  date: string;
  weather: WeatherSnapshot;
  place: string | null;
  risk: FlareRisk;
}

const TONE_TEXT: Record<string, string> = {
  emerald: "text-emerald-400",
  amber: "text-amber-400",
  orange: "text-orange-400",
  rose: "text-rose-400",
};

const TONE_RING: Record<string, string> = {
  emerald: "border-emerald-500/30",
  amber: "border-amber-500/30",
  orange: "border-orange-500/30",
  rose: "border-rose-500/40",
};

function timeOfDay(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function ForecastClient({
  savedLocation,
  history,
}: {
  savedLocation: ForecastLocation | null;
  history: SavedForecastItem[];
}) {
  const [data, setData] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsLocation, setNeedsLocation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedToday, setSavedToday] = useState(() =>
    history.some((h) => h.date === dateKey())
  );

  /** Fetch the forecast. With no coordinates the server falls back to the
   * location saved on the profile — which is what makes a new device open
   * straight onto the member's own forecast. */
  const load = useCallback(async (coords?: { lat: number; lon: number }) => {
    setLoading(true);
    setError(null);
    try {
      const qs = coords ? `?lat=${coords.lat}&lon=${coords.lon}` : "";
      const res = await fetch(`/api/forecast${qs}`);
      if (res.status === 400) {
        // No coordinates anywhere — ask for permission.
        setNeedsLocation(true);
        return;
      }
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Couldn't load the forecast.");
        return;
      }
      setData(body as ForecastResponse);
      setNeedsLocation(false);
    } catch {
      setError("Couldn't reach the server — check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  /** Ask the browser where we are, then refresh. */
  const locate = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("This browser can't share a location. You can still log triggers by hand.");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void load({
          lat: Math.round(pos.coords.latitude * 100) / 100,
          lon: Math.round(pos.coords.longitude * 100) / 100,
        });
      },
      () => {
        setLoading(false);
        setNeedsLocation(true);
        setError("Location permission was declined, so there's nothing to forecast from yet.");
      },
      { timeout: 10_000, maximumAge: 600_000 }
    );
  }, [load]);

  useEffect(() => {
    if (savedLocation) void load();
    else setNeedsLocation(true);
  }, [savedLocation, load]);

  async function saveToday() {
    if (!data) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: data.date,
          place: data.place,
          weather: data.weather,
          score: data.risk.score,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Couldn't save today's forecast.");
        return;
      }
      setSavedToday(true);
    } catch {
      setError("Couldn't reach the server — check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  // ── Nothing to forecast from yet ─────────────────────────────────────────
  if (needsLocation && !data) {
    return (
      <div className="space-y-4">
        <FeatureGate
          icon={MapPin}
          title="Turn on the flare forecast"
          description="Share your location once and this screen reads the local temperature, humidity, wind and pollen every day, and tells you what today's conditions tend to do to skin like yours."
          action={
            <button onClick={locate} disabled={loading} className="btn-accent w-full">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <MapPin className="h-5 w-5" />}
              Use my location
            </button>
          }
        />
        <p className="mx-auto max-w-sm text-center text-xs leading-relaxed text-slate-500">
          Only the coordinates are sent, to Open-Meteo, and never with anything that identifies
          you. They&apos;re saved to your profile so you don&apos;t have to grant this again on
          your next device.
        </p>
        {error && <p className="text-center text-sm text-rose-400">{error}</p>}
      </div>
    );
  }

  const risk = data?.risk;

  return (
    <div className="space-y-4">
      {/* Today's risk — the number the whole screen exists for. */}
      <div
        className={cn(
          "card !rounded-3xl border text-center",
          risk ? TONE_RING[risk.tone] : "border-lab-border"
        )}
      >
        <p className="text-sm font-semibold text-brand-300">Today&apos;s flare risk</p>
        {loading && !risk ? (
          <div className="py-6">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-600" />
          </div>
        ) : risk ? (
          <>
            <p className="mt-2 text-7xl font-extrabold leading-none tabular-nums text-white">
              {risk.score}
            </p>
            <p className={cn("mt-3 text-xl font-bold tracking-wide", TONE_TEXT[risk.tone])}>
              {risk.band}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Updated {timeOfDay(data!.weather.observedAt)}
              {data!.place ? ` · ${data!.place}` : ""}
            </p>
          </>
        ) : (
          <p className="py-6 text-sm text-slate-500">No reading yet.</p>
        )}
      </div>

      {/* Today's tips */}
      {risk && (
        <div className="card !rounded-3xl">
          <p className="flex items-center gap-2 font-semibold text-white">
            <Lightbulb className="h-4.5 w-4.5 text-brand-300" /> Today&apos;s tips
          </p>
          <ul className="mt-3 space-y-2.5">
            {risk.tips.map((tip) => (
              <li key={tip} className="flex gap-2.5 text-sm leading-relaxed text-slate-300">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* What's driving it */}
      {risk && risk.factors.length > 0 && (
        <div className="card !rounded-3xl">
          <p className="font-semibold text-white">What&apos;s driving it</p>
          <div className="mt-3 space-y-2">
            {risk.factors.map((f) => (
              <div key={f.label} className="flex items-center gap-3">
                <span className="w-32 shrink-0 truncate text-sm text-slate-400">{f.label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-lab-bg">
                  <div
                    className="h-full rounded-full bg-brand-400"
                    style={{ width: `${Math.min(100, (f.points / 25) * 100)}%` }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right text-sm font-semibold tabular-nums text-slate-300">
                  +{f.points}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Local conditions */}
      {data && (
        <div className="card !rounded-3xl">
          <p className="flex items-center gap-2 font-semibold text-white">
            <Thermometer className="h-4.5 w-4.5 text-brand-300" /> Local conditions
          </p>
          <dl className="mt-3 divide-y divide-lab-border text-sm">
            {[
              { label: "Temperature", value: `${data.weather.temperature} °C` },
              { label: "Humidity", value: `${data.weather.humidity} %` },
              { label: "Wind", value: `${data.weather.wind} km/h` },
              {
                label: "UV index",
                value: data.weather.uv == null ? "—" : String(data.weather.uv),
              },
              {
                label: "Pollen peak",
                value:
                  data.weather.pollen == null
                    ? "No coverage here"
                    : `${data.weather.pollen} grains/m³`,
              },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between py-2.5">
                <dt className="text-slate-400">{row.label}</dt>
                <dd className="font-semibold tabular-nums text-white">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {error && <p className="text-center text-sm text-rose-400">{error}</p>}

      {/* Actions */}
      <div className="space-y-2">
        <button onClick={() => locate()} disabled={loading} className="btn-accent w-full">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <RefreshCw className="h-5 w-5" />
          )}
          Refresh forecast
        </button>
        <button
          onClick={saveToday}
          disabled={!data || saving || savedToday}
          className="btn-accent-ghost w-full"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {savedToday ? "Today's forecast saved ✓" : "Save today's forecast"}
        </button>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="card !rounded-3xl">
          <p className="font-semibold text-white">Recent days</p>
          <p className="mt-1 text-sm text-slate-500">
            Saved forecasts, so a rough week can be read back against the weather that came with it.
          </p>
          <div className="mt-4 divide-y divide-lab-border">
            {history.map((h) => (
              <div key={h.date} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-white">{formatDate(h.date)}</p>
                  <p className="truncate text-xs text-slate-500">
                    {h.factors.length ? h.factors.join(" · ") : "Nothing notable in the air"}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 text-sm font-bold tabular-nums",
                    TONE_TEXT[h.tone] ?? "text-slate-300"
                  )}
                >
                  {h.score}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-500">
        <CloudSun className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          A heads-up, not a prediction. Weather is one input among many, and plenty of flares have
          nothing to do with it — your own logs stay the real record.
        </span>
      </p>
    </div>
  );
}
