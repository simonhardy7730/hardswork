import type { Config } from "tailwindcss";

/**
 * Direction artistique « l'atelier » : toile denim, fil de surpiqûre orange,
 * papier patron quadrillé, étiquettes tissées et étiquettes de prix.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        denim: { DEFAULT: "#1E2B4D", 700: "#16203A", 500: "#2D3E68", 300: "#6F7FA6" },
        fil: { DEFAULT: "#D9822B", fonce: "#B0641A", clair: "#F6DDBF" },
        patron: { DEFAULT: "#F7F7F4", grille: "#DCE2EC", carton: "#ECEAE2" },
        encre: "#131A2B",
        craie: "#5B6479",
        ok: "#2E7556",
        alerte: "#B3321F",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "Menlo", "monospace"],
      },
      boxShadow: {
        etiquette: "0 1px 0 rgba(19,26,43,.06), 0 6px 18px -10px rgba(19,26,43,.35)",
      },
    },
  },
  plugins: [],
};

export default config;
