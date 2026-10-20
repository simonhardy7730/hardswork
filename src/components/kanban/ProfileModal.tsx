"use client";

import { useEffect, useState } from "react";
import { questionsFor } from "@/lib/screening";
import { whatsappLink } from "@/lib/whatsapp";
import { X, Trash2, Phone, Mail, FileText, Check, Loader2, Send, Clock } from "lucide-react";
import type { Application } from "@/lib/supabase/types";
import { useL } from "@/lib/i18n/context";
import { getCvState, requestCv, getCvUrl, type CvState } from "@/app/(dashboard)/dashboard/candidatures/actions";
import { DAYS, SLOTS } from "@/lib/candidate/availability";
import { ageFromBirthDate } from "@/lib/candidate/age";

interface Props {
  application: Application;
  hasSubscription: boolean;
  onClose: () => void;
  onNotesChange: (id: string, notes: string) => Promise<void>;
  onDelete?: (id: string) => void;
}

export default function ProfileModal({ application: app, hasSubscription, onClose, onNotesChange, onDelete }: Props) {
  const l = useL();
  const [notes, setNotes] = useState(app.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [cv, setCv] = useState<CvState | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!hasSubscription) return;
    let alive = true;
    getCvState(app.id).then((s) => { if (alive) setCv(s); }).catch(() => { if (alive) setCv({ kind: "unavailable" }); });
    return () => { alive = false; };
  }, [app.id, hasSubscription]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function saveNotes() {
    setSaving(true); setSaved(false);
    await onNotesChange(app.id, notes);
    setSaving(false); setSaved(true);
  }

  async function openCv() {
    setBusy(true); setMsg("");
    const url = await getCvUrl(app.id);
    setBusy(false);
    if (url) window.open(url, "_blank", "noopener");
    else setMsg(l("CV introuvable. Réessayez dans un instant.", "CV niet gevonden. Probeer zo opnieuw."));
  }

  async function ask() {
    setBusy(true); setMsg("");
    const r = await requestCv(app.id);
    setBusy(false);
    if (r.ok) {
      setCv({ kind: "pending", requestedAt: new Date().toISOString() });
      setMsg(r.emailed
        ? l("Demande envoyée par e-mail et visible dans son espace Wolko.", "Aanvraag verzonden per e-mail en zichtbaar in zijn Wolko-ruimte.")
        : l("Demande enregistrée : visible dans son espace Wolko.", "Aanvraag opgeslagen: zichtbaar in zijn Wolko-ruimte."));
    } else if (r.error === "no_email") {
      setMsg(l("Ce candidat n'a pas laissé d'e-mail : appelez-le pour lui demander son CV.", "Deze kandidaat liet geen e-mail achter: bel hem om naar het CV te vragen."));
    } else {
      setMsg(l("Impossible d'envoyer la demande. Réessayez.", "Aanvraag verzenden mislukt. Probeer opnieuw."));
    }
  }

  const slots = (app.availability_slots ?? []).map((k) => {
    const [d, s] = k.split(":");
    const day = DAYS.find((x) => x.key === d), slot = SLOTS.find((x) => x.key === s);
    return day && slot ? `${l(day.fr, day.nl)} · ${l(slot.fr, slot.nl)}` : null;
  }).filter(Boolean) as string[];

  const label = "text-[11px] font-black uppercase tracking-widest text-ink-300 mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-ink-100">
          <div className="min-w-0">
            <h3 className="font-display font-black uppercase text-ink text-lg leading-tight truncate">{app.applicant_name}</h3>
            {app.job_title && <p className="text-xs text-ink-500 mt-0.5 truncate">{app.job_title}</p>}
            {app.birth_date && ageFromBirthDate(app.birth_date) !== null && (
              <p className="text-xs text-ink-500 mt-0.5">{ageFromBirthDate(app.birth_date)} {l("ans", "jaar")}</p>
            )}
          </div>
          <button onClick={onClose} aria-label={l("Fermer", "Sluiten")} className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-300 hover:bg-surface-2 shrink-0">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {hasSubscription ? (
            <div className="flex flex-wrap gap-3 text-sm">
              <a href={`tel:${app.applicant_phone}`} className="flex items-center gap-1.5 text-brand font-bold hover:underline"><Phone size={14} />{app.applicant_phone}</a>
              {(() => {
                const first = app.applicant_name.trim().split(/\s+/)[0] ?? "";
                const wa = whatsappLink(app.applicant_phone, l(
                  `Bonjour ${first}, suite à votre candidature${app.job_title ? ` pour « ${app.job_title} »` : ""} sur Wolko, ...`,
                  `Hallo ${first}, naar aanleiding van je sollicitatie${app.job_title ? ` voor « ${app.job_title} »` : ""} op Wolko, ...`));
                return wa ? <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 font-bold text-emerald-700 hover:underline">💬 WhatsApp</a> : null;
              })()}
              {app.applicant_email && <a href={`mailto:${app.applicant_email}`} className="flex items-center gap-1.5 text-ink-500 hover:text-brand"><Mail size={14} />{app.applicant_email}</a>}
            </div>
          ) : (
            <p className="text-sm text-ink-500">{l("Coordonnées verrouillées : choisissez un abonnement pour les voir.", "Contactgegevens vergrendeld: kies een abonnement om ze te zien.")}</p>
          )}

          {(app.licenses?.length > 0 || app.has_caces || slots.length > 0) && (
            <div>
              <p className={label}>{l("Profil", "Profiel")}</p>
              <div className="flex flex-wrap gap-1.5">
                {app.licenses?.map((x) => <span key={x} className="text-[11px] font-black px-2 py-0.5 rounded-md bg-blue-100 text-blue-700">{x}</span>)}
                {app.caces_types?.map((x) => <span key={x} className="text-[11px] font-black px-2 py-0.5 rounded-md bg-surface border border-ink-100 text-ink-500">CACES {x}</span>)}
                {slots.map((x) => <span key={x} className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-brand">{x}</span>)}
              </div>
            </div>
          )}

          {app.screening_answers && Object.keys(app.screening_answers).length > 0 && (
            <div>
              <p className={label}>{l("Réponses de présélection", "Voorselectie-antwoorden")}</p>
              <ul className="space-y-1.5">
                {questionsFor(Object.keys(app.screening_answers)).map((q) => {
                  const yes = app.screening_answers?.[q.id] === true;
                  return (
                    <li key={q.id} className="flex items-start justify-between gap-3 text-sm bg-surface rounded-xl px-3 py-2">
                      <span className="text-ink">{l(q.fr, q.nl)}</span>
                      <span className={`shrink-0 text-xs font-black px-2 py-0.5 rounded-full ${yes ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{yes ? l("Oui", "Ja") : l("Non", "Nee")}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {app.cover_message && (
            <div>
              <p className={label}>{l("Message du candidat", "Bericht van de kandidaat")}</p>
              <p className="text-sm text-ink whitespace-pre-wrap bg-surface rounded-xl p-3">{app.cover_message}</p>
            </div>
          )}

          <div>
            <p className={label}>{l("CV", "CV")}</p>
            {!hasSubscription ? (
              <p className="text-sm text-ink-500">{l("Disponible avec un abonnement.", "Beschikbaar met een abonnement.")}</p>
            ) : cv === null ? (
              <Loader2 size={16} className="animate-spin text-ink-300" />
            ) : cv.kind === "fulfilled" ? (
              <button onClick={openCv} disabled={busy} className="flex items-center gap-2 text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 hover:bg-emerald-100 transition">
                {busy ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                {l("Voir le CV", "CV bekijken")}{cv.fileName ? ` — ${cv.fileName}` : ""}
              </button>
            ) : cv.kind === "pending" ? (
              <p className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                <Clock size={14} />{l("CV demandé : en attente du candidat.", "CV aangevraagd: wachten op de kandidaat.")}
              </p>
            ) : cv.kind === "unavailable" ? (
              <p className="text-sm text-ink-500">{l("Cette fonction sera disponible très bientôt.", "Deze functie is binnenkort beschikbaar.")}</p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-ink-500">{l("Aucun CV transmis par ce candidat.", "Deze kandidaat bezorgde geen CV.")}</p>
                <button onClick={ask} disabled={busy} className="flex items-center gap-2 text-sm font-bold bg-brand text-white rounded-xl px-3 py-2 hover:bg-brand-dark transition disabled:opacity-60">
                  {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  {l("Demander le CV au candidat", "CV opvragen bij de kandidaat")}
                </button>
              </div>
            )}
            {msg && <p className="text-xs text-ink-500 mt-2">{msg}</p>}
          </div>

          <div>
            <p className={label}>{l("Vos notes", "Jouw notities")}</p>
            <textarea
              value={notes}
              onChange={(e) => { setNotes(e.target.value); setSaved(false); }}
              rows={4}
              placeholder={l("Notes sur ce candidat...", "Notities over deze kandidaat...")}
              className="w-full px-3 py-2 text-sm border border-ink-100 rounded-xl resize-none focus:outline-none focus:border-brand"
            />
            <button onClick={saveNotes} disabled={saving} className="mt-2 flex items-center gap-1.5 text-xs font-bold text-white bg-brand px-3 py-1.5 rounded-lg hover:bg-brand-dark transition">
              {saving ? "…" : <><Check size={12} /> {saved ? l("Enregistré", "Opgeslagen") : l("Sauvegarder", "Opslaan")}</>}
            </button>
          </div>

          {app.status === "refuse" && onDelete && (
            <button onClick={() => onDelete(app.id)} className="flex items-center gap-1.5 text-xs font-bold text-red-600 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition">
              <Trash2 size={12} /> {l("Supprimer définitivement", "Definitief verwijderen")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
