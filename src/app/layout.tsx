import Script from "next/script";
import type { Metadata } from "next";
import { Inter, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/lib/brand";
import { getLang } from "@/lib/i18n/server";
import { LangProvider } from "@/lib/i18n/context";

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
  authors: [{ name: "Wolko", url: "https://wolko.be" }],
  creator: "Wolko",
  metadataBase: new URL("https://wolko.be"),
  openGraph: {
    title: "Wolko — Le recrutement pour tous les métiers",
    description:
      "Recrutez tous les métiers : logistique, transport, industrie, construction, santé, restauration, sécurité.",
    url: "https://wolko.be",
    siteName: "Wolko",
    locale: "fr_BE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wolko — Le recrutement pour tous les métiers",
    description:
      "Recrutez tous les métiers : logistique, transport, industrie, construction, santé.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={await getLang()} className={`${inter.variable} ${barlow.variable}`}>
      <body className="antialiased"><LangProvider lang={await getLang()}>{children}</LangProvider>
        {/* Mesure d'audience Cloudflare : sans cookie, aucune donnée personnelle, uniquement en production. */}
        {process.env.VERCEL_ENV === "production" && (
          <Script src="https://static.cloudflareinsights.com/beacon.min.js" strategy="afterInteractive"
            data-cf-beacon='{"token": "d8c797485f4a45a1bfb07c6ae4bf6f89"}' />
        )}
      </body>
    </html>
  );
}
