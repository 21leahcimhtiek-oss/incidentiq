import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        severity: {
          p0: {
            DEFAULT: "#ef4444",
            light: "#fee2e2",
            dark: "#991b1b",
          },
          p1: {
            DEFAULT: "#f97316",
            light: "#ffedd5",
            dark: "#9a3412",
          },
          p2: {
            DEFAULT: "#eab308",
            light: "#fef9c3",
            dark: "#854d0e",
          },
          p3: {
            DEFAULT: "#22c55e",
            light: "#dcfce7",
            dark: "#166534",
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;