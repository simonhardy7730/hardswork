"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Check, Loader2, Zap, Users, Clock, Shield } from "lucide-react";
import { isValidVat } from "@/lib/vat";
import { HardSworkLogo } from "@/components/ui/HardieIcon";
import { signUp } from "@/app/actions/auth";
import { useLang } from "@/lib/i18n/context";
import { LangSwitch } from "@/components/layout/LangSwitch";

import { WolfBadge } from "@/components/ui/WolfMascot";
type L = (fr: string, nl: string) => string;

/* ─── Rôles ──────────────────────────────────────────────── */
function makeRoles(l: L) {
  return [
    {
      id: "agency" as const,
      title: l("AGENCE DE\nRECRUTEMENT", "WERVINGS-\nKANTOOR"),
      features: [l("Multi-sites", "Meerdere vestigingen"), l("Gestion d'intérim", "Interimbeheer"), l("Sourcing illimité", "Onbeperkt sourcen")],
      photo: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80",
      placeholder: l("Ex: Recrutement Pro", "Bv. Werving Pro"),
    },
    {
      id: "company" as const,
      title: l("ENTREPRISE\n/ PME", "BEDRIJF\n/ KMO"),
      features: [l("Recrutement direct", "Rechtstreeks werven"), l("Gestion d'équipe", "Teambeheer"), l("Candidatures centralisées", "Gecentraliseerde sollicitaties")],
      photo: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80",
      placeholder: l("Ex: ConstructoTech", "Bv. BouwTech"),
    },
  ];
}

function makeSteps(l: L) {
  return [
    { num: "01", title: l("Publiez votre offre", "Plaats je vacature"), desc: l("En moins de 2 minutes. Secteur, profil recherché, salaire — simple et efficace.", "In minder dan 2 minuten. Sector, gezocht profiel, loon — eenvoudig en efficiënt.") },
    { num: "02", title: l("Recevez des candidats", "Ontvang kandidaten"), desc: l("Les candidats qui correspondent peuvent postuler directement à votre offre.", "Kandidaten die passen, kunnen rechtstreeks op je vacature solliciteren.") },
    { num: "03", title: l("Contactez & recrutez", "Contacteer & werf aan"), desc: l("Consultez les candidatures, les CV, et échangez directement. Zéro intermédiaire.", "Bekijk de sollicitaties en cv's en neem rechtstreeks contact op. Geen tussenpersoon.") },
  ];
}

function makeFeatures(l: L) {
  return [
    { icon: <Zap size={20} className="text-brand" />, title: l("Publier en 2 min", "Plaatsen in 2 min"), desc: l("Formulaire guidé, pas de jargon RH inutile.", "Begeleid formulier, geen nutteloos HR-jargon.") },
    { icon: <Users size={20} className="text-brand" />, title: l("Des candidats près de chez vous", "Kandidaten in je buurt"), desc: l("Des profils de tous les métiers, dans votre région.", "Profielen van alle beroepen, in jouw regio.") },
    { icon: <Clock size={20} className="text-brand" />, title: l("Tout au même endroit", "Alles op één plek"), desc: l("Toutes vos candidatures dans un seul tableau de bord.", "Al je sollicitaties in één dashboard.") },
    { icon: <Shield size={20} className="text-brand" />, title: l("Vos données", "Je gegevens"), desc: l("Traitées selon notre politique de confidentialité.", "Verwerkt volgens ons privacybeleid.") },
  ];
}

type OrgType = "agency" | "company";
type Step = "select" | "register";

