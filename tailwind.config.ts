import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        ink: {
          DEFAULT: "#0B1220",
          50: "#f4f6f9", 100: "#e7ebf1", 200: "#cbd4e1",
          700: "#1f2a3d", 800: "#141d2b", 900: "#0B1220",
        },
        accent: {
          DEFAULT: "#4f46e5", soft: "#eef2ff", strong: "#3730a3",
        },
        opp: {
          DEFAULT: "#0d9488", soft: "#f0fdfa", strong: "#0f766e",
        },
        risk: {
          low: "#16a34a", med: "#d97706", high: "#dc2626",
        },
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(16 24 40 / 0.04), 0 1px 3px 0 rgb(16 24 40 / 0.06)",
        cardhover: "0 4px 12px -2px rgb(16 24 40 / 0.10), 0 2px 6px -2px rgb(16 24 40 / 0.06)",
      },
      keyframes: {
        fadeUp: { "0%": { opacity: "0", transform: "translateY(6px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        pop: { "0%": { opacity: "0", transform: "scale(.97)" }, "100%": { opacity: "1", transform: "scale(1)" } },
      },
      animation: {
        fadeUp: "fadeUp .4s cubic-bezier(.16,1,.3,1) both",
        pop: "pop .3s cubic-bezier(.16,1,.3,1) both",
      },
    },
  },
  plugins: [],
};
export default config;
