import type { Metadata } from "next";
import { Inter, Barlow_Condensed } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: {
    default: "HardSwork — Pour ceux qui construisent la Belgique",
    template: "%s — HardSwork",
  },
  description:
    "La plateforme de recrutement B2B et B2C pensée pour les vrais professionnels du terrain en Belgique. Logistique, transport, industrie, construction, nettoyage, sécurité.",
  keywords: [
    "recrutement", "emploi", "Belgique", "logistique", "transport",
    "industrie", "construction", "intérim", "ouvrier", "terrain",
  ],
  authors: [{ name: "HardSwork", url: "https://hardswork.be" }],
  creator: "HardSwork",
  metadataBase: new URL("https://hardswork.be"),
  openGraph: {
    title: "HardSwork — Pour ceux qui construisent la Belgique",
    description:
      "Recrutement terrain en Belgique. Logistique, transport, industrie, construction, nettoyage, sécurité.",
    url: "https://hardswork.be",
    siteName: "HardSwork",
    locale: "fr_BE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HardSwork — Pour ceux qui construisent la Belgique",
    description:
      "Recrutement terrain en Belgique. Logistique, transport, industrie, construction.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} ${barlow.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
