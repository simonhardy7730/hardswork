"use client";

import { useState, useTransition } from "react";
import { remindMissingCvs } from "@/app/admin/stats/actions";

export default function RemindCvButton({ missing }: { missing: number }) {
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  return (
    <div className="bg-white border border-ink-100 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="font-bold text-[#101F43]">Relancer les CV manquants</p>
        <p className="text-sm text-ink-500">{missing} candidature(s) des 45 derniers jours sans CV ni relance. Chaque personne reçoit 1 seul e-mail avec un lien pour ajouter son CV en photo, sans compte.</p>
        {msg && <p className="text-sm font-bold text-emerald-700 mt-1">{msg}</p>}
      </div>
      <button type="button" disabled={pending || missing === 0}
        onClick={() => start(async () => {
          const r = await remindMissingCvs();
          setMsg(r.ok ? `✅ ${r.sent} e-mail(s) envoyé(s)${r.left ? ` · ${r.left} restant(s) : reclique demain (limite 100/jour)` : ""}${r.errors ? ` · ${r.errors} erreur(s)` : ""}` : "Accès refusé");
        })}
        className="h-11 px-5 rounded-xl bg-[#101F43] text-white text-sm font-black disabled:opacity-50">
        {pending ? "Envoi…" : "Envoyer les relances"}
      </button>
    </div>
  );
}
