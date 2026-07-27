import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "#0B0714",
        panel: "#17102A",
        "panel-raised": "#1F1638",
        purple: {
          DEFAULT: "#6D28D9",
          glow: "#9F5FFF",
          deep: "#3B1568",
        },
        gold: {
          DEFAULT: "#D4AF37",
          bright: "#F3CC5C",
          soft: "#C9A876",
        },
        ivory: "#F2EDE3",
        muted: "#A99BC4",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        utility: ["var(--font-utility)", "monospace"],
      },
      backgroundImage: {
        "radial-glow":
          "radial-gradient(circle at 50% 20%, rgba(159,95,255,0.14), transparent 60%)",
      },
      keyframes: {
        breathe: {
          "0%, 100%": { opacity: "0.06", transform: "scale(1)" },
          "50%": { opacity: "0.11", transform: "scale(1.03)" },
        },
        "gold-sweep": {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
      },
      animation: {
        breathe: "breathe 14s ease-in-out infinite",
        "gold-sweep": "gold-sweep 6s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
