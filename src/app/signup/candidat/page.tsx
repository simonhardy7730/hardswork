"use client";

import PasswordInput from "@/components/ui/PasswordInput";
import { useRef, useState } from "react";
import { VISIBILITY_LABEL } from "@/lib/candidate/visibility";
import { ageFromBirthDate, MIN_AGE, ADULT_AGE } from "@/lib/candidate/age";
import { friendlyAuthError } from "@/lib/auth-errors";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Loader2, ArrowRight, ArrowLeft, Check,
  MapPin, User, Mail, Lock, Phone,
  Package, Truck, HardHat, Factory, Stethoscope, ShoppingBag, UtensilsCrossed, FileText,
  Shield, Sparkles, Briefcase,
} from "lucide-react";
import { HardSworkLogo, HardieIcon } from "@/components/ui/HardieIcon";
import PreferencesFields from "@/components/candidat/PreferencesFields";
import Turnstile, { useCaptcha } from "@/components/security/Turnstile";
import { EMPTY_PREFERENCES, type Preferences } from "@/lib/candidate/preferences";
import { useLang } from "@/lib/i18n/context";
import { labels } from "@/lib/utils";
import { tradesFor, MAX_TRADES } from "@/lib/candidate/trades";
import { currentSource } from "@/lib/source";
import CvChoice, { type CvMode } from "@/components/candidature/CvChoice";
import { EMPTY_MINI, miniReady, type MiniInput } from "@/lib/candidate/mini-cv";
import { setJobAlerts } from "@/app/candidat/alertes/actions";

/* ─── Données secteurs ────────────────────────────────── */
const SECTORS_DATA = [
  {
    key: "logistique",   Icon: Package,
    photo: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&auto=format&fit=crop&q=70",
  },
  {
    key: "construction", Icon: HardHat,
    photo: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&auto=format&fit=crop&q=70",
  },
  {
    key: "industrie",    Icon: Factory,
    photo: "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=400&auto=format&fit=crop&q=70",
  },
  {
    key: "transport",    Icon: Truck,
    photo: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&auto=format&fit=crop&q=70",
  },
  {
    key: "medical",      Icon: Stethoscope,
    photo: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&auto=format&fit=crop&q=70",
  },
  {
    key: "securite",     Icon: Shield,
    photo: "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=400&auto=format&fit=crop&q=70",
  },
  {
    key: "nettoyage",    Icon: Sparkles,
    photo: "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&auto=format&fit=crop&q=70",
  },
  {
    key: "commerce",     Icon: ShoppingBag,
    photo: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&auto=format&fit=crop&q=70",
  },
  {
    key: "horeca",       Icon: UtensilsCrossed,
    photo: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&auto=format&fit=crop&q=70",
  },
  {
    key: "administratif", Icon: FileText,
    photo: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&auto=format&fit=crop&q=70",
  },
  {
    key: "autre",        Icon: Briefcase,
    photo: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400&auto=format&fit=crop&q=70",
  },
];

const LICENSES    = ["B", "C", "CE", "D"];
const CACES_TYPES = ["CACES 1", "CACES 3", "CACES 5", "CACES 6", "CACES R489"];

