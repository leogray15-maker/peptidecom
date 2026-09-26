import type { ScoreTone } from "@/lib/product-score";
import { color, score } from "@/lib/tokens";

export const RING_TONE_HEX: Record<ScoreTone, string> = {
  emerald: score.excellent,
  green: score.good,
  orange: score.poor,
  rose: score.bad,
};

export const TONE_TEXT: Record<ScoreTone, string> = {
  emerald: "text-emerald-300",
  green: "text-lime-300",
  orange: "text-orange-300",
  rose: "text-rose-300",
};

/** Circular 0–100 score dial, coloured by band tone. Shared by the skin and
 * food result screens so both read as one system. */
export function ScoreRing({ score, tone }: { score: number; tone: ScoreTone }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  return (
    <div className="relative grid h-24 w-24 shrink-0 place-items-center">
      <svg viewBox="0 0 80 80" className="h-24 w-24 -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke={color.border} strokeWidth="7" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke={RING_TONE_HEX[tone]}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-2xl font-extrabold text-white">{score}</span>
        <span className="block text-[10px] text-slate-500">/ 100</span>
      </div>
    </div>
  );
}
