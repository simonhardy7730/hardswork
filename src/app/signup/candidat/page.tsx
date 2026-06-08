"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Loader2, ArrowRight, ArrowLeft, Upload, Check,
  MapPin, User, Mail, Lock, Phone,
  Package, Truck, HardHat, Factory, Stethoscope,
  Shield, Sparkles, Briefcase,
} from "lucide-react";
import { HardSworkLogo, HardieIcon } from "@/components/ui/HardieIcon";

/* ─── Données secteurs ────────────────────────────────── */
const SECTORS_DATA = [
  {
    key: "logistique",   label: "Logistique",  Icon: Package,
    photo: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&auto=format&fit=crop&q=70",
  },
  {
    key: "construction", label: "Construction", Icon: HardHat,
    photo: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&auto=format&fit=crop&q=70",
  },
  {
    key: "industrie",    label: "Industrie",   Icon: Factory,
    photo: "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=400&auto=format&fit=crop&q=70",
  },
  {
    key: "transport",    label: "Transport",   Icon: Truck,
    photo: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&auto=format&fit=crop&q=70",
  },
  {
    key: "medical",      label: "Médical",     Icon: Stethoscope,
    photo: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&auto=format&fit=crop&q=70",
  },
  {
    key: "securite",     label: "Sécurité",    Icon: Shield,
    photo: "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=400&auto=format&fit=crop&q=70",
  },
  {
    key: "nettoyage",    label: "Nettoyage",   Icon: Sparkles,
    photo: "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&auto=format&fit=crop&q=70",
  },
  {
    key: "autre",        label: "Autre",       Icon: Briefcase,
    photo: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400&auto=format&fit=crop&q=70",
  },
];

const LICENSES    = ["B", "C", "CE"];
const CACES_TYPES = ["CACES 1", "CACES 3", "CACES 5", "CACES 6", "CACES R489"];
const CITIES      = ["Liège", "Charleroi", "Namur", "Mons", "Bruxelles", "Bruges", "Gand", "Anvers", "Autre"];

/* ─── Left-panel config par étape ────────────────────── */
const LEFT = {
  1: {
    headline: ["REJOIGNEZ LA", "[FORCE]", "DU TERRAIN."],
    redLine: "[FORCE]",
    sub: "Trouvez un job qui respecte vos compétences.",
    hardie: "On commence par le plus important : votre expertise !",
  },
  2: {
    headline: ["VOTRE PROFIL,", "VOTRE", "[VALEUR]."],
    redLine: "[VALEUR]",
    sub: "Plus votre profil est complet, plus vite vous serez contacté.",
    hardie: "Ces infos sont visibles par les recruteurs abonnés.",
  },
  3: {
    headline: ["PRESQUE", "[TERMINÉ]."],
    redLine: "[TERMINÉ]",
    sub: "Créez votre compte gratuit pour finaliser votre profil.",
    hardie: "C'est 100% gratuit pour les candidats. Toujours.",
  },
};

function toggleArr<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item];
}

