"use client";

import { useState } from "react";
import { FileText, X } from "lucide-react";
import { useL } from "@/lib/i18n/context";
import { shrinkImage } from "@/lib/candidate/shrink-image";

const MAX = 4 * 1024 * 1024;

export function postBody(data: unknown, cv: File | null): { body: BodyInit; headers?: Record<string, string> } {
  if (!cv) return { body: JSON.stringify(data), headers: { "Content-Type": "application/json" } };
  const fd = new FormData();
  fd.append("data", JSON.stringify(data));
  fd.append("cv", cv);
  return { body: fd };
}

/** Dépôt de CV facultatif (PDF, Word, JPG ou PNG, 4 Mo max). */
export default function CvPicker({ file, onChange }: { file: File | null; onChange: (f: File | null) => void }) {
  const l = useL();
  const [err, setErr] = useState("");

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.files?.[0];
    const f = raw ? await shrinkImage(raw) : undefined;
    e.target.value = "";
    if (!f) return;
    const ext = (f.name.split(".").pop() ?? "").toLowerCase();
    if (!["pdf", "doc", "docx", "jpg", "jpeg", "png"].includes(ext) && !f.type.startsWith("image/jpeg") && !f.type.startsWith("image/png")) return setErr(l("Format accepté : PDF, Word, JPG ou PNG.", "Toegelaten formaten: PDF, Word, JPG of PNG."));
    if (f.size > MAX) return setErr(l("Fichier trop lourd (4 Mo maximum).", "Bestand te zwaar (max. 4 MB)."));
    setErr(""); onChange(f);
  }

  return (
    <div>
      <label className="block text-sm font-medium text-ink mb-1.5">
        {l("CV", "CV")} <span className="text-emerald-700 font-bold text-xs">{l("· recommandé", "· aanbevolen")}</span>
      </label>
      <p className="text-xs text-ink-500 mb-2">{l("Les employeurs appellent d'abord les candidats avec CV. Pas de fichier ? Prends ton CV papier en photo 📸", "Werkgevers bellen eerst kandidaten met een cv. Geen bestand? Neem een foto van je papieren cv 📸")}</p>
      {file ? (
        <div className="flex items-center justify-between gap-2 border border-ink-100 rounded-xl px-3 py-2.5 text-sm">
          <span className="flex items-center gap-2 min-w-0"><FileText size={15} className="text-brand shrink-0" /><span className="truncate">{file.name}</span></span>
          <button type="button" onClick={() => onChange(null)} aria-label={l("Retirer", "Verwijderen")} className="text-ink-300 hover:text-ink"><X size={15} /></button>
        </div>
      ) : (
        <label className="flex items-center justify-center gap-2 border-2 border-dashed border-brand/60 bg-brand/5 rounded-xl px-3 py-3.5 text-sm font-bold text-ink cursor-pointer hover:border-brand hover:text-brand transition">
          <FileText size={15} />{l("Ajouter mon CV (PDF, Word ou photo)", "Mijn cv toevoegen (pdf, Word of foto)")}
          <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="hidden" onChange={pick} />
        </label>
      )}
      {err && <p className="text-xs text-red-600 mt-1">{err}</p>}
    </div>
  );
}