/* ─── Left-panel config par étape ────────────────────── */
type L = (fr: string, nl: string) => string;
function makeLeft(l: L) {
  return {
    1: {
      headline: [l("TROUVEZ", "VIND"), l("[VOTRE]", "[JE]"), l("PROCHAIN JOB.", "VOLGENDE JOB.")],
      redLine: l("[VOTRE]", "[JE]"),
      sub: l("Trouvez un job qui respecte vos compétences.", "Vind een job die je vaardigheden respecteert."),
      hardie: l("On commence par le plus important : votre expertise !", "We beginnen met het belangrijkste: jouw expertise!"),
    },
    2: {
      headline: [l("VOTRE PROFIL,", "JOUW PROFIEL,"), l("VOTRE", "JOUW"), l("[VALEUR].", "[WAARDE].")],
      redLine: l("[VALEUR].", "[WAARDE]."),
      sub: l("Plus votre profil est complet, plus vite vous serez contacté.", "Hoe completer je profiel, hoe sneller je gecontacteerd wordt."),
      hardie: l("Ces infos ne sont transmises qu'aux recruteurs auxquels vous postulez, sauf si vous choisissez d'être visible.", "Deze info gaat enkel naar werkgevers bij wie je solliciteert, tenzij je ervoor kiest zichtbaar te zijn."),
    },
    3: {
      headline: [l("PRESQUE", "BIJNA"), l("[TERMINÉ].", "[KLAAR].")],
      redLine: l("[TERMINÉ].", "[KLAAR]."),
      sub: l("Créez votre compte gratuit pour finaliser votre profil.", "Maak je gratis account aan om je profiel af te ronden."),
      hardie: l("C'est 100% gratuit pour les candidats. Toujours.", "Voor kandidaten is het 100% gratis. Altijd."),
    },
  };
}

function toggleArr<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item];
}

/** Source de la campagne (paramètres du lien d'arrivée) : conservée dans le compte pour mesurer la pub. */
function readCampaign(): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    const sp = new URLSearchParams(window.location.search);
    for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid", "ttclid"]) {
      const v = sp.get(k);
      if (v) out[k] = v.slice(0, 100);
    }
  } catch { /* sans effet */ }
  return out;
}

