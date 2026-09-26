import { score, SCORE_LABEL, severityLevel, severityWord, type ScoreLevel } from "@/lib/tokens";
import { cn } from "@/lib/utils";

export const SCORE_COLOR: Record<ScoreLevel, string> = {
  excellent: score.excellent,
  good: score.good,
  moderate: score.moderate,
  poor: score.poor,
  bad: score.bad,
};

/** The app's older tone names (forecast, POEM, product scores) → level. */
export function toneLevel(tone: string): ScoreLevel {
  switch (tone) {
    case "emerald":
    case "green":
      return "excellent";
    case "lime":
      return "good";
    case "amber":
    case "yellow":
      return "moderate";
    case "orange":
      return "poor";
    default:
      return "bad";
  }
}

/** 0–100 product / food / restaurant score → level (higher is better). */
export function gradeLevel(value: number): ScoreLevel {
  if (value >= 75) return "excellent";
  if (value >= 50) return "good";
  if (value >= 25) return "poor";
  return "bad";
}

/**
 * Coloured pill that always carries its number and/or word — colour is never
 * the only signal.
 */
export function ScoreBadge({
  level,
  value,
  label,
  size = "md",
  className,
}: {
  level: ScoreLevel;
  value?: React.ReactNode;
  /** Defaults to the level's word. Pass null to show the number only. */
  label?: string | null;
  size?: "sm" | "md";
  className?: string;
}) {
  const c = SCORE_COLOR[level];
  const word = label === undefined ? SCORE_LABEL[level] : label;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border font-medium",
        size === "sm" ? "px-2 py-0.5 text-[11.5px]" : "px-2.5 py-1 text-[12.5px]",
        className
      )}
      style={{ color: c, borderColor: `${c}55`, backgroundColor: `${c}14` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c }} aria-hidden />
      {value !== undefined && value !== null && <span className="font-mono tabular-nums">{value}</span>}
      {word && <span>{word}</span>}
    </span>
  );
}

/** 0–10 severity badge: "4/10 · Managing". */
export function SeverityBadge({ value, size }: { value: number; size?: "sm" | "md" }) {
  return (
    <ScoreBadge
      level={severityLevel(value)}
      value={`${Math.round(value * 10) / 10}/10`}
      label={severityWord(value)}
      size={size}
    />
  );
}
