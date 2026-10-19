"use client";

import { useEffect, useState, useCallback } from "react";
import { FileText, Trash2, Upload, GraduationCap, IdCard, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type DocType = "diplome" | "permis" | "autre";
interface Doc { id: string; doc_type: DocType; label: string | null; file_path: string; file_name: string; created_at: string }

const TYPES: { id: DocType; label: string }[] = [
  { id: "diplome", label: "Diplôme" },
  { id: "permis",  label: "Permis / CACES / attestation" },
  { id: "autre",   label: "Autre document" },
];
const MAX = 8 * 1024 * 1024;
const OK = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

export default function DocumentsUpload({ userId }: { userId: string }) {
  const supabase = createClient();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [type, setType] = useState<DocType>("diplome");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("candidate_documents").select("*").order("created_at", { ascending: false });
    if (error) { setReady(false); return; }
    setDocs((data ?? []) as Doc[]);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    if (!OK.includes(file.type)) return setError("Format accepté : PDF, JPG, PNG ou WebP.");
    if (file.size > MAX) return setError("Fichier trop lourd (8 Mo maximum).");
    setBusy(true);
    const safe = file.name.replace(/[^\w.\-]+/g, "_");
    const path = `${userId}/${Date.now()}_${safe}`;
    const up = await supabase.storage.from("candidate-documents").upload(path, file, { contentType: file.type });
    if (up.error) { setBusy(false); return setError("Envoi impossible. Réessayez dans un instant."); }
    const ins = await supabase.from("candidate_documents").insert({
      auth_user_id: userId, doc_type: type, label: label.trim() || null, file_path: path, file_name: file.name,
    });
    if (ins.error) {
      await supabase.storage.from("candidate-documents").remove([path]);
      setError("Enregistrement impossible. Réessayez dans un instant.");
    } else { setLabel(""); await load(); }
    setBusy(false);
  }

  async function open(d: Doc) {
    const { data } = await supabase.storage.from("candidate-documents").createSignedUrl(d.file_path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener");
  }

  async function remove(d: Doc) {
    if (!confirm(`Supprimer « ${d.label || d.file_name} » ?`)) return;
    await supabase.storage.from("candidate-documents").remove([d.file_path]);
    await supabase.from("candidate_documents").delete().eq("id", d.id);
    load();
  }

  return (
    <div className="bg-white border border-ink-100 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-ink-100">
        <p className="font-display font-black text-ink uppercase text-xs tracking-widest">Diplômes &amp; permis</p>
        <p className="text-xs text-ink-400 mt-1">Ajoutez vos justificatifs : ils restent privés et vous seul pouvez les ouvrir.</p>
      </div>

      {!ready ? (
        <p className="px-5 py-4 text-sm text-ink-400">Cette fonction sera disponible très bientôt.</p>
      ) : (
        <>
          <div className="p-5 space-y-3 border-b border-ink-100">
            <div className="flex flex-wrap gap-2">
              {TYPES.map(t => (
                <button key={t.id} type="button" onClick={() => setType(t.id)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border transition ${type === t.id ? "bg-ink text-white border-ink" : "border-ink-100 text-ink-500 hover:border-ink-300"}`}>
                  {t.label}
                </button>
              ))}
            </div>
            <input value={label} onChange={e => setLabel(e.target.value)} maxLength={80}
              placeholder="Intitulé (ex : CAP électricien, permis CE…)"
              className="w-full border border-ink-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-ink" />
            <label className={`flex items-center justify-center gap-2 border-2 border-dashed border-ink-100 rounded-xl py-4 text-sm font-bold text-ink-500 cursor-pointer hover:border-ink-300 transition ${busy ? "opacity-60 pointer-events-none" : ""}`}>
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {busy ? "Envoi…" : "Choisir un fichier (PDF, photo — 8 Mo max)"}
              <input type="file" accept=".pdf,image/jpeg,image/png,image/webp" className="hidden" onChange={onFile} />
            </label>
            {error && <p className="text-xs text-red-700">{error}</p>}
          </div>

          <ul className="divide-y divide-ink-100">
            {docs.length === 0 && <li className="px-5 py-4 text-sm text-ink-300">Aucun document pour l’instant.</li>}
            {docs.map(d => {
              const Icon = d.doc_type === "diplome" ? GraduationCap : d.doc_type === "permis" ? IdCard : FileText;
              return (
                <li key={d.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-8 h-8 bg-surface rounded-lg flex items-center justify-center shrink-0"><Icon size={14} className="text-ink-400" /></div>
                  <button type="button" onClick={() => open(d)} className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-bold text-ink truncate">{d.label || d.file_name}</p>
                    <p className="text-[11px] text-ink-400 truncate">{TYPES.find(t => t.id === d.doc_type)?.label} · {d.file_name}</p>
                  </button>
                  <button type="button" onClick={() => remove(d)} aria-label="Supprimer" className="p-2 text-ink-300 hover:text-red-600 transition"><Trash2 size={15} /></button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
