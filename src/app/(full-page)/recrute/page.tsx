"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Check, Loader2, Zap, Users, Clock, Shield } from "lucide-react";
import { isValidVat } from "@/lib/vat";
import { HardSworkLogo } from "@/components/ui/HardieIcon";
import { signUp } from "@/app/actions/auth";

import { WolfBadge } from "@/components/ui/WolfMascot";
/* ─── Rôles ──────────────────────────────────────────────── */
const ROLES = [
  {
    id: "agency" as const,
    title: "AGENCE DE\nRECRUTEMENT",
    features: ["Multi-sites", "Gestion d'intérim", "Sourcing illimité"],
    photo: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80",
    placeholder: "Ex: Recrutement Pro",
  },
  {
    id: "company" as const,
    title: "ENTREPRISE\n/ PME",
    features: ["Recrutement direct", "Gestion d'équipe", "1 offre gratuite"],
    photo: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80",
    placeholder: "Ex: ConstructoTech",
  },
];

const STEPS = [
  { num: "01", title: "Publiez votre offre", desc: "En moins de 2 minutes. Secteur, profil recherché, salaire — simple et efficace." },
  { num: "02", title: "Recevez des candidats", desc: "Notre base de candidats qualifiés est notifiée. Les profils correspondants postulent directement." },
  { num: "03", title: "Contactez & recrutez", desc: "Accédez aux coordonnées complètes, CV, et échangez directement. Zéro intermédiaire." },
];

const FEATURES = [
  { icon: <Zap size={20} className="text-brand" />, title: "Publier en 2 min", desc: "Formulaire guidé, pas de jargon RH inutile." },
  { icon: <Users size={20} className="text-brand" />, title: "Candidats qualifiés", desc: "Profils vérifiés, motivés, disponibles maintenant." },
  { icon: <Clock size={20} className="text-brand" />, title: "Réponse sous 48h", desc: "Délai moyen de première candidature reçue." },
  { icon: <Shield size={20} className="text-brand" />, title: "Données protégées", desc: "Hébergées dans l'UE, conformité RGPD." },
];

type OrgType = "agency" | "company";
type Step = "select" | "register";

