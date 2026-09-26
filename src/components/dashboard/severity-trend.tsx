"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { LineChart as LineIcon } from "lucide-react";
import { ButtonLink, EmptyState, SegmentedControl } from "@/components/ui";
import { color } from "@/lib/tokens";
import { severityWord } from "@/lib/tokens";

type Range = "30" | "90" | "365";
const RANGES = [
  { value: "30" as const, label: "30D" },
  { value: "90" as const, label: "90D" },
  { value: "365" as const, label: "1Y" },
];

function shift(today: string, days: number) {
  const [y, m, d] = today.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d - days));
  return dt.toISOString().slice(0, 10);
}

const fmt = (key: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-GB", { ...opts, timeZone: "UTC" }).format(new Date(key + "T00:00:00Z"));

/** Daily severity over 30 days / 90 days / a year. Single series, so no legend. */
export function SeverityTrend({ points, today }: { points: { date: string; severity: number }[]; today: string }) {
  const [range, setRange] = useState<Range>("30");

  const data = useMemo(() => {
    const from = shift(today, Number(range) - 1);
    return points.filter((p) => p.date >= from && p.date <= today).sort((a, b) => a.date.localeCompare(b.date));
  }, [points, range, today]);

  return (
    <section className="card flex min-w-0 flex-col lg:col-span-2" aria-labelledby="trend-title">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="trend-title" className="card-title">
            Severity trend
          </h2>
          <p className="mt-0.5 text-meta text-fg-muted">
            Daily severity, 1–10 · {data.length} day{data.length === 1 ? "" : "s"} logged
          </p>
        </div>
        <SegmentedControl label="Time range" options={RANGES} value={range} onChange={setRange} size="sm" />
      </div>

      {data.length < 2 ? (
        <EmptyState
          icon={LineIcon}
          title={data.length === 0 ? "No logs in this range" : "One more day to draw a line"}
          body="Log your skin daily and your trend appears here."
          action={<ButtonLink href="/tracker" size="sm">Log today</ButtonLink>}
          className="flex-1"
        />
      ) : (
        <div className="h-56 w-full" role="img" aria-label={`Severity over the last ${range} days`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: -24 }}>
              <CartesianGrid vertical={false} stroke={color.borderSubtle} />
              <XAxis
                dataKey="date"
                tickFormatter={(d: string) => fmt(d, range === "365" ? { month: "short" } : { day: "numeric", month: "short" })}
                tick={{ fill: color.textMuted, fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: color.border }}
                minTickGap={28}
              />
              <YAxis
                domain={[0, 10]}
                ticks={[0, 5, 10]}
                tick={{ fill: color.textMuted, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={{ stroke: color.borderStrong }}
                contentStyle={{
                  background: color.surface,
                  border: `1px solid ${color.borderStrong}`,
                  borderRadius: 10,
                  fontSize: 12.5,
                  color: color.text,
                }}
                labelStyle={{ color: color.textSecondary, marginBottom: 2 }}
                labelFormatter={(d: string) => fmt(d, { weekday: "short", day: "numeric", month: "short" })}
                formatter={(v: number) => [`${v}/10 · ${severityWord(v)}`, "Severity"]}
              />
              <Area
                type="monotone"
                dataKey="severity"
                stroke={color.accent}
                strokeWidth={2}
                fill={color.accent}
                fillOpacity={0.08}
                dot={data.length <= 31 ? { r: 2.5, fill: color.accent, strokeWidth: 0 } : false}
                activeDot={{ r: 4, fill: color.accent, stroke: color.surface, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
