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

export interface SignupPoint {
  label: string; // e.g. "12 May"
  signups: number;
}

/** Weekly signups for the last N weeks. Single series → no legend; the card
 * title names it. Violet #7c5cff is validated against the card surface. */
export function SignupsChart({ data }: { data: SignupPoint[] }) {
  return (
    <div className="h-56 w-full sm:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barCategoryGap="35%">
          <CartesianGrid vertical={false} stroke="#20202b" />
          <XAxis
            dataKey="label"
            tick={{ fill: "#64748b", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "#20202b" }}
            interval="preserveStartEnd"
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "#64748b", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip
            cursor={{ fill: "rgba(124, 92, 255, 0.08)" }}
            contentStyle={{
              background: "#0f0f15",
              border: "1px solid #20202b",
              borderRadius: 12,
              fontSize: 12,
              color: "#e2e8f0",
            }}
            labelStyle={{ color: "#94a3b8", marginBottom: 4 }}
            itemStyle={{ color: "#e2e8f0" }}
            formatter={(value: number | string) => [value, "Signups"]}
          />
          <Bar dataKey="signups" fill="#7c5cff" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
