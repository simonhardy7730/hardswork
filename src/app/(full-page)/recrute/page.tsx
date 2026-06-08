"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Check, Loader2 } from "lucide-react";
import { HardSworkLogo } from "@/components/ui/HardieIcon";
import { signUp } from "@/app/actions/auth";

/* ─── Rôles ──────────────────────────────────────────────── */
const ROLES = [
  {
    id: "agency" as const,
    title: "AGENCE DE\nRECRUTEMENT",
    features: ["Multi-sites", "Gestion d'intérim", "Sourcing illimité"],
    photo: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80",
    placeholder: "Ex: Recrutement Pro Belgique",
  },
  {
    id: "company" as const,
    title: "ENTREPRISE\n/ PME",
    features: ["Recrutement direct", "Gestion d'équipe", "1 offre gratuite"],
    photo: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80",
    placeholder: "Ex: ConstructoTech Belgique",
  },
];

type OrgType = "agency" | "company";
type Step = "select" | "register";

export default function RecrutePage() {
  const [step, setStep]         = useState<Step>("select");
  const [selected, setSelected] = useState<OrgType | null>(null);
  const [form, setForm]         = useState({ orgName: "", fullName: "", email: "", password: "", cgu: false });
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
    setError("");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("email",     form.email);
      fd.append("password",  form.password);
      fd.append("full_name", form.fullName);
      fd.append("org_type",  selected);
      fd.append("org_name",  form.orgName);
      const result = await signUp(fd);
      if (result?.error) setError(result.error);
    } catch {
      setError("Une erreur est survenue. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  const currentRole = ROLES.find((r) => r.id === selected);

  return (
    <div className="min-h-screen flex bg-white" style={{ fontFamily: "var(--font-body, sans-serif)" }}>

      {/* ══ COLONNE GAUCHE — sombre ══════════════════════════ */}
      <div
        className="hidden md:flex md:w-[44%] relative flex-col justify-end p-12 overflow-hidden"
        style={{ background: "#0F0E0D" }}
      >
        {/* Photo fond */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900&q=75')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "brightness(0.28) saturate(0.7)",
          }}
        />
        {/* Grain overlay */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Logo */}
        <div className="absolute top-10 left-12 z-10">
          <HardSworkLogo size="md" dark />
        </div>

        {/* Tagline */}
        <div className="relative z-10">
          {step === "select" ? (
            <div>
              <h1
                className="font-black text-white uppercase leading-none"
                style={{
                  fontFamily: "var(--font-display, sans-serif)",
                  fontSize: "clamp(2.8rem, 4.5vw, 4.2rem)",
                  textShadow: "0 2px 20px rgba(0,0,0,0.8)",
                }}
              >
                RECRUTEZ LES<br />
                <span style={{ color: "#D93B12" }}>[MEILLEURS].</span>
              </h1>
              <p className="text-white/45 mt-5 text-sm leading-relaxed max-w-xs">
                La plateforme de recrutement pour les travailleurs de terrain et techniques.
              </p>
            </div>
          ) : (
            <div>
              <h1
                className="font-black text-white uppercase leading-none"
                style={{
                  fontFamily: "var(--font-display, sans-serif)",
                  fontSize: "clamp(2.8rem, 4.5vw, 4.2rem)",
                  textShadow: "0 2px 20px rgba(0,0,0,0.8)",
                }}
              >
                CRÉEZ VOTRE<br />
                <span style={{ color: "#D93B12" }}>[COMPTE].</span>
              </h1>
              <p className="text-white/45 mt-5 text-sm leading-relaxed max-w-xs">
                Accédez aux meilleurs talents techniques de Belgique.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ══ COLONNE DROITE — blanche ════════════════════════ */}
      <div className="flex-1 flex flex-col justify-center items-center px-8 py-16 bg-white min-h-screen">

        {/* Logo mobile */}
        <div className="md:hidden mb-10">
          <HardSworkLogo size="md" dark={false} />
        </div>

        <div className="w-full max-w-[480px]">

          {/* ── ÉTAPE 1 — Sélection rôle ───────────────────── */}
          {step === "select" && (
            <div>
              <div className="grid grid-cols-2 gap-4 mb-7">
                {ROLES.map((r) => {
                  const isSelected = selected === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setSelected(r.id)}
                      className="relative rounded-2xl overflow-hidden text-left transition-all duration-200 group"
                      style={{
                        border: isSelected ? "2.5px solid #D93B12" : "2.5px solid #E5E7EB",
                        boxShadow: isSelected ? "0 4px 20px rgba(217,59,18,0.15)" : "none",
                      }}
                    >
                      {/* Photo de fond */}
                      <div className="relative h-32 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={r.photo}
                          alt={r.title}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          style={{ filter: "brightness(0.55) saturate(0.8)" }}
                        />
                        {/* Overlay dégradé bas */}
                        <div
                          className="absolute inset-0"
                          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.55) 100%)" }}
                        />
                        {/* Badge sélectionné */}
                        {isSelected && (
                          <span
                            className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center z-10"
                            style={{ background: "#D93B12" }}
                          >
                            <Check size={13} className="text-white" strokeWidth={3} />
                          </span>
                        )}
                      </div>

                      {/* Texte */}
                      <div className="p-4 bg-white">
                        <h2
                          className="font-black text-xs uppercase leading-tight text-gray-900 mb-3 whitespace-pre-line"
                          style={{ fontFamily: "var(--font-display, sans-serif)", letterSpacing: "0.02em" }}
                        >
                          {r.title}
                        </h2>
                        <ul className="space-y-1.5">
                          {r.features.map((f) => (
                            <li key={f} className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Check size={11} strokeWidth={3} className="shrink-0" style={{ color: "#D93B12" }} />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Bouton continuer */}
              <button
                onClick={() => selected && setStep("register")}
                disabled={!selected}
                className="w-full py-4 rounded-xl font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all duration-200"
                style={{
                  background: selected ? "#D93B12" : "#F3F4F6",
                  color: selected ? "#fff" : "#9CA3AF",
                  cursor: selected ? "pointer" : "not-allowed",
                  fontFamily: "var(--font-display, sans-serif)",
                }}
              >
                Continuer
                <ArrowRight size={16} strokeWidth={2.5} />
              </button>

              <p className="text-center text-sm text-gray-400 mt-5">
                Déjà un compte ?{" "}
                <Link href="/login" className="font-semibold hover:underline" style={{ color: "#D93B12" }}>
                  Se connecter
                </Link>
              </p>
            </div>
          )}

          {/* ── ÉTAPE 2 — Formulaire inscription ───────────── */}
          {step === "register" && (
            <div>
              {/* En-tête */}
              <div className="flex items-center gap-3 mb-7">
                <button
                  onClick={() => { setStep("select"); setError(""); }}
                  className="text-gray-300 hover:text-gray-600 transition-colors p-1"
                  aria-label="Retour"
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-0.5">
                    {currentRole?.id === "agency" ? "Agence de recrutement" : "Entreprise / PME"}
                  </p>
                  <h2
                    className="font-black text-xl text-gray-900 uppercase leading-tight"
                    style={{ fontFamily: "var(--font-display, sans-serif)" }}
                  >
                    Formulaire Inscription —{" "}
                    <span style={{ color: "#D93B12" }}>
                      {currentRole?.id === "agency" ? "Agence" : "Entreprise"}
                    </span>
                  </h2>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* 1. Nom entreprise */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">
                    1. Nom de l&apos;entreprise
                  </label>
                  <input
                    type="text"
                    placeholder={currentRole?.placeholder}
                    value={form.orgName}
                    onChange={set("orgName")}
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#D93B12] transition-colors"
                  />
                </div>

                {/* 2. Identité */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">
                    2. Votre identité
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Jean Dupont"
                      value={form.fullName}
                      onChange={set("fullName")}
                      required
                      className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#D93B12] transition-colors"
                    />
                    <input
                      type="email"
                      placeholder="jean.dupont@entreprise.be"
                      value={form.email}
                      onChange={set("email")}
                      required
                      className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#D93B12] transition-colors"
                    />
                  </div>
                </div>

                {/* 3. Mot de passe */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">
                    3. Sécurité
                  </label>
                  <input
                    type="password"
                    placeholder="Minimum 8 caractères"
                    value={form.password}
                    onChange={set("password")}
                    required
                    minLength={8}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#D93B12] transition-colors"
                  />
                </div>

                {/* CGU */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.cgu}
                    onChange={set("cgu")}
                    className="mt-0.5 w-4 h-4 shrink-0 rounded"
                    style={{ accentColor: "#D93B12" }}
                  />
                  <span className="text-xs text-gray-400 leading-relaxed">
                    J&apos;accepte les{" "}
                    <Link href="/legal/cgu" className="hover:underline" style={{ color: "#D93B12" }} target="_blank">
                      CGU
                    </Link>{" "}
                    et la{" "}
                    <Link href="/legal/privacy" className="hover:underline" style={{ color: "#D93B12" }} target="_blank">
                      politique de confidentialité
                    </Link>
                    .
                  </span>
                </label>

                {error && (
                  <p className="text-xs rounded-xl px-4 py-3 bg-red-50 border border-red-100" style={{ color: "#D93B12" }}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 text-white font-black text-sm tracking-widest uppercase rounded-xl flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: loading ? "#F0A090" : "#D93B12",
                    fontFamily: "var(--font-display, sans-serif)",
                  }}
                >
                  {loading
                    ? <Loader2 size={16} className="animate-spin" />
                    : <><span>Créer mon compte gratuitement</span><ArrowRight size={15} strokeWidth={2.5} /></>
                  }
                </button>

                <p className="text-center text-sm text-gray-400">
                  Déjà un compte ?{" "}
                  <Link href="/login" className="font-semibold hover:underline" style={{ color: "#D93B12" }}>
                    Se connecter
                  </Link>
                </p>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-300 mt-12">
          © {new Date().getFullYear()} HardSwork · Belgique · Tous droits réservés
        </p>
      </div>
    </div>
  );
}
