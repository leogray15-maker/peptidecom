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
        lab: {
          bg: "#07070a",
          card: "#0f0f15",
          border: "#20202b",
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
      },
    },
  },
  plugins: [],
};

export default config;
