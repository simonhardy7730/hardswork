"use client";
import PoolOptIn from "@/components/candidature/PoolOptIn";

import { useState } from "react";
import { Loader2, CheckCircle2, Info } from "lucide-react";
import CvDrop from "@/components/candidature/CvDrop";
import { useL } from "@/lib/i18n/context";
import Turnstile from "@/components/security/Turnstile";
import ScreeningFields, { screeningComplete } from "./ScreeningFields";
import { postBody } from "./CvPicker";
import CvChoice, { type CvMode } from "./CvChoice";
import { EMPTY_MINI, miniReady, type MiniInput } from "@/lib/candidate/mini-cv";
import BirthField from "./BirthField";
import { ageFromBirthDate, MIN_AGE } from "@/lib/candidate/age";
import { DAYS, SLOTS } from "@/lib/candidate/availability";

interface Prefill { first_name: string; last_name: string; phone: string; email: string; slots: string[] }
interface Props {
  jobId: string;
  orgName: string;
  flexi: boolean;
  /** Jours/plages demandés par l'offre : mis en avant dans la grille. */
  offerDays: string[];
  offerSlots: string[];
  prefill: Prefill | null;
  screeningIds?: string[];
}

const input =
  "w-full px-3 py-3 border border-ink-100 rounded-xl text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition";

