"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, UserPlus, Sparkles, MessageSquare, FilePlus2, Inbox, Handshake } from "lucide-react";

const TABS = {
  candidats: {
    label: "Pour les candidats",
    cta: { label: "Créer mon profil", href: "/signup/candidat" },
    steps: [
      { icon: UserPlus, title: "Créez votre profil", body: "Indiquez votre métier, vos permis et vos disponibilités, ajoutez votre CV." },
      { icon: Sparkles, title: "Découvrez les offres adaptées", body: "Parcourez les offres près de chez vous, par métier ou par secteur." },
      { icon: MessageSquare, title: "Postulez et échangez", body: "Candidatez en quelques clics et échangez avec les recruteurs." },
    ],
  },
  entreprises: {
    label: "Pour les entreprises",
    cta: { label: "Publier une offre", href: "/recrute" },
    steps: [
      { icon: FilePlus2, title: "Publiez votre offre", body: "Décrivez le poste, le contrat et les permis requis dans un formulaire simple." },
      { icon: Inbox, title: "Recevez des candidatures", body: "Retrouvez toutes les candidatures au même endroit, dans votre tableau de bord." },
      { icon: Handshake, title: "Contactez vos futurs collaborateurs", body: "Reprenez contact avec les profils qui vous correspondent." },
    ],
  },
} as const;
type Key = keyof typeof TABS;

export function HowItWorks() {
  const [tab, setTab] = useState<Key>("candidats");
  const t = TABS[tab];
  return (
    <div>
      <div role="tablist" aria-label="Comment ça marche" className="inline-flex p-1 rounded-full bg-white border border-[#EADFC4] mb-10">
        {(Object.keys(TABS) as Key[]).map((k) => (
          <button key={k} role="tab" id={`hiw-tab-${k}`} aria-selected={tab === k} aria-controls="hiw-panel" type="button"
            onClick={() => setTab(k)}
            className={`px-4 sm:px-6 py-2.5 rounded-full text-sm font-bold transition-colors ${tab === k ? "bg-[#101F43] text-white" : "text-[#64748B] hover:text-ink"}`}>
            {TABS[k].label}
          </button>
        ))}
      </div>

      <div id="hiw-panel" role="tabpanel" aria-labelledby={`hiw-tab-${tab}`} key={tab} className="animate-fade-up">
        <div className="grid md:grid-cols-3 gap-5">
          {t.steps.map((s, i) => (
            <div key={s.title} className="bg-white border border-[#EADFC4] rounded-2xl p-6 relative">
              <span className="absolute top-5 right-5 font-display font-black text-5xl leading-none text-[#101F43]/[0.07] select-none">{i + 1}</span>
              <div className="w-11 h-11 rounded-xl bg-[#FFB900] flex items-center justify-center mb-5">
                <s.icon size={20} className="text-[#101F43]" aria-hidden />
              </div>
              <h3 className="font-display font-bold text-ink text-xl mb-2">{s.title}</h3>
              <p className="text-sm text-[#64748B] leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <Link href={t.cta.href} className="btn-dark inline-flex">{t.cta.label} <ArrowRight size={15} /></Link>
        </div>
      </div>
    </div>
  );
}
