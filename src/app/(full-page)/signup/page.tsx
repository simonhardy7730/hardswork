"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ArrowRight, ArrowLeft, Check, UserPlus } from "lucide-react";
import { HardSworkLogo } from "@/components/ui/HardieIcon";

type OrgType = "agency" | "company";

const ROLES = [
  {
    id: "agency" as OrgType,
    title: "AGENCE DE\nRECRUTEMENT",
    features: ["Multi-sites", "Gestion d'intérim", "Sourcing illimité"],
    photo: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80",
    placeholder: "Ex: Interim Solutions Wallonie",
  },
  {
    id: "company" as OrgType,
    title: "ENTREPRISE\n/ PME",
    features: ["Recrutement direct", "Gestion d'équipe", "1 offre gratuite"],
    photo: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80",
    placeholder: "Ex: ConstructoTech Belgique",
  },
];

/* ─────────────────────────────────────────────────────────
   Invite flow — rejoindre une org existante (?org=xxx)
───────────────────────────────────────────────────────── */
function InviteSignup({ orgId, role }: { orgId: string; role: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orgName, setOrgName] = useState<string | null>(null);
  const [formData, setFormData] = useState({ full_name: "", email: "", password: "" });

  useEffect(() => {
    async function fetchOrg() {
      const supabase = createClient();
      const { data } = await supabase.from("organizations").select("name").eq("id", orgId).single();
      if (data) setOrgName(data.name);
    }
    fetchOrg();
  }, [orgId]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: { data: { full_name: formData.full_name }, emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (authError || !authData.user) { setError(authError?.message ?? "Erreur lors de l'inscription."); setLoading(false); return; }
    await supabase.from("users").insert({
      id: authData.user.id, organization_id: orgId, email: formData.email, full_name: formData.full_name,
      role: role === "admin" ? "admin" : role === "viewer" ? "viewer" : "recruiter",
    });
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F0E0D] px-4 py-12">
      <div className="w-full max-w-md bg-white/[0.04] rounded-2xl border border-white/[0.08] p-8">
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-6">
          <UserPlus size={18} className="shrink-0" style={{ color: "#D93B12" }} />
          <div>
            <p className="text-sm font-semibold text-white">Vous avez été invité(e)</p>
            <p className="text-xs text-white/40">
              {orgName ? `Rejoignez l'équipe de « ${orgName} »` : "Créez votre compte pour rejoindre l'organisation."}
            </p>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">Créer votre compte</h1>
        <p className="text-white/40 text-sm mb-6">
          Rôle : <span className="font-medium" style={{ color: "#D93B12" }}>
            {role === "admin" ? "Administrateur" : role === "viewer" ? "Observateur" : "Recruteur"}
          </span>
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: "Nom complet", name: "full_name", type: "text", placeholder: "Jean-Pierre Dubois" },
            { label: "Email professionnel", name: "email", type: "email", placeholder: "vous@exemple.be" },
            { label: "Mot de passe", name: "password", type: "password", placeholder: "Minimum 8 caractères", minLength: 8 },
          ].map((f) => (
            <div key={f.name}>
              <label className="block text-sm font-medium text-white mb-1.5">{f.label}</label>
              <input
                type={f.type} name={f.name} required value={formData[f.name as keyof typeof formData]}
                onChange={handleChange} placeholder={f.placeholder} minLength={f.minLength}
                className="w-full px-4 py-2.5 border border-white/10 rounded-xl text-sm bg-white/5 text-white placeholder-white/25 focus:outline-none focus:border-[#D93B12] transition"
              />
            </div>
          ))}
          {error && <p className="text-sm px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-[#D93B12]">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition"
            style={{ background: loading ? "#F0A090" : "#D93B12" }}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <><span>Rejoindre l&apos;organisation</span><ArrowRight size={16} /></>}
          </button>
        </form>
        <p className="text-center text-sm text-white/40 mt-5">
          Déjà un compte ?{" "}
          <Link href="/login" className="font-medium hover:underline" style={{ color: "#D93B12" }}>Se connecter</Link>
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Normal signup — style HardSwork split-screen
───────────────────────────────────────────────────────── */
function NormalSignup() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [orgType, setOrgType] = useState<OrgType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cgu, setCgu] = useState(false);
  const [formData, setFormData] = useState({ org_name: "", full_name: "", email: "", password: "" });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orgType) return;
    if (!cgu) { setError("Veuillez accepter les CGU pour continuer."); return; }
    setLoading(true);
    setError("");
    const supabase = createClient();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: { data: { full_name: formData.full_name }, emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (authError || !authData.user) { setError(authError?.message ?? "Erreur lors de l'inscription."); setLoading(false); return; }

    const { data: org, error: orgError } = await supabase.from("organizations")
      .insert({ name: formData.org_name, type: orgType }).select().single();
    if (orgError || !org) { setError("Erreur lors de la création de l'organisation."); setLoading(false); return; }

    await supabase.from("users").insert({ id: authData.user.id, organization_id: org.id, email: formData.email, full_name: formData.full_name, role: "admin" });
    await supabase.from("subscriptions").insert({
      organization_id: org.id,
      plan: orgType === "agency" ? "agency" : "starter",
      status: "trial",
      trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
    router.push("/onboarding");
  }

  const currentRole = ROLES.find((r) => r.id === orgType);

  return (
    <div className="min-h-screen flex bg-white" style={{ fontFamily: "var(--font-body, sans-serif)" }}>

      {/* ── Colonne gauche ── */}
      <div className="hidden lg:flex lg:w-[48%] xl:w-[52%] relative flex-col justify-end p-14 overflow-hidden" style={{ background: "#0F0E0D" }}>
        <div className="absolute inset-0" style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900&q=75')",
          backgroundSize: "cover", backgroundPosition: "center",
          filter: "brightness(0.28) saturate(0.7)",
        }} />
        <div className="absolute top-10 left-12 z-10"><HardSworkLogo size="md" dark /></div>
        <div className="relative z-10">
          {step === 1 ? (
            <div>
              <h1 className="font-black text-white uppercase leading-none"
                style={{ fontFamily: "var(--font-display, sans-serif)", fontSize: "clamp(2.8rem, 4.5vw, 4.2rem)", textShadow: "0 2px 20px rgba(0,0,0,0.8)" }}>
                RECRUTEZ LES<br /><span style={{ color: "#D93B12" }}>[MEILLEURS].</span>
              </h1>
              <p className="text-white/45 mt-5 text-sm leading-relaxed max-w-xs">
                La plateforme de recrutement pour les travailleurs de terrain et techniques.
              </p>
            </div>
          ) : (
            <div>
              <h1 className="font-black text-white uppercase leading-none"
                style={{ fontFamily: "var(--font-display, sans-serif)", fontSize: "clamp(2.8rem, 4.5vw, 4.2rem)", textShadow: "0 2px 20px rgba(0,0,0,0.8)" }}>
                CRÉEZ VOTRE<br /><span style={{ color: "#D93B12" }}>[COMPTE].</span>
              </h1>
              <p className="text-white/45 mt-5 text-sm leading-relaxed max-w-xs">
                Accédez aux meilleurs talents techniques de Belgique.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Colonne droite ── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-white min-h-screen overflow-y-auto">
        <div className="lg:hidden mb-8"><HardSworkLogo size="md" dark={false} /></div>
        <div className="w-full max-w-[540px]">

          {/* ÉTAPE 1 — Sélection du rôle */}
          {step === 1 && (
            <div>
              <div className="mb-8">
                <h1 className="font-black text-gray-900 uppercase leading-none text-3xl mb-2"
                  style={{ fontFamily: "var(--font-display, sans-serif)" }}>
                  Je suis une<br /><span style={{ color: "#D93B12" }}>entreprise ou agence ?</span>
                </h1>
                <p className="text-gray-400 text-sm">Sélectionnez votre profil pour commencer.</p>
              </div>
              <div className="grid grid-cols-2 gap-5 mb-8 w-full">
                {ROLES.map((r) => {
                  const isSelected = orgType === r.id;
                  return (
                    <button key={r.id} onClick={() => setOrgType(r.id)}
                      className="relative rounded-2xl overflow-hidden text-left transition-all duration-200 group"
                      style={{ border: isSelected ? "2.5px solid #D93B12" : "2.5px solid #E5E7EB", boxShadow: isSelected ? "0 4px 20px rgba(217,59,18,0.15)" : "none" }}>
                      {/* Photo */}
                      <div className="relative h-44 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={r.photo} alt={r.title}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          style={{ filter: "brightness(0.55) saturate(0.8)" }} />
                        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.55) 100%)" }} />
                        {isSelected && (
                          <span className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center z-10" style={{ background: "#D93B12" }}>
                            <Check size={13} className="text-white" strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      {/* Texte */}
                      <div className="p-4 bg-white">
                        <h2 className="font-black text-xs uppercase leading-tight text-gray-900 mb-3 whitespace-pre-line"
                          style={{ fontFamily: "var(--font-display, sans-serif)", letterSpacing: "0.02em" }}>
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

              <button onClick={() => orgType && setStep(2)} disabled={!orgType}
                className="w-full py-4 rounded-xl font-black text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all duration-200"
                style={{ background: orgType ? "#D93B12" : "#F3F4F6", color: orgType ? "#fff" : "#9CA3AF", cursor: orgType ? "pointer" : "not-allowed", fontFamily: "var(--font-display, sans-serif)" }}>
                Continuer <ArrowRight size={16} strokeWidth={2.5} />
              </button>

              <p className="text-center text-sm text-gray-400 mt-5">
                Déjà un compte ?{" "}
                <Link href="/login" className="font-semibold hover:underline" style={{ color: "#D93B12" }}>Se connecter</Link>
              </p>
            </div>
          )}

          {/* ÉTAPE 2 — Formulaire */}
          {step === 2 && (
            <div>
              <div className="flex items-center gap-3 mb-7">
                <button onClick={() => { setStep(1); setError(""); }}
                  className="text-gray-300 hover:text-gray-600 transition-colors p-1" aria-label="Retour">
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-0.5">
                    {currentRole?.id === "agency" ? "Agence de recrutement" : "Entreprise / PME"}
                  </p>
                  <h2 className="font-black text-xl text-gray-900 uppercase leading-tight"
                    style={{ fontFamily: "var(--font-display, sans-serif)" }}>
                    Formulaire Inscription —{" "}
                    <span style={{ color: "#D93B12" }}>{currentRole?.id === "agency" ? "Agence" : "Entreprise"}</span>
                  </h2>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">
                    1. Nom de l&apos;entreprise
                  </label>
                  <input type="text" name="org_name" required value={formData.org_name} onChange={handleChange}
                    placeholder={currentRole?.placeholder}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#D93B12] transition-colors" />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">
                    2. Votre identité
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" name="full_name" required value={formData.full_name} onChange={handleChange}
                      placeholder="Jean Dupont"
                      className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#D93B12] transition-colors" />
                    <input type="email" name="email" required value={formData.email} onChange={handleChange}
                      placeholder="jean.dupont@entreprise.be"
                      className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#D93B12] transition-colors" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">
                    3. Sécurité
                  </label>
                  <input type="password" name="password" required minLength={8} value={formData.password} onChange={handleChange}
                    placeholder="Minimum 8 caractères"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#D93B12] transition-colors" />
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={cgu} onChange={(e) => setCgu(e.target.checked)}
                    className="mt-0.5 w-4 h-4 shrink-0 rounded" style={{ accentColor: "#D93B12" }} />
                  <span className="text-xs text-gray-400 leading-relaxed">
                    J&apos;accepte les{" "}
                    <Link href="/legal/cgu" className="hover:underline" style={{ color: "#D93B12" }} target="_blank">CGU</Link>{" "}
                    et la{" "}
                    <Link href="/legal/privacy" className="hover:underline" style={{ color: "#D93B12" }} target="_blank">politique de confidentialité</Link>.
                  </span>
                </label>

                {error && <p className="text-xs rounded-xl px-4 py-3 bg-red-50 border border-red-100" style={{ color: "#D93B12" }}>{error}</p>}

                <button type="submit" disabled={loading}
                  className="w-full py-4 text-white font-black text-sm tracking-widest uppercase rounded-xl flex items-center justify-center gap-2 transition-all"
                  style={{ background: loading ? "#F0A090" : "#D93B12", fontFamily: "var(--font-display, sans-serif)" }}>
                  {loading
                    ? <Loader2 size={16} className="animate-spin" />
                    : <><span>Créer mon compte gratuitement</span><ArrowRight size={15} strokeWidth={2.5} /></>}
                </button>

                <p className="text-center text-sm text-gray-400">
                  Déjà un compte ?{" "}
                  <Link href="/login" className="font-semibold hover:underline" style={{ color: "#D93B12" }}>Se connecter</Link>
                </p>
              </form>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-300 mt-12">© {new Date().getFullYear()} HardSwork · Belgique · Tous droits réservés</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Router — lit le param ?org= pour l'invite flow
───────────────────────────────────────────────────────── */
function SignupRouter() {
  const searchParams = useSearchParams();
  const orgId = searchParams.get("org");
  const role = searchParams.get("role") ?? "recruiter";
  if (orgId) return <InviteSignup orgId={orgId} role={role} />;
  return <NormalSignup />;
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0F0E0D]" />}>
      <SignupRouter />
    </Suspense>
  );
}