/** Candidature en 3 étapes : intérêt → disponibilités → coordonnées. Aucun long formulaire. */
export default function QuickApplyForm({ jobId, orgName, flexi, offerDays, offerSlots, prefill, screeningIds = [] }: Props) {
  const l = useL();
  const [interest, setInterest] = useState(false);
  const [slots, setSlots] = useState<string[]>(prefill?.slots ?? []);
  const [f, setF] = useState({
    first_name: prefill?.first_name ?? "", last_name: prefill?.last_name ?? "",
    phone: prefill?.phone ?? "", email: prefill?.email ?? "",
  });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [cvTok, setCvTok] = useState<string | null>(null);
  const [miniDone, setMiniDone] = useState(false);
  const [cvMode, setCvMode] = useState<CvMode>("");
  const [mini, setMini] = useState<MiniInput>(EMPTY_MINI);
  const [error, setError] = useState("");
  const [poolOptIn, setPoolOptIn] = useState(false);
  const [poolCity, setPoolCity] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [cv, setCv] = useState<File | null>(null);
  const [birth, setBirth] = useState("");
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState(false);

  const toggle = (k: string) => setSlots((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));
  const wanted = (d: string, s: string) =>
    (offerDays.length === 0 || offerDays.includes(d)) && (offerSlots.length === 0 || offerSlots.includes(s));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const a = ageFromBirthDate(birth);
    if (a === null || a < MIN_AGE) { setError(l(`Il faut avoir au moins ${MIN_AGE} ans pour postuler.`, `Je moet minstens ${MIN_AGE} jaar zijn om te solliciteren.`)); return; }
    if (!interest) { setError(l("Confirmez votre intérêt pour l'offre.", "Bevestig je interesse voor het aanbod.")); return; }
    if (!screeningComplete(screeningIds, answers)) { setError(l("Répondez à toutes les questions.", "Beantwoord alle vragen.")); return; }
    if (cvMode === "") { setError(l("Réponds à la question « As-tu un CV ? ».", "Beantwoord de vraag « Heb je een cv? ».")); return; }
    if (cvMode === "file" && !cv) { setError(l("Ajoute ton CV (photo ou fichier), ou choisis « Non, pas de CV ».", "Voeg je cv toe (foto of bestand), of kies « Nee, geen cv ».")); return; }
    if (cvMode === "mini" && !miniReady(mini)) { setError(l("Indique ton dernier travail, ou coche « C'est mon premier emploi ».", "Vul je laatste job in, of vink « Dit is mijn eerste job » aan.")); return; }
    setLoading(true); setError("");
    const { body, headers } = postBody({
        mini_cv: cvMode === "mini" ? mini : null,
        job_offer_id: jobId,
        applicant_name: `${f.first_name} ${f.last_name}`.trim(),
        applicant_phone: f.phone,
        applicant_email: f.email || null,
        cover_message: msg || null,
        screening_answers: answers,
        turnstile_token: captcha,
        birth_date: birth,
        pool_optin: poolOptIn,
        pool_city: poolCity,
        availability_slots: slots,
        interest_confirmed: true,
        quick_apply: true,
      }, cv);
    const res = await fetch("/api/postuler", { method: "POST", headers, body });
    if (res.status === 409) {
      setError(l("Vous avez déjà postulé à cette offre.", "Je hebt al gesolliciteerd voor deze vacature."));
      setLoading(false);
      return;
    }
    if (!res.ok) {
      setError(l("Une erreur est survenue. Réessayez.", "Er is een fout opgetreden. Probeer opnieuw."));
      setLoading(false);
      return;
    }
    const out = (await res.json().catch(() => ({}))) as { cvToken?: string | null; miniCv?: boolean };
    setCvTok(out.cvToken ?? null);
    setMiniDone(out.miniCv === true);
    setDone(true);
  }

  if (done) {
    return (
      <div className="py-8 text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 size={32} className="text-green-600" />
        </div>
        <h3 className="text-lg font-bold text-ink">{l("Candidature envoyée ! ✅", "Sollicitatie verstuurd! ✅")}</h3>
        <p className="text-sm text-ink-500">
          {l("Votre candidature a bien été transmise.", "Je sollicitatie is goed doorgestuurd.")}
        </p>
        {cvTok && <CvDrop token={cvTok} soft={miniDone} />}
      </div>
    );
  }

  const step = "flex items-center gap-2 font-display font-black uppercase text-ink text-[13px] tracking-wide mb-3";
  const num = "w-6 h-6 rounded-full bg-brand text-white text-xs flex items-center justify-center";

  return (
    <form onSubmit={submit} className="space-y-6">
      {prefill && (
        <p className="text-xs text-ink-500 bg-surface rounded-xl p-3">
          {l("Profil Wolko détecté : vos infos et disponibilités sont préremplies.", "Wolko-profiel gevonden: je gegevens en beschikbaarheden zijn vooraf ingevuld.")}
        </p>
      )}

      <section>
        <h3 className={step}><span className={num}>1</span>{l("Votre intérêt", "Je interesse")}</h3>
        <label className="flex items-start gap-3 p-3 border border-ink-100 rounded-xl cursor-pointer">
          <input type="checkbox" checked={interest} onChange={(e) => setInterest(e.target.checked)} className="mt-0.5 w-4 h-4 accent-brand" />
          <span className="text-sm text-ink">
            {l("Cette offre m'intéresse et je souhaite être contacté(e).", "Dit aanbod interesseert me en ik wil gecontacteerd worden.")}
          </span>
        </label>
        {flexi && (
          <p className="mt-2 flex gap-2 text-xs text-ink-500">
            <Info size={13} className="shrink-0 mt-0.5 text-amber-600" />
            {l("Flexi-job : votre éligibilité sera à confirmer avec l'employeur (conditions légales belges).", "Flexi-job: je geschiktheid wordt met de werkgever bevestigd (Belgische wettelijke voorwaarden).")}
          </p>
        )}
      </section>

      <section>
        <h3 className={step}><span className={num}>2</span>{l("Vos disponibilités", "Je beschikbaarheid")}</h3>
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full text-xs border-separate border-spacing-1">
            <thead>
              <tr>
                <th />
                {DAYS.map((d) => <th key={d.key} className="font-bold text-ink-500 pb-1">{l(d.fr, d.nl)}</th>)}
              </tr>
            </thead>
            <tbody>
              {SLOTS.map((s) => (
                <tr key={s.key}>
                  <th className="text-left font-semibold text-ink-500 pr-2 whitespace-nowrap">{l(s.fr, s.nl)}</th>
                  {DAYS.map((d) => {
                    const k = `${d.key}:${s.key}`;
                    const on = slots.includes(k);
                    return (
                      <td key={k}>
                        <button type="button" onClick={() => toggle(k)} aria-pressed={on}
                          aria-label={`${l(d.frLong, d.nlLong)} ${l(s.fr, s.nl)}`}
                          className={`w-full h-9 min-w-[34px] rounded-lg border transition ${
                            on ? "bg-brand border-brand" : wanted(d.key, s.key) ? "border-amber-400 bg-amber-50" : "border-ink-100 bg-white"}`} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-ink-300 mt-1">
          {l("Cases jaunes : créneaux recherchés par l'employeur.", "Gele vakjes: uren die de werkgever zoekt.")}
        </p>
      </section>

      <section>
        <h3 className={step}><span className={num}>3</span>{l("Vos coordonnées", "Je gegevens")}</h3>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <input required className={input} value={f.first_name} autoComplete="given-name" placeholder={l("Prénom *", "Voornaam *")} onChange={(e) => setF({ ...f, first_name: e.target.value })} />
          <input required className={input} value={f.last_name} autoComplete="family-name" placeholder={l("Nom *", "Achternaam *")} onChange={(e) => setF({ ...f, last_name: e.target.value })} />
        </div>
        <input required type="tel" inputMode="tel" className={`${input} mb-3`} value={f.phone} autoComplete="tel" placeholder={l("Téléphone * (+32 4XX XX XX XX)", "Telefoon * (+32 4XX XX XX XX)")} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        <input type="email" inputMode="email" className={`${input} mb-3`} value={f.email} autoComplete="email" placeholder={l("Email (optionnel)", "E-mail (optioneel)")} onChange={(e) => setF({ ...f, email: e.target.value })} />
        <div className="mb-3"><BirthField value={birth} onChange={setBirth} /></div>
        <textarea rows={2} className={`${input} resize-none`} value={msg} maxLength={300} placeholder={l("Un mot pour l'employeur (optionnel)", "Een woordje voor de werkgever (optioneel)")} onChange={(e) => setMsg(e.target.value.slice(0, 300))} />
      </section>

      <CvChoice mode={cvMode} onMode={setCvMode} file={cv} onFile={setCv} mini={mini} onMini={setMini} />

      <PoolOptIn checked={poolOptIn} onChange={setPoolOptIn} city={poolCity} onCity={setPoolCity} />

      <ScreeningFields ids={screeningIds} value={answers} onChange={setAnswers} />

      <Turnstile onToken={setCaptcha} />

      {error && <div className="text-sm px-4 py-3 rounded-xl bg-red-50 text-red-600 border border-red-200">{error}</div>}

      <button type="submit" disabled={loading}
        className="w-full py-4 bg-brand text-white rounded-xl font-semibold text-base hover:bg-brand-dark transition disabled:opacity-60 flex items-center justify-center gap-2">
        {loading ? <Loader2 size={18} className="animate-spin" /> : l("Envoyer ma candidature", "Mijn sollicitatie versturen")}
      </button>
    </form>
  );
}
