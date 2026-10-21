"use client";

import { useState, useTransition } from "react";
import { FileText, Loader2 } from "lucide-react";
import { openPoolCv } from "@/app/(dashboard)/dashboard/candidatheque/actions";
import { useL } from "@/lib/i18n/context";

export default function PoolCvButton({ candidateId }: { candidateId: string }) {
  const l = useL();
  const [err, setErr] = useState("");
  const [pending, start] = useTransition();
  const go = () => {
    setErr("");
    // Fenêtre ouverte tout de suite (sinon bloquée sur iPhone), remplie ensuite.
    const w = window.open("about:blank", "_blank");
    start(async () => {
      const r = await openPoolCv(candidateId);
      if (r.ok) { if (w) w.location.href = r.url; else window.location.href = r.url; return; }
      w?.close();
      setErr(r.error === "quota" ? l("Limite quotidienne atteinte.", "Dagelijkse limiet bereikt.")
        : r.error === "no_access" ? l("Abonnement requis.", "Abonnement vereist.")
        : l("CV indisponible.", "Cv niet beschikbaar."));
    });
  };
  return (
    <div>
      <button type="button" onClick={go} disabled={pending}
        className="h-10 px-4 rounded-xl bg-brand text-[#101F43] font-display font-black uppercase text-xs inline-flex items-center gap-1.5 disabled:opacity-60"
        style={{ letterSpacing: "0.05em" }}>
        {pending ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />} {l("Voir le CV", "Cv bekijken")}
      </button>
      {err && <p className="text-xs text-red-600 mt-1">{err}</p>}
    </div>
  );
}
