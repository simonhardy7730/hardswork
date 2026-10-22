import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteNav } from "@/components/layout/SiteNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { BAREMES } from "@/lib/ressources/baremes";

export const metadata: Metadata = {
  title: "Barèmes salariaux par commission paritaire — Wolko",
  description: "Salaires horaires minimums bruts par commission paritaire (construction, nettoyage…), avec la date d'entrée en vigueur et la source officielle.",
  alternates: { canonical: "https://wolko.be/ressources/baremes" },
};

export default function BaremesPage() {
  return (
    <div className="min-h-screen bg-[#FFFBF2] font-body">
      <SiteNav />
      <main className="pt-[60px]">
        <div className="bg-[#101F43] pt-16 pb-14 px-6 text-center">
          <h1 className="font-display font-black text-white uppercase leading-[0.95]" style={{ fontSize: "clamp(2rem, 5vw, 3.6rem)" }}>
            Barèmes <span className="text-brand">par secteur.</span>
          </h1>
          <p className="text-white/70 mt-4 max-w-xl mx-auto">Le minimum légal que ton employeur doit te payer selon sa commission paritaire. Tu peux gagner plus, jamais moins.</p>
        </div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-4">
          {BAREMES.map((b) => (
            <Link key={b.slug} href={`/ressources/baremes/${b.slug}`} className="flex items-center gap-3 bg-white border border-[#101F43]/10 rounded-2xl p-5 hover:border-brand transition">
              <div className="flex-1">
                <h2 className="font-display font-black uppercase text-[#101F43] text-lg">{b.titre}</h2>
                <p className="text-sm text-[#101F43]/60">En vigueur depuis le {new Date(b.enVigueur + "T12:00:00Z").toLocaleDateString("fr-BE", { day: "numeric", month: "long", year: "numeric" })}</p>
              </div>
              <ArrowRight size={16} className="text-[#101F43]/40" />
            </Link>
          ))}
          <p className="text-xs text-[#101F43]/55 pt-4">D&apos;autres commissions paritaires (horeca, transport, commerce, métal…) seront ajoutées au fur et à mesure, une fois les chiffres officiels vérifiés. Ces barèmes sont des minimums bruts, indicatifs : ton contrat prime.</p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
