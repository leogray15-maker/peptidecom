"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { type DailyLog, SYMPTOMS, dateKey, daysBetween, zoneLabel } from "@/lib/tsw";

// Chart palette validated for the dark card surface (#0f0f15):
// OKLCH lightness band, chroma, CVD separation and contrast all pass.
const SEVERITY_COLOR = "#7c5cff";
const SLEEP_COLOR = "#0d9488";
const MOOD_COLOR = "#d97706";
const GRID = "#20202b";
const AXIS = "#6b6b7b";

const tooltipStyle = {
  background: "#0f0f15",
  border: "1px solid #20202b",
  borderRadius: 12,
  color: "#e2e8f0",
} as const;

function pearson(pairs: [number, number][]): number | null {
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

export function InsightsClient({ logs }: { logs: DailyLog[] }) {
  const today = dateKey();

  const last30 = useMemo(
    () =>
      logs
        .filter((l) => daysBetween(l.date, today) < 30)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [logs, today]
  );

  const chartData = last30.map((l) => ({
    date: new Date(l.date + "T12:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    severity: l.severity,
    sleep: l.sleep ?? undefined,
    mood: l.mood ?? undefined,
    itch: l.symptoms.includes("itch") ? l.severity : undefined,
  }));

  // Sleep ↔ severity relationship, reflected gently — never diagnosed.
  const sleepSeverity = useMemo(() => {
    const pairs = last30
      .filter((l) => l.sleep != null)
      .map((l) => [l.sleep as number, l.severity] as [number, number]);
    return pearson(pairs);
  }, [last30]);

  const areaCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of last30) for (const a of l.areas) counts.set(a, (counts.get(a) ?? 0) + 1);
    return [...counts.entries()].sort((x, y) => y[1] - x[1]).slice(0, 6);
  }, [last30]);

  const symptomCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of last30) for (const s of l.symptoms) counts.set(s, (counts.get(s) ?? 0) + 1);
    return [...counts.entries()].sort((x, y) => y[1] - x[1]);
  }, [last30]);

  const calmDays = last30.filter((l) => l.severity <= 3).length;
  const avgSeverity =
    last30.length > 0
      ? Math.round((last30.reduce((s, l) => s + l.severity, 0) / last30.length) * 10) / 10
      : null;

  if (logs.length < 3) {
    return (
      <div className="card py-14 text-center">
        <p className="font-semibold text-white">Your insights are still brewing.</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
          Log a few days in the tracker and this page turns into your personal weather report —
          severity trends, sleep patterns, and which areas need the most care.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stat tiles */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-sm text-slate-400">Average severity (30d)</p>
          <p className="mt-1 text-3xl font-bold text-white">{avgSeverity ?? "—"}<span className="text-base font-normal text-slate-500">/10</span></p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-400">Calm days (30d)</p>
          <p className="mt-1 text-3xl font-bold text-white">{calmDays}<span className="text-base font-normal text-slate-500">/{last30.length} logged</span></p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-400">Most affected area (30d)</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {areaCounts.length > 0 ? zoneLabel(areaCounts[0][0]) : "—"}
          </p>
        </div>
      </div>

      {/* Severity trend */}
      <div className="card">
        <p className="font-semibold text-white">Severity — last 30 days</p>
        <p className="mt-0.5 text-sm text-slate-500">Zoom out: waves are normal. Watch the trend, not the worst day.</p>
        {chartData.length > 1 ? (
          <div className="mt-4 h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis dataKey="date" stroke={AXIS} fontSize={11} tickLine={false} />
                <YAxis domain={[0, 10]} stroke={AXIS} fontSize={11} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="severity" name="Severity" stroke={SEVERITY_COLOR} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-slate-500">Log a couple more days to draw the line.</p>
        )}
      </div>

      {/* Sleep & mood (small multiple sharing the same x-axis — 1–5 scales, so
          they can share one chart; severity stays separate above) */}
      <div className="card">
        <p className="font-semibold text-white">Sleep &amp; mood — last 30 days</p>
        <p className="mt-0.5 text-sm text-slate-500">Read them against the severity chart above — same days, same order.</p>
        {chartData.some((d) => d.sleep != null || d.mood != null) ? (
          <div className="mt-4 h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
                <XAxis dataKey="date" stroke={AXIS} fontSize={11} tickLine={false} />
                <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} stroke={AXIS} fontSize={11} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11 }} iconType="plainline" />
                <Line type="monotone" dataKey="sleep" name="Sleep (1–5)" stroke={SLEEP_COLOR} strokeWidth={2} dot={false} activeDot={{ r: 4 }} connectNulls />
                <Line type="monotone" dataKey="mood" name="Mood (1–5)" stroke={MOOD_COLOR} strokeWidth={2} dot={false} activeDot={{ r: 4 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-slate-500">
            Add sleep and mood to your daily logs to unlock this picture.
          </p>
        )}
        {sleepSeverity != null && Math.abs(sleepSeverity) >= 0.3 && (
          <p className="mt-4 rounded-xl bg-lab-bg px-4 py-3 text-sm text-slate-300">
            {sleepSeverity < 0
              ? "In your own data this month, better-sleep days tended to be calmer-skin days. Worth protecting your evenings."
              : "In your own data this month, rougher skin and better sleep didn't line up the usual way — bodies are complicated. Keep logging and see if it settles."}
            <span className="ml-1 text-xs text-slate-500">(Your data, reflected back — not a diagnosis.)</span>
          </p>
        )}
      </div>

      {/* Areas & symptoms */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <p className="font-semibold text-white">Where it shows up most</p>
          {areaCounts.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No areas logged this month.</p>
          ) : (
            <div className="mt-4 space-y-2.5">
              {areaCounts.map(([area, count]) => (
                <div key={area} className="flex items-center gap-3 text-sm">
                  <span className="w-28 shrink-0 text-slate-300">{zoneLabel(area)}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-lab-bg">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${(count / last30.length) * 100}%` }}
                    />
                  </div>
                  <span className="w-14 shrink-0 text-right text-xs text-slate-500">{count} days</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card">
          <p className="font-semibold text-white">Most common symptoms</p>
          {symptomCounts.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No symptoms logged this month.</p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {symptomCounts.map(([id, count]) => (
                <span key={id} className="badge border border-lab-border bg-lab-bg px-3 py-1.5 text-slate-300">
                  {SYMPTOMS.find((s) => s.id === id)?.label ?? id}
                  <span className="text-slate-500">× {count}</span>
                </span>
              ))}
            </div>
          )}
          <p className="mt-4 text-xs text-slate-500">
            These reflect what you logged — they&apos;re a mirror, not a verdict. Anything that
            surprises you is worth raising with a clinician.
          </p>
        </div>
      </div>
    </div>
  );
}
