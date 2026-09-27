import type { Config } from "tailwindcss";
import { color as c, score } from "./src/lib/tokens";

// Every colour below comes from src/lib/tokens.ts. The semantic names
// (canvas, surface, line, fg, primary, accent, score) are what new code uses;
// the older ramps (lab, slate, brand, gold, and the emerald→rose status hues)
// are kept as aliases onto the same tokens so no screen drifts off-palette.
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        white: c.textActive,
        black: c.ink,
        ink: c.ink,

        canvas: c.bg,
        sidebar: c.sidebar,
        surface: {
          DEFAULT: c.surface,
          sunken: c.surfaceSunken,
          active: c.surfaceActive,
        },
        line: {
          DEFAULT: c.border,
          subtle: c.borderSubtle,
          strong: c.borderStrong,
        },
        fg: {
          DEFAULT: c.text,
          active: c.textActive,
          secondary: c.textSecondary,
          muted: c.textMuted,
          faint: c.textFaint,
        },
        primary: { DEFAULT: c.primary, hover: c.primaryHover },
        accent: { DEFAULT: c.accent, strong: c.accentStrong },
        chip: { DEFAULT: c.chipSelected },
        score: {
          excellent: score.excellent,
          good: score.good,
          moderate: score.moderate,
          "moderate-bg": score.moderateBg,
          poor: score.poor,
          bad: score.bad,
        },

        // ── Legacy aliases ──────────────────────────────────────────────
        brand: {
          50: c.textActive,
          100: c.textActive,
          200: c.accentStrong,
          300: c.accentStrong,
          400: c.accent,
          500: c.primary,
          600: c.primary,
          700: c.primaryHover,
          800: c.primaryHover,
          900: c.chipSelected,
          950: c.surfaceActive,
        },
        lab: {
          bg: c.bg,
          sunken: c.surfaceSunken,
          card: c.surface,
          raised: c.surfaceActive,
          border: c.border,
          line: c.borderSubtle,
        },
        slate: {
          50: c.textActive,
          100: c.text,
          200: c.text,
          300: c.textSecondary,
          400: c.textSecondary,
          500: c.textMuted,
          600: c.textMuted,
          700: c.borderStrong,
          800: c.borderStrong,
          900: c.surfaceActive,
          950: c.surfaceSunken,
        },
        gold: {
          DEFAULT: c.gold,
          line: c.goldBorder,
          200: c.gold,
          300: c.gold,
          400: c.gold,
          500: c.gold,
          600: c.goldBorder,
        },
        emerald: flat(score.excellent),
        green: flat(score.excellent),
        lime: flat(score.good),
        amber: flat(score.moderate),
        yellow: flat(score.moderate),
        orange: flat(score.poor),
        rose: flat(score.bad),
        red: flat(score.bad),
        sky: flat(c.accent),
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        "page-title": ["44px", { lineHeight: "1.05", letterSpacing: "-0.01em" }],
        meta: ["12.5px", { lineHeight: "1.45" }],
        label: ["11px", { lineHeight: "1.3", letterSpacing: "0.08em" }],
      },
      borderRadius: {
        card: "14px",
        control: "10px",
        nav: "8px",
      },
      spacing: {
        "4.5": "1.125rem",
        sidebar: "248px",
        topbar: "64px",
      },
      transitionDuration: { DEFAULT: "150ms" },
      transitionTimingFunction: { DEFAULT: "cubic-bezier(0, 0, 0.2, 1)" },
    },
  },
  plugins: [],
};

/** One hue for every shade of a status ramp, with a dark 950 for text on it. */
function flat(hex: string) {
  const ramp: Record<string, string> = {};
  for (const k of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]) ramp[k] = hex;
  ramp[950] = c.ink;
  return ramp;
}

export default config;
