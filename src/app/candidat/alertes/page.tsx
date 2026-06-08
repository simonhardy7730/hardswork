"use client";

import { Bell, BellOff, ArrowRight, Plus } from "lucide-react";
import Link from "next/link";

export default function AlertesPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="font-display font-black text-ink uppercase leading-none"
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", letterSpacing: "-0.01em" }}
          >
            Mes <span className="text-brand">[alertes].</span>
          </h1>
          <p className="text-ink-500 text-sm mt-1">
            Recevez les nouvelles offres par email selon vos critères.
          </p>
        </div>
        <button
          disabled
          className="flex items-center gap-2 bg-brand text-white font-display font-black uppercase text-xs px-4 py-2.5 rounded-xl opacity-50 cursor-not-allowed"
          style={{ letterSpacing: "0.05em" }}
          title="Bientôt disponible"
        >
          <Plus size={13} />
          Créer une alerte
        </button>
      </div>

      {/* Empty state */}
      <div className="bg-white border border-ink-100 rounded-2xl p-12 text-center">
        <div className="w-16 h-16 bg-surface rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Bell size={28} className="text-ink-200" />
        </div>
        <h2 className="font-display font-black text-ink uppercase text-base mb-2"
          style={{ letterSpacing: "-0.01em" }}>
          Aucune alerte configurée
        </h2>
        <p className="text-ink-500 text-sm max-w-xs mx-auto mb-6 leading-relaxed">
          Cette fonctionnalité arrive très bientôt. Vous pourrez créer des alertes
          email pour chaque nouveau poste correspondant à votre profil.
        </p>
        <Link href="/jobs"
          className="inline-flex items-center gap-2 bg-brand text-white font-display font-black uppercase text-xs px-5 py-3 rounded-xl hover:bg-brand-dark transition"
          style={{ letterSpacing: "0.05em" }}>
          Voir les offres maintenant <ArrowRight size={13} />
        </Link>
      </div>

      {/* Upcoming features */}
      <div className="bg-white border border-ink-100 rounded-2xl p-5">
        <p className="font-display font-black text-ink uppercase text-xs tracking-widest mb-4">
          Prochainement
        </p>
        <div className="space-y-3">
          {[
            "Alertes par secteur (Logistique, Construction…)",
            "Alertes par région (Wallonie, Bruxelles, Flandre)",
            "Fréquence configurable (quotidien, hebdomadaire)",
            "Résumé des offres par email",
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
