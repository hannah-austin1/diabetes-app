import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      colors: {
        bg: {
          DEFAULT: "#0a0a0f",
          card: "#111118",
          hover: "#18181f",
        },
        accent: {
          blue: "#4f8ef7",
          purple: "#a855f7",
          green: "#22c55e",
          red: "#ef4444",
          yellow: "#eab308",
          orange: "#f97316",
        },
        border: {
          DEFAULT: "rgba(255,255,255,0.08)",
          hover: "rgba(255,255,255,0.14)",
        },
      },
      animation: {
        "roller-coaster": "rollerCoaster 20s linear infinite",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "train": "train 20s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        train: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
