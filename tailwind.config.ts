import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#F4EFE6",
        cream: "#FAF6ED",
        bone: "#EDE6D6",
        ink: "#181613",
        ash: "#6B6661",
        muted: "#9C968B",
        rule: "#1816131A",
        vermilion: "#C44536",
        oxblood: "#8B2E25",
        moss: "#3D5A3D",
        ochre: "#B8860B",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-geist)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both",
        "stamp": "stamp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both",
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "stamp": {
          "0%": { opacity: "0", transform: "scale(1.4) rotate(-8deg)" },
          "100%": { opacity: "1", transform: "scale(1) rotate(-3deg)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.3" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
