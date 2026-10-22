"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, FileUp, PenLine, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useL } from "@/lib/i18n/context";

const OK = ["application/pdf", "image/jpeg", "image/png", "image/webp", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

/** Carte « Ajoute ton CV » : photo du CV papier, fichier, ou création gratuite sur Wolko. */
export default function CvNudge({ userId }: { userId: string }) {
  const l = useL();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setErr("");
    if (!OK.includes(file.type)) return setErr(l("Format accepté : PDF, Word ou photo (JPG, PNG).", "Toegelaten: PDF, Word of foto (JPG, PNG)."));
    if (file.size > 8 * 1024 * 1024) return setErr(l("Fichier trop lourd (8 Mo maximum).", "Bestand te zwaar (max. 8 MB)."));
    setBusy(true);
    const supabase = createClient();
    const safe = file.name.replace(/[^\w.\-]+/g, "_").slice(-80);
    const path = `${userId}/${Date.now()}_${safe}`;
    const up = await supabase.storage.from("candidate-documents").upload(path, file, { contentType: file.type });
    if (up.error) { setBusy(false); return setErr(l("Envoi impossible, réessaie.", "Verzenden mislukt, probeer opnieuw.")); }
    const ins = await supabase.from("candidate_documents").insert({ auth_user_id: userId, doc_type: "autre", label: "CV", file_path: path, file_name: file.name });
    setBusy(false);
    if (ins.error) { await supabase.storage.from("candidate-documents").remove([path]); return setErr(l("Enregistrement impossible, réessaie.", "Opslaan mislukt, probeer opnieuw.")); }
    setDone(true);
    router.refresh();
  }

  if (done) return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-sm font-bold text-emerald-800">
      {l("✅ CV ajouté ! Les employeurs peuvent maintenant le voir.", "✅ Cv toegevoegd! Werkgevers kunnen het nu bekijken.")}
    </div>
  );

  const btn = "min-h-12 py-2 rounded-xl px-4 text-sm font-body font-extrabold text-center inline-flex items-center justify-center gap-2 cursor-pointer";
  return (
    <div className="bg-[#101F43] rounded-2xl p-5 text-white space-y-3">
      <div>
        <p className="font-display font-black uppercase text-lg leading-tight">{l("Ajoute ton CV et augmente tes chances d'être contacté !", "Voeg je cv toe en vergroot je kans om gecontacteerd te worden!")}</p>
        <p className="text-sm font-body text-white/80 mt-1">{l("Une photo, un fichier ou un CV créé gratuitement sur WOLKO : choisis la méthode la plus simple pour toi.", "Een foto, een bestand of een gratis cv gemaakt op WOLKO: kies de eenvoudigste methode voor jou.")}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <label className={`${btn} bg-brand text-[#101F43] ${busy ? "opacity-60 pointer-events-none" : ""}`}>
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />} {l("Photo de mon CV", "Foto van mijn cv")}
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} />
        </label>
        <label className={`${btn} bg-white text-[#101F43] ${busy ? "opacity-60 pointer-events-none" : ""}`}>
          <FileUp size={16} /> {l("Fichier PDF / Word", "Pdf- / Word-bestand")}
          <input type="file" accept=".pdf,.doc,.docx,image/jpeg,image/png,image/webp" className="hidden" onChange={onFile} />
        </label>
        <Link href="/candidat/cv" className={`${btn} border border-white/30 text-white`}>
          <PenLine size={16} /> {l("Créer mon CV (gratuit)", "Mijn cv maken (gratis)")}
        </Link>
      </div>
      {err && <p className="text-xs text-red-300">{err}</p>}
    </div>
  );
}
