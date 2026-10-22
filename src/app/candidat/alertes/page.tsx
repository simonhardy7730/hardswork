"use client";

import { Bell, BellOff, ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { useL } from "@/lib/i18n/context";

export default function AlertesPage() {
  const l = useL();
  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="font-display font-black text-ink uppercase leading-none"
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", letterSpacing: "-0.01em" }}
          >
            {l("Mes", "Mijn")} <span className="text-brand">[{l("alertes", "alerts")}].</span>
          </h1>
          <p className="text-ink-500 text-sm mt-1">
            {l("Reçois les nouvelles offres par e-mail selon tes critères.", "Ontvang nieuwe vacatures per e-mail volgens je criteria.")}
          </p>
        </div>
        <button
          disabled
          className="flex items-center gap-2 bg-brand text-white font-display font-black uppercase text-xs px-4 py-2.5 rounded-xl opacity-50 cursor-not-allowed"
          style={{ letterSpacing: "0.05em" }}
          title={l("Bientôt disponible", "Binnenkort beschikbaar")}
        >
          <Plus size={13} />
          {l("Créer une alerte", "Alert aanmaken")}
        </button>
      </div>

      {/* Empty state */}
      <div className="bg-white border border-ink-100 rounded-2xl p-12 text-center">
        <div className="w-16 h-16 bg-surface rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Bell size={28} className="text-ink-200" />
        </div>
        <h2 className="font-display font-black text-ink uppercase text-base mb-2"
          style={{ letterSpacing: "-0.01em" }}>
          {l("Aucune alerte configurée", "Geen alerts ingesteld")}
        </h2>
        <p className="text-ink-500 text-sm max-w-xs mx-auto mb-6 leading-relaxed">
          {l("Cette fonctionnalité arrive très bientôt. Tu pourras créer des alertes e-mail pour chaque nouvelle offre correspondant à ton profil.", "Deze functie komt binnenkort. Je kunt dan e-mailalerts aanmaken voor elke nieuwe vacature die bij je profiel past.")}
        </p>
        <Link href="/jobs"
          className="inline-flex items-center gap-2 bg-brand text-white font-display font-black uppercase text-xs px-5 py-3 rounded-xl hover:bg-brand-dark transition"
          style={{ letterSpacing: "0.05em" }}>
          {l("Voir les offres maintenant", "Bekijk nu de vacatures")} <ArrowRight size={13} />
        </Link>
      </div>

      {/* Upcoming features */}
      <div className="bg-white border border-ink-100 rounded-2xl p-5">
        <p className="font-display font-black text-ink uppercase text-xs tracking-widest mb-4">
          {l("Prochainement", "Binnenkort")}
        </p>
        <div className="space-y-3">
          {[
            l("Alertes par secteur (Logistique, Construction…)", "Alerts per sector (logistiek, bouw…)"),
            l("Alertes par région (Wallonie, Bruxelles, Flandre)", "Alerts per regio (Wallonië, Brussel, Vlaanderen)"),
            l("Fréquence configurable (quotidien, hebdomadaire)", "Instelbare frequentie (dagelijks, wekelijks)"),
            l("Résumé des offres par email", "Samenvatting van vacatures per e-mail"),
          ].map((item) => (
            <div key={item} className="flex items-center gap-2.5 text-sm text-ink-500">
              <div className="w-4 h-4 rounded-full border border-ink-100 flex items-center justify-center shrink-0">
                <BellOff size={9} className="text-ink-200" />
              </div>
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