/* ─── Page principale ─────────────────────────────────── */
export default function CandidatSignupPage() {
  const router  = useRouter();
  const [step, setStep]     = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  /* Étape 1 — secteurs */
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);

  /* Étape 2 — profil */
  const [profile, setProfile] = useState({
    city: "",
    region: "wallonie",
    availability: "immediate",
    licenses: [] as string[],
    has_caces: false,
    caces_types: [] as string[],
    experience_years: "",
  });

  /* Étape 3 — compte + CV */
  const [auth, setAuth]     = useState({ full_name: "", email: "", password: "", phone: "" });
  const [cvFile, setCvFile] = useState<File | null>(null);

  /* ── Submit final ──────────────────────────────────── */
  async function handleSubmit() {
    setLoading(true);
    setError("");
    const supabase = createClient();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: auth.email,
      password: auth.password,
      options: {
        data: { full_name: auth.full_name, user_type: "candidate" },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError || !authData.user) {
      setError(authError?.message ?? "Erreur lors de l'inscription.");
      setLoading(false);
      return;
    }

    let cvUrl: string | null = null;
    if (cvFile) {
      const ext = cvFile.name.split(".").pop();
      const path = `cvs/${authData.user.id}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("candidate-cvs")
        .upload(path, cvFile, { upsert: true });
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from("candidate-cvs").getPublicUrl(path);
        cvUrl = urlData.publicUrl;
      }
    }

    const { error: candidateError } = await supabase.from("candidates").insert({
      auth_user_id: authData.user.id,
      first_name: auth.full_name.split(" ")[0] ?? auth.full_name,
      last_name: auth.full_name.split(" ").slice(1).join(" ") || "-",
      phone: auth.phone,
      email: auth.email,
      city: profile.city || null,
      region: (profile.region as "wallonie" | "bruxelles" | "flandre") || null,
      availability: profile.availability as "immediate" | "1_semaine" | "1_mois",
      licenses: profile.licenses,
      has_caces: profile.has_caces,
      caces_types: profile.caces_types,
      experience_years: profile.experience_years ? parseInt(profile.experience_years) : null,
      sectors: selectedSectors,
      notes: cvUrl ?? null,
      status: "actif",
      organization_id: null,
    });

    if (candidateError) {
      setError("Erreur lors de la création du profil. Réessayez ou contactez le support.");
      setLoading(false);
      return;
    }

    router.push("/candidat/dashboard");
  }

  const left = LEFT[step];
  const inputCls = "w-full pl-9 pr-4 py-3 bg-white border border-ink-100 rounded-xl text-ink text-sm placeholder-ink-300 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition";
  const labelCls = "block text-[11px] font-bold text-ink-500 uppercase tracking-widest mb-1.5";

  return (
    <div className="flex min-h-screen font-body">

      {/* ══════════════════════════════════════════
          PANNEAU GAUCHE — 40%
      ══════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[40%] relative flex-col bg-[#0F0E0D] overflow-hidden noise shrink-0">

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
          style={{ background: "linear-gradient(to top, rgba(15,14,13,0.97) 0%, rgba(15,14,13,0.70) 40%, rgba(15,14,13,0.30) 100%)" }}
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
                textShadow: "0 2px 20px rgba(15,14,13,0.6)",
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
      <div className="flex-1 bg-[#FAFAF8] flex flex-col overflow-y-auto">

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
              Étape {step} sur 3
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
                Votre métier
              </h2>
              <p className="text-ink-500 text-sm mb-6">Sélectionnez un ou plusieurs secteurs.</p>

              {/* Grille secteurs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {SECTORS_DATA.map(({ key, label, Icon, photo }) => {
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
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0F0E0D]/90 via-transparent to-transparent" />

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
            </div>
          )}

          {/* ──────── STEP 2 : Profil ──────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display font-black text-ink uppercase mb-1"
                  style={{ fontSize: "clamp(1.6rem, 3vw, 2rem)", letterSpacing: "-0.01em" }}>
                  Votre profil
                </h2>
                <p className="text-ink-500 text-sm">Ces infos sont visibles par les recruteurs.</p>
              </div>

              {/* Localisation */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Ville</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
                    <select value={profile.city}
                      onChange={e => setProfile(p => ({ ...p, city: e.target.value }))}
                      className={inputCls + " appearance-none"}>
                      <option value="">Ville...</option>
                      {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Région</label>
                  <select value={profile.region}
                    onChange={e => setProfile(p => ({ ...p, region: e.target.value }))}
                    className="w-full px-3 py-3 bg-white border border-ink-100 rounded-xl text-ink text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition appearance-none">
                    <option value="wallonie">Wallonie</option>
                    <option value="bruxelles">Bruxelles</option>
                    <option value="flandre">Flandre</option>
                  </select>
                </div>
              </div>

              {/* Disponibilité */}
              <div>
                <label className={labelCls}>Disponibilité</label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: "immediate", label: "Immédiatement" },
                    { value: "1_semaine", label: "Dans 1 semaine" },
                    { value: "1_mois",    label: "Dans 1 mois" },
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
                <label className={labelCls}>Expérience</label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: "0", label: "Débutant" },
                    { value: "1", label: "1 an" },
                    { value: "2", label: "2–4 ans" },
                    { value: "5", label: "5–9 ans" },
                    { value: "10", label: "10 ans+" },
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
                <label className={labelCls}>Permis de conduire</label>
                <div className="flex gap-2">
                  {LICENSES.map(l => (
                    <button key={l} type="button"
                      onClick={() => setProfile(p => ({ ...p, licenses: toggleArr(p.licenses, l) }))}
                      className={`w-14 py-2 rounded-lg text-xs font-bold border transition ${
                        profile.licenses.includes(l)
                          ? "bg-brand text-white border-brand"
                          : "bg-white text-ink-500 border-ink-100 hover:border-brand/50"
                      }`}>
                      {l}
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
            </div>
          )}

          {/* ──────── STEP 3 : Compte + CV ─────── */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-display font-black text-ink uppercase mb-1"
                  style={{ fontSize: "clamp(1.6rem, 3vw, 2rem)", letterSpacing: "-0.01em" }}>
                  Votre compte
                </h2>
                <p className="text-ink-500 text-sm">100% gratuit · Trouvez un job en Belgique</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Nom complet</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
                    <input value={auth.full_name}
                      onChange={e => setAuth(p => ({ ...p, full_name: e.target.value }))}
                      placeholder="Jean Dubois"
                      required className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Téléphone</label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
                    <input value={auth.phone}
                      onChange={e => setAuth(p => ({ ...p, phone: e.target.value }))}
                      placeholder="+32 475 000 000" type="tel" className={inputCls} />
                  </div>
                </div>
              </div>

              <div>
                <label className={labelCls}>Email</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
                  <input value={auth.email}
                    onChange={e => setAuth(p => ({ ...p, email: e.target.value }))}
                    placeholder="vous@exemple.be" type="email" required className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Mot de passe</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
                  <input value={auth.password}
                    onChange={e => setAuth(p => ({ ...p, password: e.target.value }))}
                    placeholder="Minimum 8 caractères" type="password" minLength={8}
                    required className={inputCls} />
                </div>
              </div>

              {/* Upload CV */}
              <div>
                <label className={labelCls}>CV (optionnel)</label>
                <label className={`block border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition ${
                  cvFile
                    ? "border-brand bg-brand/5"
                    : "border-ink-100 hover:border-brand/40 hover:bg-surface-2"
                }`}>
                  <input type="file" accept=".pdf,.doc,.docx" className="hidden"
                    onChange={e => setCvFile(e.target.files?.[0] ?? null)} />
                  {cvFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-2xl">📄</span>
                      <div className="text-left">
                        <p className="text-sm font-bold text-brand">{cvFile.name}</p>
                        <p className="text-xs text-ink-300">{(cvFile.size / 1024).toFixed(0)} KB · Cliquez pour changer</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <Upload size={18} className="text-ink-300" />
                      <div className="text-left">
                        <p className="text-sm font-bold text-ink-700">Déposez votre CV ici</p>
                        <p className="text-xs text-ink-300">PDF, DOC — 5 MB max</p>
                      </div>
                    </div>
                  )}
                </label>
              </div>

              {error && (
                <div className="text-sm px-4 py-3 rounded-xl bg-red-50 text-red-600 border border-red-200">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Bas de page : Hardie + bouton ────── */}
        <div className="shrink-0 px-8 pb-6 pt-3 border-t border-ink-100 bg-[#FAFAF8]">
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
                style={{ borderTop: "6px solid transparent", borderBottom: "6px solid transparent", borderRight: "8px solid #E8E2DA" }} />
              <div className="absolute -left-1.5 bottom-3 w-0 h-0"
                style={{ borderTop: "6px solid transparent", borderBottom: "6px solid transparent", borderRight: "8px solid white" }} />
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button onClick={() => setStep(s => (s - 1) as 1 | 2 | 3)}
                className="flex items-center gap-1.5 text-ink-500 hover:text-ink font-semibold text-sm transition shrink-0">
                <ArrowLeft size={14} />
                Retour
              </button>
            )}

            {step < 3 ? (
              <button
                onClick={() => {
                  if (step === 1 && selectedSectors.length === 0) {
                    setError("Sélectionnez au moins un secteur.");
                    return;
                  }
                  setError("");
                  setStep(s => (s + 1) as 2 | 3);
                }}
                className="flex-1 flex items-center justify-center gap-2 font-display font-black uppercase tracking-wide text-white bg-brand hover:bg-brand-dark transition h-14 rounded-xl text-lg"
                style={{ letterSpacing: "0.05em" }}
              >
                Continuer
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
                  : <>Créer mon profil <ArrowRight size={18} /></>
                }
              </button>
            )}
          </div>

          {step === 1 && (
            <p className="text-center text-ink-300 text-xs mt-3">
              Vous êtes recruteur ?{" "}
              <Link href="/signup" className="text-brand hover:text-brand-dark font-semibold transition-colors">
                Créer un compte recruteur
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
