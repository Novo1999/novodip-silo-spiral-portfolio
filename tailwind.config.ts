import type { Config } from "tailwindcss";

/**
 * Monochrome amber-on-umber palette (Silo poster): every neutral is a warm
 * burnt brown, text is cream, and the former cool accents (sky / purple /
 * emerald / pink) are remapped to shades of orange and gold.
 */
const umber = {
  50: "#fdf4e3",
  100: "#f8e6c7",
  200: "#ebcfa0",
  300: "#d4ac72",
  400: "#a9834f",
  500: "#7a5a34",
  600: "#553c20",
  700: "#3a2813",
  800: "#27190b",
  900: "#190f06",
  950: "#0e0804"
};

const orange = {
  50: "#fff4e0",
  100: "#ffe4b8",
  200: "#ffcf85",
  300: "#ffb655",
  400: "#ff9d2e",
  500: "#f5851a",
  600: "#d8650c",
  700: "#a94a08",
  800: "#73300a",
  900: "#481d07",
  950: "#2a0f04"
};

const gold = {
  50: "#fff8e1",
  100: "#ffefbd",
  200: "#ffe08a",
  300: "#ffce57",
  400: "#f9b92d",
  500: "#e09a12",
  600: "#b4760a",
  700: "#86560b",
  800: "#5c3a0b",
  900: "#3b2507",
  950: "#221304"
};

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./data/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        white: "#f6e8d0",
        black: "#0a0502",
        zinc: umber,
        amber: gold,
        orange,
        sky: gold,
        purple: orange,
        emerald: gold,
        pink: orange
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"]
      }
    }
  },
  plugins: []
};

export default config;
