"use client";

import { useState, useTransition } from "react";
import { revealContact, type RevealResult } from "@/app/(dashboard)/dashboard/candidatheque/actions";
import { useL } from "@/lib/i18n/context";
import { whatsappLink } from "@/lib/whatsapp";

export default function RevealContact({ candidateId }: { candidateId: string }) {
  const l = useL();
  const [res, setRes] = useState<RevealResult | null>(null);
  const [pending, start] = useTransition();

  if (res?.ok) {
    return (
      <div className="text-sm text-ink space-y-0.5">
        <p className="font-semibold">{res.name}</p>
        {res.phone && <p><a href={`tel:${res.phone}`} className="underline">{res.phone}</a></p>}
        {(() => {
          const wa = whatsappLink(res.phone, l(`Bonjour ${res.name.split(" ")[0]}, j'ai vu votre profil sur Wolko, ...`, `Hallo ${res.name.split(" ")[0]}, ik zag je profiel op Wolko, ...`));
          return wa ? <p><a href={wa} target="_blank" rel="noopener noreferrer" className="underline text-emerald-700 font-semibold">💬 WhatsApp</a></p> : null;
        })()}
        {res.email && <p><a href={`mailto:${res.email}`} className="underline break-all">{res.email}</a></p>}
      </div>
    );
  }
  const msg = res && !res.ok
    ? ({ quota: l("Limite quotidienne atteinte (100 nouveaux contacts par jour).", "Dagelijkse limiet bereikt (100 nieuwe contacten per dag)."),
         no_access: l("Abonnement requis.", "Abonnement vereist."),
         not_found: l("Ce profil n'est plus disponible.", "Dit profiel is niet meer beschikbaar."),
         closed: l("Fonction indisponible.", "Functie niet beschikbaar."),
         error: l("Erreur, réessayez.", "Fout, probeer opnieuw.") } as const)[res.error]
    : null;
  return (
    <div>
      <button type="button" disabled={pending}
        onClick={() => start(async () => setRes(await revealContact(candidateId)))}
        className="h-10 px-4 rounded-xl bg-[#101F43] font-display font-black uppercase text-xs disabled:opacity-60"
        style={{ letterSpacing: "0.05em", color: "#FFFFFF" }}>
        {l("Voir les coordonnées", "Contactgegevens tonen")}
      </button>
      {msg && <p className="text-xs text-red-600 mt-2">{msg}</p>}
    </div>
  );
}
