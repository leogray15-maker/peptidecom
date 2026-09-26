"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { color } from "@/lib/tokens";

export interface SignupPoint {
  label: string; // e.g. "12 May"
  signups: number;
}

/** Weekly signups for the last N weeks. Single series → no legend; the card
 * title names it. Colours come from lib/tokens.ts. */
export function SignupsChart({ data }: { data: SignupPoint[] }) {
  return (
    <div className="h-56 w-full sm:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barCategoryGap="35%">
          <CartesianGrid vertical={false} stroke={color.border} />
          <XAxis
            dataKey="label"
            tick={{ fill: color.textMuted, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: color.border }}
            interval="preserveStartEnd"
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: color.textMuted, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip
            cursor={{ fill: `${color.accent}14` }}
            contentStyle={{
              background: color.surface,
              border: `1px solid ${color.border}`,
              borderRadius: 12,
              fontSize: 12,
              color: color.text,
            }}
            labelStyle={{ color: color.textSecondary, marginBottom: 4 }}
            itemStyle={{ color: color.text }}
            formatter={(value: number | string) => [value, "Signups"]}
          />
          <Bar dataKey="signups" fill={color.accent} radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
