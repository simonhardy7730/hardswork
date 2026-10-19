"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Upload, Loader2, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useL } from "@/lib/i18n/context";
import { fulfillCvRequest } from "@/app/candidat/dashboard/actions";

export interface CvRequestRow { id: string; org_name: string; job_title: string; status: "pending" | "fulfilled"; cv_name: string | null }

const MAX = 8 * 1024 * 1024;
const OK = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

export default function CvRequests({ userId, requests }: { userId: string; requests: CvRequestRow[] }) {
  const l = useL();
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function onFile(r: CvRequestRow, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    if (!OK.includes(file.type)) return setError(l("Format accepté : PDF, JPG, PNG ou WebP.", "Toegelaten formaten: PDF, JPG, PNG of WebP."));
    if (file.size > MAX) return setError(l("Fichier trop lourd (8 Mo maximum).", "Bestand te zwaar (max. 8 MB)."));
    setBusy(r.id);
    const supabase = createClient();
    const path = `${userId}/cv_${Date.now()}_${file.name.replace(/[^\w.\-]+/g, "_")}`;
    const up = await supabase.storage.from("candidate-documents").upload(path, file, { contentType: file.type });
    if (up.error) { setBusy(""); return setError(l("Envoi impossible. Réessayez dans un instant.", "Verzenden mislukt. Probeer zo opnieuw.")); }
    const res = await fulfillCvRequest(r.id, path, file.name);
    setBusy("");
    if (!res.ok) {
      await supabase.storage.from("candidate-documents").remove([path]);
      return setError(l("Enregistrement impossible. Réessayez dans un instant.", "Opslaan mislukt. Probeer zo opnieuw."));
    }
    router.refresh();
  }

  const pending = requests.filter((r) => r.status === "pending");
  if (requests.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
      <p className="font-display font-black uppercase text-xs tracking-widest text-ink">
        {pending.length > 0
          ? l(`📄 ${pending.length} demande${pending.length > 1 ? "s" : ""} de CV`, `📄 ${pending.length} CV-aanvra${pending.length > 1 ? "gen" : "ag"}`)
          : l("CV envoyés", "Verzonden CV's")}
      </p>
      {requests.map((r) => (
        <div key={r.id} className="bg-white border border-ink-100 rounded-xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <p className="text-sm font-bold text-ink truncate">{r.org_name}</p>
            <p className="text-xs text-ink-500 truncate">{l("Offre :", "Vacature:")} {r.job_title}</p>
          </div>
          {r.status === "fulfilled" ? (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700"><CheckCircle2 size={14} />{l("CV envoyé", "CV verzonden")}{r.cv_name ? ` · ${r.cv_name}` : ""}</span>
          ) : (
            <label className="flex items-center gap-2 text-sm font-bold bg-brand text-white rounded-xl px-3 py-2 cursor-pointer hover:bg-brand-dark transition">
              {busy === r.id ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {l("Déposer mon CV", "Mijn CV uploaden")}
              <input type="file" accept=".pdf,image/jpeg,image/png,image/webp" className="hidden" disabled={busy !== ""} onChange={(e) => onFile(r, e)} />
            </label>
          )}
        </div>
      ))}
      {pending.length > 0 && <p className="text-[11px] text-ink-500 flex items-center gap-1"><FileText size={11} />{l("Seule l'entreprise qui vous le demande pourra ouvrir ce CV.", "Alleen het bedrijf dat erom vraagt kan dit CV openen.")}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
