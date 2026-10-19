"use client";

import { useState } from "react";
import { FileText, X } from "lucide-react";
import { useL } from "@/lib/i18n/context";

const MAX = 4 * 1024 * 1024;

export function postBody(data: unknown, cv: File | null): { body: BodyInit; headers?: Record<string, string> } {
  if (!cv) return { body: JSON.stringify(data), headers: { "Content-Type": "application/json" } };
  const fd = new FormData();
  fd.append("data", JSON.stringify(data));
  fd.append("cv", cv);
  return { body: fd };
}

/** Dépôt de CV facultatif (PDF ou Word, 4 Mo max). */
export default function CvPicker({ file, onChange }: { file: File | null; onChange: (f: File | null) => void }) {
  const l = useL();
  const [err, setErr] = useState("");

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const ext = (f.name.split(".").pop() ?? "").toLowerCase();
    if (!["pdf", "doc", "docx"].includes(ext)) return setErr(l("Format accepté : PDF ou Word.", "Toegelaten formaten: PDF of Word."));
    if (f.size > MAX) return setErr(l("Fichier trop lourd (4 Mo maximum).", "Bestand te zwaar (max. 4 MB)."));
    setErr(""); onChange(f);
  }

  return (
    <div>
      <label className="block text-sm font-medium text-ink mb-1.5">
        {l("CV", "CV")} <span className="text-ink-300 font-normal">({l("optionnel · PDF ou Word, 4 Mo max", "optioneel · PDF of Word, max. 4 MB")})</span>
      </label>
      {file ? (
        <div className="flex items-center justify-between gap-2 border border-ink-100 rounded-xl px-3 py-2.5 text-sm">
          <span className="flex items-center gap-2 min-w-0"><FileText size={15} className="text-brand shrink-0" /><span className="truncate">{file.name}</span></span>
          <button type="button" onClick={() => onChange(null)} aria-label={l("Retirer", "Verwijderen")} className="text-ink-300 hover:text-ink"><X size={15} /></button>
        </div>
      ) : (
        <label className="flex items-center justify-center gap-2 border border-dashed border-ink-100 rounded-xl px-3 py-3 text-sm text-ink-500 cursor-pointer hover:border-brand hover:text-brand transition">
          <FileText size={15} />{l("Ajouter mon CV", "Mijn CV toevoegen")}
          <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={pick} />
        </label>
      )}
      {err && <p className="text-xs text-red-600 mt-1">{err}</p>}
    </div>
  );
}
