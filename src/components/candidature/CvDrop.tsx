"use client";

import { useState } from "react";
import { Camera, FileUp, Loader2 } from "lucide-react";
import { useL } from "@/lib/i18n/context";
import { shrinkImage as shrink } from "@/lib/candidate/shrink-image";

/** Dépôt du CV après coup (lien personnel) : photo du CV papier ou fichier. */
export default function CvDrop({ token, compact = false }: { token: string; compact?: boolean }) {
  const l = useL();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.files?.[0];
    e.target.value = "";
    if (!raw) return;
    setErr(""); setBusy(true);
    const f = await shrink(raw);
    if (f.size > 4 * 1024 * 1024) { setBusy(false); return setErr(l("Fichier trop lourd (4 Mo maximum).", "Bestand te zwaar (max. 4 MB).")); }
    const fd = new FormData();
    fd.append("token", token);
    fd.append("cv", f);
    const r = await fetch("/api/cv-depot", { method: "POST", body: fd }).catch(() => null);
    setBusy(false);
    if (r?.ok) return setDone(true);
    const code = r ? ((await r.json().catch(() => ({}))) as { error?: string }).error : "";
    setErr(code === "file" ? l("Format accepté : photo (JPG, PNG), PDF ou Word.", "Toegelaten: foto (JPG, PNG), PDF of Word.")
      : code === "link" ? l("Ce lien a expiré.", "Deze link is verlopen.")
      : l("Envoi impossible, réessaie.", "Verzenden mislukt, probeer opnieuw."));
  }

  if (done) return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-sm font-bold text-emerald-800 text-center">
      {l("✅ CV envoyé ! L'employeur peut le voir maintenant.", "✅ Cv verzonden! De werkgever kan het nu bekijken.")}
    </div>
  );

  const btn = `h-12 rounded-xl px-4 text-sm font-black inline-flex items-center justify-center gap-2 cursor-pointer ${busy ? "opacity-60 pointer-events-none" : ""}`;
  return (
    <div className={`bg-[#101F43] rounded-2xl p-5 text-white space-y-3 text-left ${compact ? "" : "max-w-md mx-auto"}`}>
      <div>
        <p className="font-display font-black uppercase text-lg leading-tight">{l("Dernière étape : ton CV", "Laatste stap: je cv")} <span className="text-brand">📄</span></p>
        <p className="text-sm text-white/75 mt-1">{l("Les candidats avec CV sont appelés en premier. Prends simplement ton CV papier en photo.", "Kandidaten met een cv worden eerst gebeld. Neem gewoon een foto van je papieren cv.")}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className={`${btn} bg-brand text-[#101F43]`}>
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />} {l("Photo de mon CV", "Foto van mijn cv")}
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} />
        </label>
        <label className={`${btn} bg-white text-[#101F43]`}>
          <FileUp size={16} /> {l("PDF / Word / galerie", "Pdf / Word / galerij")}
          <input type="file" accept=".pdf,.doc,.docx,image/jpeg,image/png,image/webp" className="hidden" onChange={onFile} />
        </label>
      </div>
      {err && <p className="text-xs text-red-300">{err}</p>}
    </div>
  );
}
