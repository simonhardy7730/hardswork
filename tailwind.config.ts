import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#10214B",
          900: "#16295C",
          700: "#2B3A66",
          500: "#5A6585",
          300: "#9AA5C4",
          100: "#EADFC4",
        },
        surface: {
          DEFAULT: "#FFFBF0",
          2: "#FBF1D8",
          3: "#E9E2D8",
        },
        brand: {
          DEFAULT: "#FFB703",
          dark: "#E5A000",
          light: "#FFC933",
        },
        gold: "#B87C2A",
        success: "#1A8048",
      },
      fontFamily: {
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-2xl": ["clamp(3.5rem, 8vw, 9rem)", { lineHeight: "0.92", letterSpacing: "-0.02em" }],
        "display-xl": ["clamp(2.5rem, 5vw, 6rem)", { lineHeight: "0.94", letterSpacing: "-0.02em" }],
        "display-lg": ["clamp(2rem, 4vw, 4.5rem)", { lineHeight: "0.96", letterSpacing: "-0.015em" }],
        "display-md": ["clamp(1.5rem, 3vw, 3rem)", { lineHeight: "1", letterSpacing: "-0.01em" }],
      },
      screens: {
        xs: "480px",
      },
    },
  },
  plugins: [],
};

export default config;
