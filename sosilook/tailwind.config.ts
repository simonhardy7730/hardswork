import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        creme: "#F6F1E9",
        lin: "#EDE4D6",
        encre: "#1C1B19",
        marine: "#1F2A44",
        bordeaux: "#7A2E2E",
        sauge: "#5B6B57",
        or: "#B08D57",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
