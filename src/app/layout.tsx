import type { Metadata } from "next";
import { Inter, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/lib/brand";
import { getLang } from "@/lib/i18n/server";

const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s — ${BRAND.name}`,
  },
  description:
    "La plateforme de recrutement pour tous les métiers : logistique, transport, industrie, construction, santé, restauration, nettoyage, sécurité et plus.",
  keywords: [
    "recrutement", "emploi", "Belgique", "logistique", "transport",
    "industrie", "construction", "intérim", "restauration", "santé",
  ],
  authors: [{ name: "HardSwork", url: "https://hardswork.be" }],
  creator: "HardSwork",
  metadataBase: new URL("https://hardswork.be"),
  openGraph: {
    title: "HardSwork — Le recrutement pour tous les métiers",
    description:
      "Recrutez tous les métiers : logistique, transport, industrie, construction, santé, restauration, sécurité.",
    url: "https://hardswork.be",
    siteName: "HardSwork",
    locale: "fr_BE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HardSwork — Le recrutement pour tous les métiers",
    description:
      "Recrutez tous les métiers : logistique, transport, industrie, construction, santé.",
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
    <html lang={getLang()} className={`${inter.variable} ${barlow.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
