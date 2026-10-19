import { Search, MapPin } from "lucide-react";
import Link from "next/link";

const SUGGESTIONS = [
  "Cariste",
  "Opérateur de production",
  "Assistant administratif",
  "Chauffeur CE",
  "Électromécanicien",
];

/** Formulaire GET natif vers /jobs : fonctionne sans JavaScript, paramètres conservés dans l'URL. */
export function SearchModule() {
  return (
    <section id="recherche" className="bg-[#FFFBF2] border-b border-[#EADFC4]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <h2 className="font-display font-black text-ink uppercase mb-5" style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", lineHeight: 1 }}>
          Trouvez votre prochain emploi
        </h2>
        <form action="/jobs" method="GET" role="search"
          className="flex flex-col md:flex-row gap-2 bg-white border-2 border-[#EADFC4] rounded-2xl p-2 shadow-sm focus-within:border-[#FFB900] transition-colors">
          <label className="flex items-center gap-3 flex-1 min-w-0 px-3 h-14">
            <Search size={18} className="text-[#64748B] shrink-0" aria-hidden />
            <span className="sr-only">Métier, compétence ou mot-clé</span>
            <input name="q" type="text" placeholder="Métier, compétence ou mot-clé"
              className="flex-1 min-w-0 bg-transparent text-ink placeholder-[#94A3B8] text-base focus:outline-none !outline-none" />
          </label>
          <div className="hidden md:block w-px bg-[#EADFC4] my-2" />
          <label className="flex items-center gap-3 md:w-64 px-3 h-14 border-t md:border-t-0 border-[#EADFC4]">
            <MapPin size={18} className="text-[#64748B] shrink-0" aria-hidden />
            <span className="sr-only">Ville ou code postal</span>
            <input name="lieu" type="text" autoComplete="address-level2" placeholder="Ville ou code postal"
              className="flex-1 min-w-0 bg-transparent text-ink placeholder-[#94A3B8] text-base focus:outline-none !outline-none" />
          </label>
          <button type="submit" className="btn-brand justify-center h-14 px-8 rounded-xl">Rechercher</button>
        </form>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-[#64748B] font-semibold mr-1">Par exemple :</span>
          {SUGGESTIONS.map((s) => (
            <Link key={s} href={`/jobs?q=${encodeURIComponent(s)}`}
              className="text-xs font-semibold text-ink bg-white border border-[#EADFC4] hover:border-[#FFB900] rounded-full px-3 py-1.5 transition-colors">
              {s}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
