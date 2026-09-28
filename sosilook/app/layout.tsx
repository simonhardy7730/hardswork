import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-serif" });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Sosilook — Trouve le sosie de ton look",
  description:
    "Prends en photo un vêtement, une montre, un sac ou des lunettes : Sosilook trouve la pièce exacte au meilleur prix chez des vendeurs fiables, ou son sosie moins cher.",
};

export const viewport: Viewport = { themeColor: "#F6F1E9" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${serif.variable} ${sans.variable}`}>
      <body className="min-h-screen bg-creme font-sans text-encre antialiased">{children}</body>
    </html>
  );
}