export default function RecrutePage() {
  const lang = useLang();
  const l: L = (fr, nl) => (lang === "nl" ? nl : fr);
  const ROLES = makeRoles(l);
  const STEPS = makeSteps(l);
  const FEATURES = makeFeatures(l);
  const [showForm, setShowForm] = useState(false);
  const [step, setStep]         = useState<Step>("select");
  const [selected, setSelected] = useState<OrgType | null>(null);
  const [form, setForm]         = useState({ orgName: "", vat: "", fullName: "", email: "", password: "", cgu: false });
  const [error, setError]       = useState("");
  const [notice, setNotice]     = useState("");
  const [loading, setLoading]   = useState(false);

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.cgu) { setError(l("Veuillez accepter les CGU pour continuer.", "Aanvaard de algemene voorwaarden om verder te gaan.")); return; }
    if (!selected) return;
    if (!isValidVat(form.vat)) { setError(l("Numéro de TVA invalide. Exemple : BE 0123.456.789", "Ongeldig btw-nummer. Voorbeeld: BE 0123.456.789")); return; }
    setError("");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("email",     form.email);
      fd.append("password",  form.password);
      fd.append("full_name", form.fullName);
      fd.append("org_type",  selected);
      fd.append("org_name",  form.orgName);
      fd.append("vat_number", form.vat);
      const result = await signUp(fd);
      if (result?.error) setError(result.error);
      else if (result && "success" in result && result.success) setNotice(result.success);
    } catch {
      setError(l("Une erreur est survenue. Réessayez.", "Er is een fout opgetreden. Probeer opnieuw."));
    } finally {
      setLoading(false);
    }
  }

  const currentRole = ROLES.find((r) => r.id === selected);

  /* ══ LANDING PAGE ══════════════════════════════════════════ */
  if (!showForm) {
    return (
      <div className="min-h-screen font-body">

        {/* ── NAV ─────────────────────────────────────────── */}
        <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm border-b border-white/[0.07]"
          style={{ background: "rgba(16,31,67,0.98)" }}>
          <div className="max-w-6xl mx-auto px-6 h-[60px] flex items-center justify-between">
            <Link href="/"><HardSworkLogo size="md" dark /></Link>
            <div className="flex items-center gap-3">
              <LangSwitch />
              <Link href="/login" className="text-[13px] text-white/60 hover:text-white transition font-semibold px-2">
                {l("Connexion", "Inloggen")}
              </Link>
              <button
                onClick={() => setShowForm(true)}
                className="font-display font-black uppercase text-white text-[13px] px-5 py-2.5 rounded-xl transition"
                style={{ background: "#FFB900", letterSpacing: "0.05em" }}
              >
                {l("Commencer", "Starten")}
              </button>
            </div>
          </div>
        </header>

        {/* ── HERO ─────────────────────────────────────────── */}
        <div className="relative min-h-[90vh] flex items-center overflow-hidden" style={{ background: "#101F43" }}>
          {/* Photo background */}
          <div className="absolute inset-0"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1400&q=75')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "brightness(0.7) saturate(0.95)",
            }}
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(100deg, rgba(16,31,67,0.82) 0%, rgba(16,31,67,0.55) 42%, rgba(16,31,67,0.12) 100%)" }} />

          <div className="relative max-w-6xl mx-auto px-6 pt-[60px] grid lg:grid-cols-2 gap-12 items-center py-24">
            {/* Texte gauche */}
            <div>
              <WolfBadge className="lg:hidden w-36 mb-5" />
              <h1 className="font-display font-black text-white uppercase leading-[0.88] mb-6"
                style={{ fontSize: "clamp(3rem, 6vw, 5rem)", letterSpacing: "-0.02em" }}>
                {l("Recrutez les", "Werf de")}<br />
                <span style={{ color: "var(--brand-text)" }}>{l("[meilleurs]", "[beste]")}</span><br />
                {l("talents.", "talenten aan.")}
              </h1>
              <p className="text-white/80 text-lg leading-relaxed mb-10 max-w-md">
                {l("La plateforme de recrutement pour tous les métiers. Construction, logistique, transport, industrie, santé, restauration et plus.", "Het wervingsplatform voor alle beroepen. Bouw, logistiek, transport, industrie, zorg, horeca en meer.")}
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-2 font-display font-black uppercase text-white px-8 py-4 rounded-xl transition text-[14px]"
                  style={{ background: "#FFB900", letterSpacing: "0.06em" }}
                >
                  {l("Je recrute — 7 jours d'essai offerts", "Ik werf aan — 7 dagen gratis proef")}
                  <ArrowRight size={15} />
                </button>
                <Link href="/tarifs"
                  className="inline-flex items-center gap-2 font-display font-black uppercase text-white/60 hover:text-white border border-white/15 hover:border-white/30 px-8 py-4 rounded-xl transition text-[14px]"
                  style={{ letterSpacing: "0.06em" }}>
                  {l("Voir les tarifs", "Bekijk de tarieven")}
                </Link>
              </div>
            </div>

            {/* Mini-form card droite */}
            <div className="hidden lg:flex flex-col">
              <WolfBadge className="self-end mr-6 w-[200px] -mb-3 relative z-10" />
              <div className="bg-white rounded-2xl p-7 shadow-2xl">
                <p className="font-display font-black text-[#101F43] uppercase text-sm mb-5">
                  {l("Commencez maintenant — 7 jours d'essai offerts", "Start nu — 7 dagen gratis proef")}
                </p>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {ROLES.map((r) => (
                    <button key={r.id}
                      onClick={() => { setSelected(r.id); setShowForm(true); }}
                      className="rounded-xl overflow-hidden border-2 border-transparent hover:border-[#FFB900] transition text-left group"
                      style={{ borderColor: selected === r.id ? "#FFB900" : undefined }}>
                      <div className="relative h-24 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={r.photo} alt={r.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          style={{ filter: "brightness(0.55)" }} />
                      </div>
                      <div className="p-3 bg-gray-50">
                        <p className="font-display font-black text-[10px] uppercase text-gray-700 whitespace-pre-line leading-tight">{r.title}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowForm(true)}
                  className="w-full py-3.5 text-white font-display font-black uppercase text-[13px] rounded-xl"
                  style={{ background: "#FFB900", letterSpacing: "0.05em" }}>
                  {l("Créer mon compte →", "Mijn account aanmaken →")}
                </button>
                <p className="text-center text-xs text-gray-400 mt-3">
                  {l("Déjà un compte ?", "Al een account?")} <Link href="/login" className="text-brand font-semibold hover:underline">{l("Se connecter", "Inloggen")}</Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── COMMENT ÇA MARCHE ────────────────────────────── */}
        <div className="bg-[#FFFBF2] py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <p className="text-[11px] font-black text-brand uppercase tracking-widest mb-3">{l("Processus", "Werkwijze")}</p>
            <h2 className="font-display font-black text-ink uppercase leading-[0.9] mb-14"
              style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", letterSpacing: "-0.02em" }}>
              {l("En 3 étapes,", "In 3 stappen")}<br /><span className="text-brand">{l("[recrutez].", "[werf aan].")}</span>
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {STEPS.map((s) => (
                <div key={s.num} className="flex flex-col">
                  <span className="font-display font-black text-brand/20 leading-none mb-4"
                    style={{ fontSize: "5rem", letterSpacing: "-0.04em" }}>{s.num}</span>
                  <h3 className="font-display font-black text-ink uppercase text-lg mb-2">{s.title}</h3>
                  <p className="text-ink-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── FEATURES ─────────────────────────────────────── */}
        <div style={{ background: "#101F43" }} className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-display font-black text-white uppercase leading-[0.9] mb-12"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)", letterSpacing: "-0.02em" }}>
              {l("Pourquoi", "Waarom")} <span style={{ color: "var(--brand-text)" }}>[Wolko]</span>&nbsp;?
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              {FEATURES.map((f) => (
                <div key={f.title} className="rounded-2xl p-6 border border-white/8" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className="mb-4">{f.icon}</div>
                  <h3 className="font-display font-black text-white uppercase text-sm mb-2">{f.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── SECTEURS COUVERTS ────────────────────────────── */}
        <div className="bg-[#FFFBF2] py-16 px-6">
          <div className="max-w-5xl mx-auto text-center">
            <p className="text-[11px] font-black text-brand uppercase tracking-widest mb-3">{l("Secteurs", "Sectoren")}</p>
            <h2 className="font-display font-black text-ink uppercase mb-8"
              style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)", letterSpacing: "-0.02em" }}>
              {l("Tous les métiers.", "Alle beroepen.")}
            </h2>
            <div className="flex flex-wrap gap-2 justify-center">
              {[l("Construction", "Bouw"), l("Logistique", "Logistiek"), "Transport", l("Industrie", "Industrie"), l("Médical", "Medisch"), l("Sécurité", "Beveiliging"), l("Nettoyage", "Schoonmaak"), "Horeca", "Tech & IT"].map((s) => (
                <span key={s} className="font-display font-black uppercase text-[12px] text-ink-600 bg-white border border-ink-100 px-4 py-2 rounded-xl">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── CTA FINAL ────────────────────────────────────── */}
        <div style={{ background: "#FFB900" }} className="py-20 px-6 text-center">
          <h2 className="font-display font-black text-white uppercase leading-[0.9] mb-6"
            style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", letterSpacing: "-0.02em" }}>
            {l("Prêt à trouver", "Klaar om")}<br />{l("vos talents", "je talenten te vinden")}&nbsp;?
          </h2>
          <button onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-3 bg-white font-display font-black uppercase px-10 py-4 rounded-xl transition text-[14px] hover:bg-white/90"
            style={{ color: "var(--brand-text)", letterSpacing: "0.08em" }}>
            {l("Démarrer mes 7 jours d'essai", "Mijn 7 proefdagen starten")}
            <ArrowRight size={16} />
          </button>
        </div>

        {/* ── FOOTER ───────────────────────────────────────── */}
        <footer className="border-t border-ink-100 bg-[#FFFBF2] py-8 px-6">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <HardSworkLogo size="sm" dark={false} />
            <p className="text-ink-300 text-xs">© 2026 Wolko · {l("Tous droits réservés", "Alle rechten voorbehouden")}</p>
            <div className="flex gap-6 text-ink-300 text-xs">
              <Link href="/legal/cgu" className="hover:text-ink transition">{l("CGU", "Voorwaarden")}</Link>
              <Link href="/legal/privacy" className="hover:text-ink transition">{l("Confidentialité", "Privacy")}</Link>
              <Link href="mailto:hello@wolko.be" className="hover:text-ink transition">Contact</Link>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  /* ══ FORMULAIRE INSCRIPTION ════════════════════════════════ */
  return (
    <div className="min-h-screen flex" style={{ fontFamily: "var(--font-body, sans-serif)" }}>

      {/* Colonne gauche */}
      <div className="hidden md:flex md:w-[44%] relative flex-col justify-end p-12 overflow-hidden"
        style={{ background: "#101F43" }}>
        <div className="absolute inset-0"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900&q=75')",
            backgroundSize: "cover", backgroundPosition: "center",
            filter: "brightness(0.28) saturate(0.7)",
          }}
        />
        <div className="absolute top-10 left-12 z-10">
          <HardSworkLogo size="md" dark />
        </div>
        <div className="relative z-10">
          <h1 className="font-black text-white uppercase leading-none"
            style={{ fontFamily: "var(--font-display, sans-serif)", fontSize: "clamp(2.8rem, 4.5vw, 4.2rem)" }}>
            {step === "select" ? <>{l("RECRUTEZ LES", "WERF DE")}<br /><span style={{ color: "var(--brand-text)" }}>{l("[MEILLEURS].", "[BESTE].")}</span></>
              : <>{l("CRÉEZ VOTRE", "MAAK JE")}<br /><span style={{ color: "var(--brand-text)" }}>{l("[COMPTE].", "[ACCOUNT] AAN.")}</span></>}
          </h1>
          <p className="text-white/45 mt-5 text-sm leading-relaxed max-w-xs">
            {step === "select"
              ? l("La plateforme de recrutement pour tous les métiers.", "Het wervingsplatform voor alle beroepen.")
              : l("Accédez aux meilleurs talents.", "Krijg toegang tot de beste talenten.")}
          </p>
        </div>
      </div>

      {/* Colonne droite */}
      <div className="flex-1 flex flex-col justify-center items-center px-8 py-16 bg-white min-h-screen">
        <div className="md:hidden mb-10">
          <HardSworkLogo size="md" dark={false} />
        </div>

        <div className="w-full max-w-[480px]">

          {/* Étape 1 — Sélection */}
          {step === "select" && (
            <div>
              <button onClick={() => setShowForm(false)}
                className="flex items-center gap-2 text-gray-400 hover:text-gray-700 text-sm mb-6 transition">
                <ArrowLeft size={14} /> {l("Retour", "Terug")}
              </button>
              <div className="grid grid-cols-2 gap-4 mb-7">
                {ROLES.map((r) => {
                  const isSel = selected === r.id;
                  return (
                    <button key={r.id} onClick={() => setSelected(r.id)}
                      className="relative rounded-2xl overflow-hidden text-left transition-all group"
                      style={{ border: isSel ? "2.5px solid #FFB900" : "2.5px solid #E5E7EB", boxShadow: isSel ? "0 4px 20px rgba(255,185,0,0.15)" : "none" }}>
                      <div className="relative h-32 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={r.photo} alt={r.title}
                          className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                          style={{ filter: "brightness(0.55) saturate(0.8)" }} />
                        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom,rgba(0,0,0,.1),rgba(0,0,0,.55))" }} />
                        {isSel && (
                          <span className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center z-10" style={{ background: "#FFB900" }}>
                            <Check size={13} className="text-white" strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      <div className="p-4 bg-white">
                        <h2 className="font-black text-xs uppercase leading-tight text-gray-900 mb-3 whitespace-pre-line"
                          style={{ fontFamily: "var(--font-display)" }}>{r.title}</h2>
                        <ul className="space-y-1.5">
                          {r.features.map((f) => (
                            <li key={f} className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Check size={11} strokeWidth={3} style={{ color: "var(--brand-text)" }} />{f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </button>
                  );
                })}
              </div>
              <button onClick={() => selected && setStep("register")} disabled={!selected}
                className="w-full py-4 rounded-xl font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition"
                style={{ background: selected ? "#FFB900" : "#F3F4F6", color: selected ? "#101F43" : "#9CA3AF", fontFamily: "var(--font-display)", cursor: selected ? "pointer" : "not-allowed" }}>
                {l("Continuer", "Verder")} <ArrowRight size={16} />
              </button>
              <p className="text-center text-sm text-gray-400 mt-5">
                {l("Déjà un compte ?", "Al een account?")} <Link href="/login" className="font-semibold hover:underline" style={{ color: "var(--brand-text)" }}>{l("Se connecter", "Inloggen")}</Link>
              </p>
            </div>
          )}

          {/* Étape 2 — Formulaire */}
          {step === "register" && (
            <div>
              <div className="flex items-center gap-3 mb-7">
                <button onClick={() => { setStep("select"); setError(""); }} className="text-gray-300 hover:text-gray-600 transition p-1">
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-0.5">
                    {currentRole?.id === "agency" ? l("Agence de recrutement", "Wervingskantoor") : l("Entreprise / PME", "Bedrijf / KMO")}
                  </p>
                  <h2 className="font-black text-xl text-gray-900 uppercase leading-tight" style={{ fontFamily: "var(--font-display)" }}>
                    {l("Inscription", "Registratie")} — <span style={{ color: "var(--brand-text)" }}>{currentRole?.id === "agency" ? l("Agence", "Kantoor") : l("Entreprise", "Bedrijf")}</span>
                  </h2>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">1. {l("Nom de l'entreprise", "Naam van het bedrijf")}</label>
                  <input type="text" placeholder={currentRole?.placeholder} value={form.orgName} onChange={set("orgName")} required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#101F43] transition" />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">{l("Numéro de TVA", "Btw-nummer")}</label>
                  <input type="text" placeholder="BE 0123.456.789" value={form.vat} onChange={set("vat")}
                    autoComplete="off" required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#101F43] transition" />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">2. {l("Votre identité", "Jouw gegevens")}</label>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder={l("Jean Dupont", "Jan Peeters")} value={form.fullName} onChange={set("fullName")} required
                      className="border border-gray-200 rounded-xl px-4 py-3 text-sm placeholder-gray-300 focus:outline-none focus:border-[#101F43] transition" />
                    <input type="email" placeholder={l("jean@entreprise.be", "jan@bedrijf.be")} value={form.email} onChange={set("email")} required
                      className="border border-gray-200 rounded-xl px-4 py-3 text-sm placeholder-gray-300 focus:outline-none focus:border-[#101F43] transition" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">3. {l("Mot de passe", "Wachtwoord")}</label>
                  <input type="password" placeholder={l("Minimum 8 caractères", "Minimum 8 tekens")} value={form.password} onChange={set("password")} required minLength={8}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm placeholder-gray-300 focus:outline-none focus:border-[#101F43] transition" />
                </div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.cgu} onChange={set("cgu")} className="mt-0.5 w-4 h-4 shrink-0 rounded" style={{ accentColor: "#101F43" }} />
                  <span className="text-xs text-gray-400 leading-relaxed">
                    {l("J'accepte les", "Ik aanvaard de")} <Link href="/legal/cgu" className="hover:underline" style={{ color: "var(--brand-text)" }} target="_blank">{l("CGU", "algemene voorwaarden")}</Link>{" "}
                    {l("et la", "en het")} <Link href="/legal/privacy" className="hover:underline" style={{ color: "var(--brand-text)" }} target="_blank">{l("politique de confidentialité", "privacybeleid")}</Link>.
                  </span>
                </label>
                {error && <p className="text-xs rounded-xl px-4 py-3 bg-red-50 border border-red-100" style={{ color: "#B91C1C" }}>{error}</p>}
                {notice && <p className="text-xs rounded-xl px-4 py-3 bg-green-50 border border-green-200 text-green-800">{notice}</p>}
                <button type="submit" disabled={loading}
                  className="w-full py-4 text-white font-black text-sm tracking-widest uppercase rounded-xl flex items-center justify-center gap-2 transition"
                  style={{ background: loading ? "#FFD97A" : "#FFB900", fontFamily: "var(--font-display)" }}>
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <><span>{l("Démarrer mes 7 jours d'essai", "Mijn 7 proefdagen starten")}</span><ArrowRight size={15} /></>}
                </button>
                <p className="text-center text-sm text-gray-400">
                  {l("Déjà un compte ?", "Al een account?")} <Link href="/login" className="font-semibold hover:underline" style={{ color: "var(--brand-text)" }}>{l("Se connecter", "Inloggen")}</Link>
                </p>
              </form>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-300 mt-12">© {new Date().getFullYear()} Wolko · {l("Tous droits réservés", "Alle rechten voorbehouden")}</p>
      </div>
    </div>
  );
}
