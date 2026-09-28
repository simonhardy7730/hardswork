import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const sans = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-sans" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Sosilook — Le sosie de ton look",
  description:
    "Une photo d'un vêtement, d'une montre, d'un sac ou de lunettes : Sosilook retrouve la pièce exacte au meilleur prix chez des vendeurs fiables, ou son sosie pour beaucoup moins cher.",
};

export const viewport: Viewport = { themeColor: "#1E2B4D" };

// Décide avant le premier affichage si l'intro doit être jouée (évite un flash de denim).
const introScript = `try{if(sessionStorage.getItem("sosilook.intro")==="vue")document.documentElement.dataset.intro="skip"}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
      </head>
      <body className="min-h-screen font-sans text-encre antialiased">{children}</body>
    </html>
  );
}
