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
        neu: {
          bg:      "#e4e9f0",
          "bg-d":  "#d0d6e0",
          text:    "#44476a",
          muted:   "#8890a4",
          light:   "#b2b8cc",
          accent:  "#6c63ff",
          accent2: "#a78bfa",
        },
      },
      boxShadow: {
        neu:       "8px 8px 20px rgba(163,177,198,0.65), -8px -8px 20px rgba(255,255,255,0.85)",
        "neu-sm":  "4px 4px 10px rgba(163,177,198,0.65), -4px -4px 10px rgba(255,255,255,0.85)",
        "neu-lg":  "14px 14px 32px rgba(163,177,198,0.65), -14px -14px 32px rgba(255,255,255,0.85)",
        "neu-in":  "inset 6px 6px 14px rgba(163,177,198,0.65), inset -6px -6px 14px rgba(255,255,255,0.85)",
        "neu-in-sm":"inset 3px 3px 8px rgba(163,177,198,0.65), inset -3px -3px 8px rgba(255,255,255,0.85)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};

export default config;