export default function RecrutePage() {
  const [showForm, setShowForm] = useState(false);
  const [step, setStep]         = useState<Step>("select");
  const [selected, setSelected] = useState<OrgType | null>(null);
  const [form, setForm]         = useState({ orgName: "", vat: "", fullName: "", email: "", password: "", cgu: false });
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.cgu) { setError("Veuillez accepter les CGU pour continuer."); return; }
    if (!selected) return;
    if (!isValidVat(form.vat)) { setError("Numéro de TVA invalide. Exemple : BE 0123.456.789"); return; }
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
    } catch {
      setError("Une erreur est survenue. Réessayez.");
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
          style={{ background: "rgba(16,33,75,0.98)" }}>
          <div className="max-w-6xl mx-auto px-6 h-[60px] flex items-center justify-between">
            <Link href="/"><HardSworkLogo size="md" dark /></Link>
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-[13px] text-white/60 hover:text-white transition font-semibold px-2">
                Connexion
              </Link>
              <button
                onClick={() => setShowForm(true)}
                className="font-display font-black uppercase text-white text-[13px] px-5 py-2.5 rounded-xl transition"
                style={{ background: "#FFB703", letterSpacing: "0.05em" }}
              >
                Commencer
              </button>
            </div>
          </div>
        </header>

        {/* ── HERO ─────────────────────────────────────────── */}
        <div className="relative min-h-[90vh] flex items-center overflow-hidden" style={{ background: "#10214B" }}>
          {/* Photo background */}
          <div className="absolute inset-0"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1400&q=75')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "brightness(0.7) saturate(0.95)",
            }}
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(100deg, rgba(16,33,75,0.82) 0%, rgba(16,33,75,0.55) 42%, rgba(16,33,75,0.12) 100%)" }} />

          <div className="relative max-w-6xl mx-auto px-6 pt-[60px] grid lg:grid-cols-2 gap-12 items-center py-24">
            {/* Texte gauche */}
            <div>
              <WolfBadge className="lg:hidden w-36 mb-5" />
              <h1 className="font-display font-black text-white uppercase leading-[0.88] mb-6"
                style={{ fontSize: "clamp(3rem, 6vw, 5rem)", letterSpacing: "-0.02em" }}>
                Recrutez les<br />
                <span style={{ color: "var(--brand-text)" }}>[meilleurs]</span><br />
                talents.
              </h1>
              <p className="text-white/80 text-lg leading-relaxed mb-10 max-w-md">
                La plateforme de recrutement pour tous les métiers. Construction, logistique, transport, industrie, santé, restauration et plus.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-2 font-display font-black uppercase text-white px-8 py-4 rounded-xl transition text-[14px]"
                  style={{ background: "#FFB703", letterSpacing: "0.06em" }}
                >
                  Je recrute gratuitement
                  <ArrowRight size={15} />
                </button>
                <Link href="/tarifs"
                  className="inline-flex items-center gap-2 font-display font-black uppercase text-white/60 hover:text-white border border-white/15 hover:border-white/30 px-8 py-4 rounded-xl transition text-[14px]"
                  style={{ letterSpacing: "0.06em" }}>
                  Voir les tarifs
                </Link>
              </div>
            </div>

            {/* Mini-form card droite */}
            <div className="hidden lg:flex flex-col">
              <WolfBadge className="self-end mr-6 w-[200px] -mb-3 relative z-10" />
              <div className="bg-white rounded-2xl p-7 shadow-2xl">
                <p className="font-display font-black text-[#10214B] uppercase text-sm mb-5">
                  Commencez maintenant — c&apos;est gratuit
                </p>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {ROLES.map((r) => (
                    <button key={r.id}
                      onClick={() => { setSelected(r.id); setShowForm(true); }}
                      className="rounded-xl overflow-hidden border-2 border-transparent hover:border-[#FFB703] transition text-left group"
                      style={{ borderColor: selected === r.id ? "#FFB703" : undefined }}>
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
                  style={{ background: "#FFB703", letterSpacing: "0.05em" }}>
                  Créer mon compte →
                </button>
                <p className="text-center text-xs text-gray-400 mt-3">
                  Déjà un compte ? <Link href="/login" className="text-brand font-semibold hover:underline">Se connecter</Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── COMMENT ÇA MARCHE ────────────────────────────── */}
        <div className="bg-[#FFFBF0] py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <p className="text-[11px] font-black text-brand uppercase tracking-widest mb-3">Processus</p>
            <h2 className="font-display font-black text-ink uppercase leading-[0.9] mb-14"
              style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", letterSpacing: "-0.02em" }}>
              En 3 étapes,<br /><span className="text-brand">[recrutez].</span>
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
        <div style={{ background: "#10214B" }} className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-display font-black text-white uppercase leading-[0.9] mb-12"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)", letterSpacing: "-0.02em" }}>
              Pourquoi <span style={{ color: "var(--brand-text)" }}>[HardSwork]</span>&nbsp;?
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
        <div className="bg-[#FFFBF0] py-16 px-6">
          <div className="max-w-5xl mx-auto text-center">
            <p className="text-[11px] font-black text-brand uppercase tracking-widest mb-3">Secteurs</p>
            <h2 className="font-display font-black text-ink uppercase mb-8"
              style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)", letterSpacing: "-0.02em" }}>
              Tous les métiers.
            </h2>
            <div className="flex flex-wrap gap-2 justify-center">
              {["Construction", "Logistique", "Transport", "Industrie", "Médical", "Sécurité", "Nettoyage", "Horeca", "Tech & IT"].map((s) => (
                <span key={s} className="font-display font-black uppercase text-[12px] text-ink-600 bg-white border border-ink-100 px-4 py-2 rounded-xl">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── CTA FINAL ────────────────────────────────────── */}
        <div style={{ background: "#FFB703" }} className="py-20 px-6 text-center">
          <h2 className="font-display font-black text-white uppercase leading-[0.9] mb-6"
            style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", letterSpacing: "-0.02em" }}>
            Prêt à trouver<br />vos talents&nbsp;?
          </h2>
          <button onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-3 bg-white font-display font-black uppercase px-10 py-4 rounded-xl transition text-[14px] hover:bg-white/90"
            style={{ color: "var(--brand-text)", letterSpacing: "0.08em" }}>
            Commencer gratuitement
            <ArrowRight size={16} />
          </button>
        </div>

        {/* ── FOOTER ───────────────────────────────────────── */}
        <footer className="border-t border-ink-100 bg-[#FFFBF0] py-8 px-6">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <HardSworkLogo size="sm" dark={false} />
            <p className="text-ink-300 text-xs">© 2026 HardSwork · Tous droits réservés</p>
            <div className="flex gap-6 text-ink-300 text-xs">
              <Link href="/legal/cgu" className="hover:text-ink transition">CGU</Link>
              <Link href="/legal/privacy" className="hover:text-ink transition">Confidentialité</Link>
              <Link href="mailto:hello@hardswork.be" className="hover:text-ink transition">Contact</Link>
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
        style={{ background: "#10214B" }}>
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
            {step === "select" ? <>RECRUTEZ LES<br /><span style={{ color: "var(--brand-text)" }}>[MEILLEURS].</span></>
              : <>CRÉEZ VOTRE<br /><span style={{ color: "var(--brand-text)" }}>[COMPTE].</span></>}
          </h1>
          <p className="text-white/45 mt-5 text-sm leading-relaxed max-w-xs">
            {step === "select"
              ? "La plateforme de recrutement pour tous les métiers."
              : "Accédez aux meilleurs talents."}
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
                <ArrowLeft size={14} /> Retour
              </button>
              <div className="grid grid-cols-2 gap-4 mb-7">
                {ROLES.map((r) => {
                  const isSel = selected === r.id;
                  return (
                    <button key={r.id} onClick={() => setSelected(r.id)}
                      className="relative rounded-2xl overflow-hidden text-left transition-all group"
                      style={{ border: isSel ? "2.5px solid #FFB703" : "2.5px solid #E5E7EB", boxShadow: isSel ? "0 4px 20px rgba(255,183,3,0.15)" : "none" }}>
                      <div className="relative h-32 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={r.photo} alt={r.title}
                          className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                          style={{ filter: "brightness(0.55) saturate(0.8)" }} />
                        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom,rgba(0,0,0,.1),rgba(0,0,0,.55))" }} />
                        {isSel && (
                          <span className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center z-10" style={{ background: "#FFB703" }}>
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
                style={{ background: selected ? "#FFB703" : "#F3F4F6", color: selected ? "#10214B" : "#9CA3AF", fontFamily: "var(--font-display)", cursor: selected ? "pointer" : "not-allowed" }}>
                Continuer <ArrowRight size={16} />
              </button>
              <p className="text-center text-sm text-gray-400 mt-5">
                Déjà un compte ? <Link href="/login" className="font-semibold hover:underline" style={{ color: "var(--brand-text)" }}>Se connecter</Link>
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
                    {currentRole?.id === "agency" ? "Agence de recrutement" : "Entreprise / PME"}
                  </p>
                  <h2 className="font-black text-xl text-gray-900 uppercase leading-tight" style={{ fontFamily: "var(--font-display)" }}>
                    Inscription — <span style={{ color: "var(--brand-text)" }}>{currentRole?.id === "agency" ? "Agence" : "Entreprise"}</span>
                  </h2>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">1. Nom de l&apos;entreprise</label>
                  <input type="text" placeholder={currentRole?.placeholder} value={form.orgName} onChange={set("orgName")} required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#10214B] transition" />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">Numéro de TVA</label>
                  <input type="text" placeholder="BE 0123.456.789 ou FR 12 345678901" value={form.vat} onChange={set("vat")}
                    autoComplete="off" required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#10214B] transition" />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">2. Votre identité</label>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="Jean Dupont" value={form.fullName} onChange={set("fullName")} required
                      className="border border-gray-200 rounded-xl px-4 py-3 text-sm placeholder-gray-300 focus:outline-none focus:border-[#10214B] transition" />
                    <input type="email" placeholder="jean@entreprise.be" value={form.email} onChange={set("email")} required
                      className="border border-gray-200 rounded-xl px-4 py-3 text-sm placeholder-gray-300 focus:outline-none focus:border-[#10214B] transition" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">3. Mot de passe</label>
                  <input type="password" placeholder="Minimum 8 caractères" value={form.password} onChange={set("password")} required minLength={8}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm placeholder-gray-300 focus:outline-none focus:border-[#10214B] transition" />
                </div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.cgu} onChange={set("cgu")} className="mt-0.5 w-4 h-4 shrink-0 rounded" style={{ accentColor: "#10214B" }} />
                  <span className="text-xs text-gray-400 leading-relaxed">
                    J&apos;accepte les <Link href="/legal/cgu" className="hover:underline" style={{ color: "var(--brand-text)" }} target="_blank">CGU</Link>{" "}
                    et la <Link href="/legal/privacy" className="hover:underline" style={{ color: "var(--brand-text)" }} target="_blank">politique de confidentialité</Link>.
                  </span>
                </label>
                {error && <p className="text-xs rounded-xl px-4 py-3 bg-red-50 border border-red-100" style={{ color: "#B91C1C" }}>{error}</p>}
                <button type="submit" disabled={loading}
                  className="w-full py-4 text-white font-black text-sm tracking-widest uppercase rounded-xl flex items-center justify-center gap-2 transition"
                  style={{ background: loading ? "#FFD97A" : "#FFB703", fontFamily: "var(--font-display)" }}>
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <><span>Créer mon compte gratuitement</span><ArrowRight size={15} /></>}
                </button>
                <p className="text-center text-sm text-gray-400">
                  Déjà un compte ? <Link href="/login" className="font-semibold hover:underline" style={{ color: "var(--brand-text)" }}>Se connecter</Link>
                </p>
              </form>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-300 mt-12">© {new Date().getFullYear()} HardSwork · Tous droits réservés</p>
      </div>
    </div>
  );
}
