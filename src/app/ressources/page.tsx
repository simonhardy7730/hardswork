import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { SiteNav } from "@/components/layout/SiteNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { createClient } from "@/lib/supabase/server";
import AlertPromo from "@/components/ressources/AlertPromo";
import { GUIDES } from "@/lib/ressources/guides";

export const metadata: Metadata = {
  title: "Ressources pour les candidats — Wolko",
  description: "Des guides courts, datés et sourcés sur tes droits au travail en Belgique : job étudiant, flexi-job, préavis.",
  alternates: { canonical: "https://wolko.be/ressources" },
};

export default async function RessourcesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <div className="min-h-screen bg-[#FFFBF2] font-body">
      <SiteNav />
      <main className="pt-[60px]">
        <div className="bg-[#101F43] pt-16 pb-16 px-6 text-center">
          <h1 className="font-display font-black text-white uppercase leading-[0.95]" style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}>
            Tes droits, <span className="text-brand">expliqués simplement.</span>
          </h1>
          <p className="text-white/70 mt-4 max-w-xl mx-auto">Des guides courts, avec la date de vérification et le lien vers la source officielle.</p>
        </div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-4">
          <Link href="/ressources/baremes" className="block bg-white border border-[#101F43]/10 rounded-2xl p-5 hover:border-brand transition">
            <div className="flex items-start gap-3">
              <BookOpen className="text-brand mt-1 shrink-0" size={20} />
              <div className="flex-1">
                <h2 className="font-display font-black uppercase text-[#101F43] text-lg leading-tight">Barèmes par secteur</h2>
                <p className="text-sm text-[#101F43]/70 mt-1">Les salaires horaires minimums bruts selon la commission paritaire (construction, nettoyage…).</p>
              </div>
              <ArrowRight size={16} className="text-[#101F43]/40 mt-1" />
            </div>
          </Link>
          {GUIDES.map((g) => (
            <Link key={g.slug} href={`/ressources/guides/${g.slug}`} className="block bg-white border border-[#101F43]/10 rounded-2xl p-5 hover:border-brand transition">
              <div className="flex items-start gap-3">
                <BookOpen className="text-brand mt-1 shrink-0" size={20} />
                <div className="flex-1">
                  <h2 className="font-display font-black uppercase text-[#101F43] text-lg leading-tight">{g.titre}</h2>
                  <p className="text-sm text-[#101F43]/70 mt-1">{g.resume}</p>
                </div>
                <ArrowRight size={16} className="text-[#101F43]/40 mt-1" />
              </div>
            </Link>
          ))}
          <AlertPromo loggedIn={!!user} className="mt-6" />
          <p className="text-xs text-[#101F43]/55 pt-4">Information générale, pas un conseil juridique. Simulateur de salaire net : bientôt.</p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
