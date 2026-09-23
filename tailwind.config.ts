import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Arcane Peptides palette: vivid violet accent on near-black.
        brand: {
          50: "#f4f2ff",
          100: "#eae6ff",
          200: "#d7ccff",
          300: "#b9a7ff",
          400: "#9a7bff",
          500: "#7c5cff",
          600: "#6a44f5",
          700: "#5a33da",
          800: "#4a2bae",
          900: "#3d2889",
          950: "#241858",
        },
        // "Nocturne" surfaces: ink-dark, faintly violet, layered by lightness
        // rather than by shadow. sunken < bg-adjacent chrome, card < raised.
        lab: {
          bg: "#0a0911",
          sunken: "#0d0c14",
          card: "#121019",
          raised: "#1a1724",
          border: "#25212f",
          line: "#1f1c2a",
        },
        // Violet-tinted neutrals in place of Tailwind's blue-grey slate, so
        // every existing text-slate-* class sits on the ink palette. Also a
        // contrast fix: slate-500 on a card is ~5.6:1 here (was ~3.9:1).
        slate: {
          50: "#f8f7fc",
          100: "#f4f2fa",
          200: "#e3dfee",
          300: "#ccc6db",
          400: "#a8a2ba",
          500: "#8e88a3",
          600: "#6e6882",
          700: "#4a4559",
          800: "#2e2a3a",
          900: "#1a1724",
          950: "#0d0c14",
        },
        // Subtle gold — used sparingly for milestones & The Archives.
        gold: {
          200: "#f7e6b5",
          300: "#f0d68e",
          400: "#e6bf5f",
          500: "#d4a437",
          600: "#b98a24",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
