"use client";

import { useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { useL } from "@/lib/i18n/context";

/** Droits RGPD en libre-service : export des données et suppression du compte. */
export default function DataRights() {
  const l = useL();
  const [open, setOpen] = useState(false);
  const [txt, setTxt] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function del() {
    setBusy(true); setErr("");
    const res = await fetch("/api/account/delete", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirm: "SUPPRIMER" }),
    });
    if (res.ok) { window.location.href = "/?compte=supprime"; return; }
    const j = await res.json().catch(() => ({}));
    setErr(j.error ?? l("Suppression impossible. Réessayez.", "Verwijderen mislukt. Probeer opnieuw."));
    setBusy(false);
  }

  return (
    <div className="bg-white border border-ink-100 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-ink-100">
        <p className="font-display font-black text-ink uppercase text-xs tracking-widest">{l("Mes données", "Mijn gegevens")}</p>
      </div>
      <div className="p-5 space-y-4">
        <p className="text-sm text-ink-500">
          {l("Vous pouvez télécharger une copie de vos données ou supprimer définitivement votre compte.", "Je kunt een kopie van je gegevens downloaden of je account definitief verwijderen.")}
        </p>
        <a href="/api/account/export" className="inline-flex items-center gap-2 text-sm font-semibold text-ink border border-ink-100 rounded-xl px-4 py-2.5 hover:border-brand/50 transition">
          <Download size={14} /> {l("Télécharger mes données", "Mijn gegevens downloaden")}
        </a>
        <div>
          {!open ? (
            <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 border border-red-200 rounded-xl px-4 py-2.5 hover:bg-red-50 transition">
              <Trash2 size={14} /> {l("Supprimer mon compte", "Mijn account verwijderen")}
            </button>
          ) : (
            <div className="border border-red-200 bg-red-50 rounded-xl p-4 space-y-3">
              <p className="text-sm text-red-700">
                {l("Action définitive : profil, disponibilités, documents et accès seront supprimés. Vos candidatures déjà envoyées seront anonymisées. Tapez SUPPRIMER pour confirmer.", "Definitieve actie: profiel, beschikbaarheden, documenten en toegang worden verwijderd. Reeds verstuurde sollicitaties worden geanonimiseerd. Typ SUPPRIMER om te bevestigen.")}
              </p>
              <input value={txt} onChange={(e) => setTxt(e.target.value)} className="w-full px-3 py-2.5 border border-red-200 rounded-lg text-sm bg-white" placeholder="SUPPRIMER" aria-label="SUPPRIMER" />
              {err && <p className="text-xs text-red-700">{err}</p>}
              <div className="flex gap-2">
                <button type="button" disabled={txt !== "SUPPRIMER" || busy} onClick={del} className="px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold disabled:opacity-40">
                  {busy ? "…" : l("Supprimer définitivement", "Definitief verwijderen")}
                </button>
                <button type="button" onClick={() => { setOpen(false); setTxt(""); }} className="px-4 py-2.5 rounded-xl border border-ink-100 text-sm text-ink-500">{l("Annuler", "Annuleren")}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
