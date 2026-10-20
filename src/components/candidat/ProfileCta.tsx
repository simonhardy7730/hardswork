import Link from "next/link";
import { ArrowRight, FileText, PhoneCall, Search } from "lucide-react";

/** Bloc « aucune offre ne te correspond ? » : inscription dans la candidathèque, sans CV obligatoire. */
export default function ProfileCta({ lang = "fr", compact = false }: { lang?: string; compact?: boolean }) {
  const l = (fr: string, nl: string) => (lang === "nl" ? nl : fr);
  const points: [typeof Search, string][] = [
    [Search, l("Tu choisis ton métier : électricien, cariste, aide-soignant…", "Je kiest je beroep: elektricien, heftruckchauffeur, zorgkundige…")],
    [PhoneCall, l("Les employeurs de la région te trouvent et t'appellent", "Werkgevers uit de regio vinden en bellen je")],
    [FileText, l("Pas de CV ? On te le crée gratuitement", "Geen cv? We maken het gratis voor je")],
  ];
  return (
    <div className="brand-on-dark rounded-2xl bg-[#101F43] text-white p-6 sm:p-8 relative overflow-hidden">
      <div aria-hidden="true" className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[#FFB900]/15 blur-2xl" />
      <div className={`relative ${compact ? "" : "sm:flex sm:items-center sm:justify-between sm:gap-8"}`}>
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-[#FFB900] mb-2">{l("Aucune offre ne te correspond ?", "Geen vacature voor jou?")}</p>
          <h2 className="font-display font-black uppercase leading-none mb-4" style={{ fontSize: compact ? "1.6rem" : "clamp(1.7rem, 3.4vw, 2.4rem)" }}>
            {l("Dépose ton profil.", "Laat je profiel achter.")}<br /><span className="text-[#FFB900]">{l("Les employeurs t'appellent.", "Werkgevers bellen je.")}</span>
          </h2>
          <ul className="space-y-2 mb-5 sm:mb-0">
            {points.map(([Icon, t]) => (
              <li key={t} className="flex items-start gap-2.5 text-sm text-white/85"><Icon size={16} className="text-[#FFB900] shrink-0 mt-0.5" />{t}</li>
            ))}
          </ul>
        </div>
        <div className={`${compact ? "mt-5" : "sm:shrink-0"}`}>
          <Link href="/signup/candidat" className="inline-flex items-center gap-2 bg-[#FFB900] text-[#101F43] font-display font-black uppercase px-6 py-4 rounded-xl text-sm" style={{ letterSpacing: "0.05em" }}>
            {l("Créer mon profil gratuit", "Gratis profiel maken")} <ArrowRight size={16} />
          </Link>
          <p className="text-xs text-white/60 mt-2">{l("2 minutes · Sans CV · 100 % gratuit", "2 minuten · Zonder cv · 100 % gratis")}</p>
        </div>
      </div>
    </div>
  );
}