/* ─── Page principale ─────────────────────────────────── */
export default function CandidatSignupPage() {
  const router  = useRouter();
  const lang = useLang();
  const l: L = (fr, nl) => (lang === "nl" ? nl : fr);
  const sectorLbl = labels(lang).sector;
  const [step, setStep]     = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const submitting = useRef(false); // anti double-envoi (double clic / touche Entrée)
  const captcha = useCaptcha();
  const [error, setError]   = useState("");

  /* Étape 1 — secteurs */
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);
  const [tradeOther, setTradeOther] = useState("");

  /* Étape 2 — profil */
  const [profile, setProfile] = useState({
    city: "",
    postal_code: "",
    availability: "immediate",
    licenses: [] as string[],
    has_caces: false,
    caces_types: [] as string[],
    experience_years: "",
  });

  /* Étape 2 — types d'emploi recherchés (multi-choix, profil étudiant / flexi-job) */
  const [prefs, setPrefs] = useState<Preferences>(EMPTY_PREFERENCES);

  /* Étape 3 — compte + CV */
  const [auth, setAuth]     = useState({ full_name: "", email: "", password: "", phone: "" });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [accountExists, setAccountExists] = useState(false);
  const [cvMode, setCvMode] = useState<CvMode>("");
  const [mini, setMini] = useState<MiniInput>(EMPTY_MINI);
  const [birth, setBirth] = useState("");
  const birthAge = ageFromBirthDate(birth);
  const isAdult = birthAge !== null && birthAge >= ADULT_AGE;
  const [visible, setVisible] = useState(false); // accord facultatif, jamais pré-coché
  const [alertsOptIn, setAlertsOptIn] = useState(false); // alertes emploi : accord explicite, jamais pré-coché

  /* ── Submit final ──────────────────────────────────── */
  async function handleSubmit() {
    if (submitting.current) return;
    submitting.current = true;
    try {
      await doSubmit();
    } finally {
      submitting.current = false;
    }
  }

  async function doSubmit() {
    setError("");
    if (auth.password.length < 8) { setError(l("Choisis un mot de passe d'au moins 8 caractères.", "Kies een wachtwoord van minstens 8 tekens.")); return; }
    if (cvMode === "") { setError(l("Réponds à la question « As-tu un CV ? ».", "Beantwoord de vraag « Heb je een cv? ».")); return; }
    if (cvMode === "file" && !cvFile) { setError(l("Ajoute ton CV (photo ou fichier), ou choisis « Non, pas de CV ».", "Voeg je cv toe (foto of bestand), of kies « Nee, geen cv ».")); return; }
    if (cvMode === "mini" && !miniReady(mini)) { setError(l("Indique ton dernier travail, ou coche « C'est mon premier emploi ».", "Vul je laatste job in, of vink « Dit is mijn eerste job » aan.")); return; }
    if (birthAge === null || birthAge < MIN_AGE) {
      setError(l(`Indiquez votre date de naissance (inscription à partir de ${MIN_AGE} ans).`, `Geef je geboortedatum op (inschrijving vanaf ${MIN_AGE} jaar).`));
      return;
    }
    setLoading(true);
    const supabase = createClient();

    // 1. Créer le compte auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: auth.email,
      password: auth.password,
      options: {
        data: { full_name: auth.full_name, user_type: "candidate", lang, ...readCampaign() },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/candidat/dashboard`,
        captchaToken: captcha.token || undefined,
      },
    });
    captcha.reset();

    if (authError || !authData.user) {
      setError(friendlyAuthError(authError?.message, l));
      setLoading(false);
      return;
    }
    // E-mail déjà inscrit : Supabase renvoie un faux compte sans identité (aucune erreur). On l'envoie se connecter.
    if (Array.isArray(authData.user.identities) && authData.user.identities.length === 0) {
      setError(l("Un compte existe déjà avec cet e-mail. Connecte-toi (ou « mot de passe oublié ») pour retrouver ton profil.", "Er bestaat al een account met dit e-mailadres. Log in (of « wachtwoord vergeten ») om je profiel terug te vinden."));
      setAccountExists(true);
      setLoading(false);
      return;
    }

    // 2. CV : dépôt dans le bucket PRIVÉ (jamais de lien public), possible dès qu'une session existe.
    // Sans session (confirmation e-mail activée), le CV se dépose depuis « Mon compte » après connexion.
    if (cvFile && authData.session) {
      const okType = ["application/pdf", "image/jpeg", "image/png", "image/webp", "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(cvFile.type);
      if (okType && cvFile.size <= 8 * 1024 * 1024) {
        const safe = cvFile.name.replace(/[^\w.\-]+/g, "_").slice(-80);
        const path = `${authData.user.id}/${Date.now()}_${safe}`;
        const up = await supabase.storage.from("candidate-documents").upload(path, cvFile, { contentType: cvFile.type });
        if (!up.error) {
          await supabase.from("candidate_documents").insert({
            auth_user_id: authData.user.id, doc_type: "autre", label: "CV", file_path: path, file_name: cvFile.name,
          });
        }
      }
    }

    // 3. Créer le profil via API route (service role, bypass RLS)
    const res = await fetch("/api/signup-candidat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_user_id: authData.user.id,
        first_name: auth.full_name.split(" ")[0] ?? auth.full_name,
        last_name: auth.full_name.split(" ").slice(1).join(" ") || "-",
        phone: auth.phone,
        email: auth.email,
        city: profile.city || null,
        postal_code: profile.postal_code || null,
        availability: profile.availability,
        licenses: profile.licenses,
        has_caces: profile.has_caces,
        caces_types: profile.caces_types,
        experience_years: profile.experience_years || null,
        preferences: prefs,
        sectors: selectedSectors,
        trade_other: tradeOther,
        mini_cv: cvMode === "mini" ? mini : null,
        source: currentSource(),
        trades: selectedTrades.filter((k) => tradesFor(selectedSectors).some((t) => t.key === k)),
        visible_to_recruiters: visible && isAdult,
        birth_date: birth,
      }),
    });

    if (res.status === 409) { router.push("/candidat/dashboard"); return; }
    if (!res.ok) {
      const code = ((await res.json().catch(() => ({}))) as { error?: string }).error ?? "";
      if (res.status === 403) {
        setError(l("Un compte existe déjà avec cet e-mail. Connecte-toi pour retrouver ton profil.", "Er bestaat al een account met dit e-mailadres. Log in om je profiel terug te vinden."));
        setAccountExists(true);
      } else if (res.status === 429) {
        setError(l("Trop de tentatives depuis cette connexion. Réessaie dans une heure.", "Te veel pogingen. Probeer over een uur opnieuw."));
      } else if (code === "age") {
        setError(l(`Inscription à partir de ${MIN_AGE} ans : vérifie ta date de naissance.`, `Inschrijving vanaf ${MIN_AGE} jaar: controleer je geboortedatum.`));
      } else if (res.status === 400) {
        setError(l("Vérifie ton prénom, ton téléphone (ex : 0475 12 34 56) et ton e-mail.", "Controleer je voornaam, telefoon (bv. 0475 12 34 56) en e-mail."));
      } else {
        setError(l("Ton compte est créé mais le profil n'a pas pu être enregistré. Connecte-toi pour le terminer.", "Je account is aangemaakt maar je profiel kon niet worden opgeslagen. Log in om het af te werken."));
        setAccountExists(true);
      }
      setLoading(false);
      return;
    }

    if (alertsOptIn) await setJobAlerts(true).catch(() => null);
    router.push("/candidat/dashboard");
  }

  const left = makeLeft(l)[step];
  const inputCls = "w-full pl-9 pr-4 py-3 bg-white border border-ink-100 rounded-xl text-ink text-sm placeholder-ink-300 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition";
  const labelCls = "block text-[11px] font-bold text-ink-500 uppercase tracking-widest mb-1.5";

  return (
    <div className="flex min-h-screen font-body">

      {/* ══════════════════════════════════════════
          PANNEAU GAUCHE — 40%
      ══════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[40%] relative flex-col bg-[#101F43] overflow-hidden noise shrink-0">

        {/* Photo B&W */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900&auto=format&fit=crop&q=75"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ filter: "grayscale(1) contrast(1.05) brightness(0.7)" }}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(16,31,67,0.97) 0%, rgba(16,31,67,0.70) 40%, rgba(16,31,67,0.30) 100%)" }}
        />

        {/* Contenu */}
        <div className="relative z-10 flex flex-col h-full p-8">

          {/* Logo */}
          <HardSworkLogo size="md" dark />

          {/* Headline (pousse vers le bas) */}
          <div className="mt-auto">
            <h1
              className="font-display font-black text-white uppercase leading-none mb-5"
              style={{
                fontSize: "clamp(2.4rem, 4vw, 3.4rem)",
                letterSpacing: "-0.01em",
                textShadow: "0 2px 20px rgba(16,31,67,0.6)",
              }}
            >
              {left.headline.map((line, i) => (
                <span key={i}>
                  {line === left.redLine
                    ? <span className="text-brand">{line}</span>
                    : line}
                  <br />
                </span>
              ))}
            </h1>

            {/* Quote */}
            <p className="text-white/50 text-sm leading-relaxed max-w-xs">
              {left.sub}
            </p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          PANNEAU DROIT — 60%
      ══════════════════════════════════════════ */}
      <div className="flex-1 bg-[#FFFBF2] flex flex-col overflow-y-auto">

        {/* ── Barre de progression ──────────────── */}
        <div className="shrink-0">
          {/* Ligne rouge */}
          <div className="h-1 bg-ink-100 w-full">
            <div
              className="h-full bg-brand transition-all duration-500"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
          {/* Label étape */}
          <div className="flex items-center justify-between px-8 py-3">
            <span className="text-[11px] font-bold text-ink-300 uppercase tracking-widest">
              {l("Étape", "Stap")} {step} {l("sur", "van")} 3
            </span>
            {/* Logo mobile (hidden on lg) */}
            <Link href="/" className="lg:hidden">
              <HardSworkLogo size="sm" dark={false} />
            </Link>
            {/* Dots */}
            <div className="flex gap-1.5">
              {([1, 2, 3] as const).map(s => (
                <div key={s}
                  className={`w-2 h-2 rounded-full transition-all ${s <= step ? "bg-brand" : "bg-ink-100"}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Contenu de l'étape ────────────────── */}
        <div className="flex-1 px-8 pt-4 pb-4">

          {/* ──────── STEP 1 : Secteur ──────────── */}
          {step === 1 && (
            <div>
              <h2 className="font-display font-black text-ink uppercase mb-1"
                style={{ fontSize: "clamp(1.6rem, 3vw, 2rem)", letterSpacing: "-0.01em" }}>
                {l("Votre métier", "Jouw beroep")}
              </h2>
              <p className="text-ink-500 text-sm mb-6">{l("Sélectionnez un ou plusieurs secteurs.", "Selecteer een of meer sectoren.")}</p>

              {/* Grille secteurs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {SECTORS_DATA.map(({ key, Icon, photo }) => {
                  const label = sectorLbl[key];
                  const isSelected = selectedSectors.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedSectors(prev => toggleArr(prev, key))}
                      className={`relative rounded-xl overflow-hidden h-24 transition-all duration-200 group ${
                        isSelected
                          ? "ring-2 ring-brand scale-[1.03] shadow-md shadow-brand/20"
                          : "hover:scale-[1.02] hover:ring-2 hover:ring-brand/40 hover:shadow-sm"
                      }`}
                    >
                      {/* Photo de fond */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo} alt={label}
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ filter: `brightness(${isSelected ? 0.65 : 0.55})` }}
                      />
                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#101F43]/90 via-transparent to-transparent" />

                      {/* Check */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-brand rounded-full flex items-center justify-center shadow-md">
                          <Check size={10} className="text-white" />
                        </div>
                      )}

                      {/* Icône + Label */}
                      <div className="absolute bottom-0 left-0 right-0 p-2 text-center">
                        <Icon size={14} className={`mx-auto mb-1 ${isSelected ? "text-brand" : "text-white/60"}`} />
                        <p className="text-white text-[11px] font-black uppercase tracking-wide leading-tight">
                          {label}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Métier précis : c'est ce que les employeurs recherchent dans la candidathèque */}
              {selectedSectors.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm font-bold text-ink mb-1">{l("Votre métier précis", "Jouw precieze beroep")} <span className="font-normal text-ink-400">{l(`(jusqu'à ${MAX_TRADES})`, `(max. ${MAX_TRADES})`)}</span></p>
                  <p className="text-xs text-ink-500 mb-3">{l("Les employeurs vous trouvent par métier, même s'il n'y a pas d'annonce pour vous aujourd'hui.", "Werkgevers vinden je op beroep, ook als er vandaag geen vacature voor je is.")}</p>
                  <div className="flex flex-wrap gap-2">
                    {tradesFor(selectedSectors).map((t) => {
                      const on = selectedTrades.includes(t.key);
                      const full = !on && selectedTrades.length >= MAX_TRADES;
                      return (
                        <button key={t.key} type="button" disabled={full}
                          onClick={() => setSelectedTrades((prev) => on ? prev.filter((x) => x !== t.key) : [...prev, t.key])}
                          className={`px-3 py-2 rounded-full text-xs font-bold border transition ${on ? "bg-brand border-brand text-[#101F43]" : "bg-white border-ink-100 text-ink-500 hover:border-brand"} ${full ? "opacity-40" : ""}`}>
                          {on && <Check size={11} className="inline mr-1 -mt-0.5" />}{lang === "nl" ? t.nl : t.fr}
                        </button>
                      );
                    })}
                  </div>
                  <input value={tradeOther} onChange={(e) => setTradeOther(e.target.value)} maxLength={60}
                    placeholder={l("Autre métier, s'il n'est pas dans la liste (facultatif)", "Ander beroep, als het niet in de lijst staat (optioneel)")}
                    className="mt-3 w-full h-11 px-4 bg-white border border-ink-100 rounded-xl text-sm placeholder-ink-300 focus:outline-none focus:border-brand" />
                </div>
              )}
            </div>
          )}

          {/* ──────── STEP 2 : Profil ──────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display font-black text-ink uppercase mb-1"
                  style={{ fontSize: "clamp(1.6rem, 3vw, 2rem)", letterSpacing: "-0.01em" }}>
                  {l("Votre profil", "Jouw profiel")}
                </h2>
                <p className="text-ink-500 text-sm">{l("Ces infos ne sont transmises qu'aux recruteurs auxquels vous postulez, sauf si vous choisissez d'être visible.", "Deze info gaat enkel naar werkgevers bij wie je solliciteert, tenzij je ervoor kiest zichtbaar te zijn.")}</p>
              </div>

              {/* Localisation : ville + code postal */}
              <div className="grid grid-cols-[1fr_120px] gap-3">
                <div>
                  <label className={labelCls}>{l("Ville", "Stad")}</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
                    <input type="text" autoComplete="address-level2" placeholder={l("Ex : Tournai", "Bv. Gent")}
                      value={profile.city}
                      onChange={e => setProfile(p => ({ ...p, city: e.target.value }))}
                      className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{l("Code postal", "Postcode")}</label>
                  <input type="text" inputMode="numeric" autoComplete="postal-code" placeholder="7500"
                    maxLength={5} pattern="\d{4,5}"
                    value={profile.postal_code}
                    onChange={e => setProfile(p => ({ ...p, postal_code: e.target.value.replace(/\D/g, "") }))}
                    className={inputCls.replace("pl-9", "pl-3")} />
                </div>
              </div>

              {/* Disponibilité */}
              <div>
                <label className={labelCls}>{l("Disponibilité", "Beschikbaarheid")}</label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: "immediate", label: l("Immédiatement", "Onmiddellijk") },
                    { value: "1_semaine", label: l("Dans 1 semaine", "Binnen 1 week") },
                    { value: "1_mois",    label: l("Dans 1 mois", "Binnen 1 maand") },
                  ].map(({ value, label }) => (
                    <button key={value} type="button"
                      onClick={() => setProfile(p => ({ ...p, availability: value }))}
                      className={`px-4 py-2 rounded-lg text-xs font-bold border transition ${
                        profile.availability === value
                          ? "bg-brand text-white border-brand"
                          : "bg-white text-ink-500 border-ink-100 hover:border-brand/50"
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Expérience */}
              <div>
                <label className={labelCls}>{l("Expérience", "Ervaring")}</label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: "0", label: l("Débutant", "Starter") },
                    { value: "1", label: l("1 an", "1 jaar") },
                    { value: "2", label: l("2–4 ans", "2–4 jaar") },
                    { value: "5", label: l("5–9 ans", "5–9 jaar") },
                    { value: "10", label: l("10 ans+", "10+ jaar") },
                  ].map(({ value, label }) => (
                    <button key={value} type="button"
                      onClick={() => setProfile(p => ({ ...p, experience_years: value }))}
                      className={`px-4 py-2 rounded-lg text-xs font-bold border transition ${
                        profile.experience_years === value
                          ? "bg-brand text-white border-brand"
                          : "bg-white text-ink-500 border-ink-100 hover:border-brand/50"
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Permis */}
              <div>
                <label className={labelCls}>{l("Permis de conduire", "Rijbewijs")}</label>
                <div className="flex gap-2">
                  {LICENSES.map(lic => (
                    <button key={lic} type="button"
                      onClick={() => setProfile(p => ({ ...p, licenses: toggleArr(p.licenses, lic) }))}
                      className={`w-14 py-2 rounded-lg text-xs font-bold border transition ${
                        profile.licenses.includes(lic)
                          ? "bg-brand text-white border-brand"
                          : "bg-white text-ink-500 border-ink-100 hover:border-brand/50"
                      }`}>
                      {lic}
                    </button>
                  ))}
                </div>
              </div>

              {/* CACES */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <label className={labelCls + " mb-0"}>CACES</label>
                  <button type="button"
                    onClick={() => setProfile(p => ({ ...p, has_caces: !p.has_caces, caces_types: [] }))}
                    className={`w-10 h-5 rounded-full transition-all relative shrink-0 ${profile.has_caces ? "bg-brand" : "bg-ink-100"}`}>
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${profile.has_caces ? "left-5" : "left-0.5"}`} />
                  </button>
                </div>
                {profile.has_caces && (
                  <div className="flex gap-2 flex-wrap">
                    {CACES_TYPES.map(c => (
                      <button key={c} type="button"
                        onClick={() => setProfile(p => ({ ...p, caces_types: toggleArr(p.caces_types, c) }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                          profile.caces_types.includes(c)
                            ? "bg-brand text-white border-brand"
                            : "bg-white text-ink-500 border-ink-100 hover:border-brand/50"
                        }`}>
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <PreferencesFields value={prefs} onChange={setPrefs} />
            </div>
          )}

          {/* ──────── STEP 3 : Compte + CV ─────── */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-display font-black text-ink uppercase mb-1"
                  style={{ fontSize: "clamp(1.6rem, 3vw, 2rem)", letterSpacing: "-0.01em" }}>
                  {l("Votre compte", "Jouw account")}
                </h2>
                <p className="text-ink-500 text-sm">{l("100% gratuit · Trouvez votre prochain job", "100% gratis · Vind je volgende job")}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>{l("Nom complet", "Volledige naam")}</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
                    <input value={auth.full_name}
                      onChange={e => setAuth(p => ({ ...p, full_name: e.target.value }))}
                      placeholder="Jean Dubois"
                      required className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{l("Téléphone", "Telefoon")}</label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
                    <input value={auth.phone}
                      onChange={e => setAuth(p => ({ ...p, phone: e.target.value }))}
                      placeholder="+32 475 000 000" type="tel" className={inputCls} />
                  </div>
                </div>
              </div>
              <div>
                <label className={labelCls}>{l("Date de naissance", "Geboortedatum")}</label>
                <input type="date" value={birth} onChange={e => { setBirth(e.target.value); if (ageFromBirthDate(e.target.value) !== null && (ageFromBirthDate(e.target.value) ?? 0) < ADULT_AGE) setVisible(false); }}
                  max={new Date().toISOString().slice(0, 10)} required className={inputCls.replace(/pl-\d+/, "pl-3")} />
                {birth && (birthAge === null || birthAge < MIN_AGE) && (
                  <p className="text-xs text-red-600 mt-1">{l(`Inscription possible à partir de ${MIN_AGE} ans.`, `Inschrijven kan vanaf ${MIN_AGE} jaar.`)}</p>
                )}
              </div>

              <div>
                <label className={labelCls}>{l("Email", "E-mail")}</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
                  <input value={auth.email}
                    onChange={e => setAuth(p => ({ ...p, email: e.target.value }))}
                    placeholder={l("vous@exemple.be", "jij@voorbeeld.be")} type="email" required className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>{l("Mot de passe", "Wachtwoord")}</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
                  <PasswordInput value={auth.password}
                    onChange={e => setAuth(p => ({ ...p, password: e.target.value }))}
                    placeholder={l("Minimum 8 caractères", "Minimum 8 tekens")} minLength={8}
                    required className={inputCls} />
                </div>
              </div>

              {/* CV : « As-tu un CV ? » — Oui : photo / fichier ; Non : 3 questions → CV Wolko */}
              <div>
                <CvChoice mode={cvMode} onMode={setCvMode} file={cvFile} onFile={setCvFile} mini={mini} onMini={setMini} />
                <p className="text-xs text-ink-400 mt-2">
                  {l("Vos diplômes et permis ? Vous pourrez les ajouter depuis votre compte, une fois inscrit.", "Je diploma's en rijbewijzen? Je kunt ze toevoegen vanuit je account, zodra je ingeschreven bent.")}
                </p>
              </div>

              {isAdult && <label className="flex items-start gap-3 cursor-pointer bg-white border border-ink-100 rounded-xl p-3">
                <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#101F43]" />
                <span className="text-xs text-ink-700 leading-relaxed">
                  {VISIBILITY_LABEL[lang === "nl" ? "nl" : "fr"]}{" "}
                  <span className="text-ink-400">{l("(facultatif)", "(optioneel)")}</span>
                </span>
              </label>}

              <label className="flex items-start gap-3 cursor-pointer bg-white border border-ink-100 rounded-xl p-3">
                <input type="checkbox" checked={alertsOptIn} onChange={(e) => setAlertsOptIn(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#101F43]" />
                <span className="text-xs text-ink-700 leading-relaxed">
                  {l("Prévenez-moi par e-mail dès qu'une offre correspond à mon profil, près de chez moi (jusqu'à 30 km).", "Verwittig me per e-mail zodra een vacature bij mijn profiel past, in mijn buurt (tot 30 km).")}{" "}
                  <span className="text-ink-400">{l("(facultatif, désinscription en un clic)", "(optioneel, met één klik uitschrijven)")}</span>
                </span>
              </label>

              {error && (
                <div className="text-sm px-4 py-3 rounded-xl bg-red-50 text-red-600 border border-red-200">
                  {error}
                  {accountExists && (
                    <Link href="/login" className="mt-2 flex h-10 items-center justify-center rounded-lg bg-[#101F43] text-white font-bold">
                      {l("Me connecter", "Inloggen")}
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Bas de page : Hardie + bouton ────── */}
        <div className="shrink-0 px-8 pb-6 pt-3 border-t border-ink-100 bg-[#FFFBF2]">
          {/* Hardie + bulle */}
          <div className="flex items-center gap-3 mb-4">
            <div className="shrink-0">
              <HardieIcon size={44} />
            </div>
            <div className="bg-white border border-ink-100 rounded-xl rounded-bl-none px-4 py-2.5 shadow-sm relative">
              <p className="text-xs text-ink-700 font-medium leading-snug">
                {left.hardie}
              </p>
              {/* Triangle */}
              <div className="absolute -left-2 bottom-3 w-0 h-0"
                style={{ borderTop: "6px solid transparent", borderBottom: "6px solid transparent", borderRight: "8px solid #EADFC4" }} />
              <div className="absolute -left-1.5 bottom-3 w-0 h-0"
                style={{ borderTop: "6px solid transparent", borderBottom: "6px solid transparent", borderRight: "8px solid white" }} />
            </div>
          </div>

          {step === 3 && <div className="mb-4"><Turnstile onToken={captcha.setToken} resetKey={captcha.resetKey} /></div>}

          {/* Navigation */}
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button onClick={() => setStep(s => (s - 1) as 1 | 2 | 3)}
                className="flex items-center gap-1.5 text-ink-500 hover:text-ink font-semibold text-sm transition shrink-0">
                <ArrowLeft size={14} />
                {l("Retour", "Terug")}
              </button>
            )}

            {step < 3 ? (
              <button
                onClick={() => {
                  if (step === 1 && selectedSectors.length === 0) {
                    setError(l("Sélectionnez au moins un secteur.", "Selecteer minstens één sector."));
                    return;
                  }
                  setError("");
                  setStep(s => (s + 1) as 2 | 3);
                }}
                className="flex-1 flex items-center justify-center gap-2 font-display font-black uppercase tracking-wide text-white bg-brand hover:bg-brand-dark transition h-14 rounded-xl text-lg"
                style={{ letterSpacing: "0.05em" }}
              >
                {l("Continuer", "Verder")}
                <ArrowRight size={18} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 font-display font-black uppercase tracking-wide text-white bg-brand hover:bg-brand-dark transition h-14 rounded-xl text-lg disabled:opacity-60"
                style={{ letterSpacing: "0.05em" }}
              >
                {loading
                  ? <Loader2 size={20} className="animate-spin" />
                  : <>{l("Créer mon profil", "Mijn profiel aanmaken")} <ArrowRight size={18} /></>
                }
              </button>
            )}
          </div>

          {step === 1 && (
            <p className="text-center text-ink-300 text-xs mt-3">
              {l("Vous êtes recruteur ?", "Ben je werkgever?")}{" "}
              <Link href="/signup" className="text-brand hover:text-brand-dark font-semibold transition-colors">
                {l("Créer un compte recruteur", "Een werkgeversaccount aanmaken")}
              </Link>
            </p>
          )}

          {error && step !== 3 && (
            <p className="text-red-600 text-xs mt-2 text-center">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
