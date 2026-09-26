/**
 * Design tokens — the single source of truth for colour.
 *
 * tailwind.config.ts builds every utility colour from this file, and code that
 * needs a raw value (Recharts strokes, SVG fills, map pins, canvas) imports it
 * from here rather than hard-coding a hex. Dark, violet-toned; never pure
 * black or pure white.
 */

export const color = {
  bg: "#0B0A10",
  sidebar: "#0E0D14",
  surface: "#13121A",
  surfaceSunken: "#0E0D14",
  surfaceActive: "#1D1A2B",

  border: "#232030",
  borderSubtle: "#211E2D",
  borderStrong: "#2E2A3D",

  text: "#EDEBF3",
  textActive: "#F3F1F8",
  textSecondary: "#A9A4BA",
  textMuted: "#8A849D",
  /** Decorative only — never body copy (fails 4.5:1 on surfaces). */
  textFaint: "#6F6A82",

  primary: "#6D4AE8",
  primaryHover: "#5E3BDB",
  /** Icons, chart lines, active states. */
  accent: "#9B80FF",
  accentStrong: "#A48BFF",
  chipSelected: "#2A2146",

  /** The Archives and premium only. */
  gold: "#D9B868",
  goldBorder: "#5A4A26",

  /** Pure-black stand-in for scrims and dark-on-colour text. */
  ink: "#07060B",
} as const;

/** Score scale. Always pair the colour with its number or word. */
export const score = {
  excellent: "#5FD4A0",
  good: "#B8D94A",
  moderate: "#F5B764",
  moderateBg: "#2E2414",
  poor: "#F5A04A",
  bad: "#F2685F",
} as const;

export type ScoreLevel = "excellent" | "good" | "moderate" | "poor" | "bad";

export const SCORE_LABEL: Record<ScoreLevel, string> = {
  excellent: "Excellent",
  good: "Good",
  moderate: "Managing",
  poor: "Poor",
  bad: "Bad",
};

/** 0–10 skin severity (0 = calm) → score level. */
export function severityLevel(value: number): ScoreLevel {
  if (value <= 1) return "excellent";
  if (value <= 3) return "good";
  if (value <= 5) return "moderate";
  if (value <= 7) return "poor";
  return "bad";
}

/** Word shown next to a 0–10 severity. */
export function severityWord(value: number): string {
  if (value <= 1) return "Calm";
  if (value <= 3) return "Mild";
  if (value <= 5) return "Managing";
  if (value <= 7) return "Rough";
  return "Really hard";
}

export const font = {
  sans: "Geist",
  mono: "Geist Mono",
  display: "Instrument Serif",
} as const;
