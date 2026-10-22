"use client";

import PasswordInput from "@/components/ui/PasswordInput";
import { useState, useEffect, Suspense } from "react";
import { friendlyAuthError } from "@/lib/auth-errors";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ArrowRight, ArrowLeft, Check, UserPlus } from "lucide-react";
import { isValidVat } from "@/lib/vat";
import { HardSworkLogo } from "@/components/ui/HardieIcon";
import { useLang } from "@/lib/i18n/context";
import { LangSwitch } from "@/components/layout/LangSwitch";
import Turnstile, { useCaptcha } from "@/components/security/Turnstile";

type OrgType = "agency" | "company";

type L = (fr: string, nl: string) => string;

function makeRoles(l: L) {
  return [
    {
      id: "agency" as OrgType,
      title: l("AGENCE DE\nRECRUTEMENT", "WERVINGS-\nKANTOOR"),
      features: [l("Multi-sites", "Meerdere vestigingen"), l("Gestion d'intérim", "Interimbeheer"), l("Sourcing illimité", "Onbeperkt sourcen")],
      photo: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80",
      placeholder: l("Ex: Interim Solutions Wallonie", "Bv. Interim Solutions Vlaanderen"),
    },
    {
      id: "company" as OrgType,
      title: l("ENTREPRISE\n/ PME", "BEDRIJF\n/ KMO"),
      features: [l("Recrutement direct", "Rechtstreeks werven"), l("Gestion d'équipe", "Teambeheer"), l("Candidatures centralisées", "Gecentraliseerde sollicitaties")],
      photo: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80",
      placeholder: l("Ex: ConstructoTech", "Bv. BouwTech"),
    },
  ];
}

/* ─────────────────────────────────────────────────────────
   Invite flow — rejoindre une org via un jeton d'invitation (?invite=xxx)
   Le jeton est vérifié côté base (fonctions SQL) : l'organisation et le rôle
   viennent de l'invitation, jamais de l'URL.
───────────────────────────────────────────────────────── */
function InviteSignup({ token }: { token: string }) {
  const router = useRouter();
  const lang = useLang();
  const l: L = (fr, nl) => (lang === "nl" ? nl : fr);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [info, setInfo] = useState<{ org_name: string; email: string; role: string } | null | undefined>(undefined);
  const [formData, setFormData] = useState({ full_name: "", password: "" });
  const captcha = useCaptcha();

  useEffect(() => {
    async function fetchInfo() {
      const supabase = createClient();
      const { data } = await supabase.rpc("get_team_invite_info", { p_token: token });
      setInfo(Array.isArray(data) && data.length > 0 ? data[0] : null);
    }
    fetchInfo();
  }, [token]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!info) return;
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: info.email,
      password: formData.password,
      options: {
        data: { full_name: formData.full_name },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(`/invite/accept?token=${token}`)}`,
        captchaToken: captcha.token || undefined,
      },
    });
    captcha.reset();
    if (authError || !authData.user) { setError(friendlyAuthError(authError?.message, l)); setLoading(false); return; }
    if (authData.session) {
      // Session immédiate (confirmation e-mail désactivée) : on accepte tout de suite.
      const { error: acceptError } = await supabase.rpc("accept_team_invite", { p_token: token });
      if (acceptError) { setError(l("Invitation invalide ou expirée.", "Ongeldige of verlopen uitnodiging.")); setLoading(false); return; }
      router.push("/auth/redirect");
      return;
    }
    setDone(true);
    setLoading(false);
  }

  const roleLabel = info?.role === "admin" ? l("Administrateur", "Beheerder") : info?.role === "viewer" ? l("Observateur", "Waarnemer") : l("Recruteur", "Recruiter");

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#101F43] px-4 py-12">
      <div className="w-full max-w-md bg-white/[0.04] rounded-2xl border border-white/[0.08] p-8">
        {info === undefined && <p className="text-white/60 text-sm">…</p>}
        {info === null && (
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">{l("Invitation invalide", "Ongeldige uitnodiging")}</h1>
            <p className="text-white/60 text-sm mb-5">{l("Ce lien est invalide, expiré ou déjà utilisé. Demandez un nouveau lien à votre administrateur.", "Deze link is ongeldig, verlopen of al gebruikt. Vraag een nieuwe link aan je beheerder.")}</p>
            <Link href="/" className="font-medium hover:underline" style={{ color: "var(--brand-text)" }}>{l("Retour à l'accueil", "Terug naar home")}</Link>
          </div>
        )}
        {info && done && (
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">{l("Vérifiez vos e-mails", "Controleer je e-mail")}</h1>
            <p className="text-white/60 text-sm">{l(`Un e-mail de confirmation a été envoyé à ${info.email}. Cliquez sur le lien pour rejoindre « ${info.org_name} ».`, `Er is een bevestigingsmail gestuurd naar ${info.email}. Klik op de link om « ${info.org_name} » te vervoegen.`)}</p>
          </div>
        )}
        {info && !done && (
          <>
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-6">
              <UserPlus size={18} className="shrink-0" style={{ color: "var(--brand-text)" }} />
              <div>
                <p className="text-sm font-semibold text-white">{l("Vous avez été invité(e)", "Je bent uitgenodigd")}</p>
                <p className="text-xs text-white/40">{l(`Rejoignez l'équipe de « ${info.org_name} »`, `Word lid van het team van « ${info.org_name} »`)}</p>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">{l("Créer votre compte", "Maak je account aan")}</h1>
            <p className="text-white/40 text-sm mb-6">
              {l("Rôle", "Rol")} : <span className="font-medium" style={{ color: "var(--brand-text)" }}>{roleLabel}</span>
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1.5">{l("Nom complet", "Volledige naam")}</label>
                <input type="text" name="full_name" required value={formData.full_name} onChange={handleChange}
                  placeholder={l("Jean-Pierre Dubois", "Jan Peeters")}
                  className="w-full px-4 py-2.5 border border-white/10 rounded-xl text-sm bg-white/5 text-white placeholder-white/25 focus:outline-none focus:border-[#FFB900] transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1.5">{l("Adresse e-mail (celle de l'invitation)", "E-mailadres (dat van de uitnodiging)")}</label>
                <input type="email" value={info.email} disabled
                  className="w-full px-4 py-2.5 border border-white/10 rounded-xl text-sm bg-white/5 text-white/60 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-1.5">{l("Mot de passe", "Wachtwoord")}</label>
                <PasswordInput tone="dark" name="password" required minLength={8} value={formData.password} onChange={handleChange}
                  placeholder={l("Minimum 8 caractères", "Minimum 8 tekens")}
                  className="w-full px-4 py-2.5 border border-white/10 rounded-xl text-sm bg-white/5 text-white placeholder-white/25 focus:outline-none focus:border-[#FFB900] transition" />
              </div>
              {error && <p className="text-sm px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-700">{error}</p>}
              <Turnstile onToken={captcha.setToken} resetKey={captcha.resetKey} />
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-sm text-[#101F43] flex items-center justify-center gap-2 transition"
                style={{ background: loading ? "#FFD97A" : "#FFB900" }}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : <><span>{l("Rejoindre l'organisation", "De organisatie vervoegen")}</span><ArrowRight size={16} /></>}
              </button>
            </form>
            <p className="text-center text-sm text-white/40 mt-5">
              {l("Déjà un compte ?", "Al een account?")}{" "}
              <Link href={`/login?next=${encodeURIComponent(`/invite/accept?token=${token}`)}`} className="font-medium hover:underline" style={{ color: "var(--brand-text)" }}>{l("Se connecter", "Inloggen")}</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Normal signup — style Wolko split-screen
───────────────────────────────────────────────────────── */
function NormalSignup() {
  const router = useRouter();
  const lang = useLang();
  const l: L = (fr, nl) => (lang === "nl" ? nl : fr);
  const ROLES = makeRoles(l);
  const typeParam = useSearchParams().get("type");
  // ?type= ne fait que présélectionner le type d'organisation affiché ; aucun droit n'en découle.
  const presetType: OrgType | null = typeParam === "agency" || typeParam === "company" ? typeParam : null;
  const [step, setStep] = useState<1 | 2>(presetType ? 2 : 1);
  const [orgType, setOrgType] = useState<OrgType | null>(presetType);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [cgu, setCgu] = useState(false);
  const captcha = useCaptcha();
  const [formData, setFormData] = useState({ org_name: "", vat_number: "", full_name: "", email: "", password: "" });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orgType) return;
    if (!cgu) { setError(l("Veuillez accepter les CGU pour continuer.", "Aanvaard de algemene voorwaarden om verder te gaan.")); return; }
    setLoading(true);
    setError("");
    if (!isValidVat(formData.vat_number)) { setError(l("Numéro de TVA invalide. Exemple : BE 0123.456.749", "Ongeldig btw-nummer. Voorbeeld: BE 0123.456.749")); setLoading(false); return; }
    const supabase = createClient();

    // Organisation, profil admin et essai gratuit : créés côté base (trigger sécurisé, migration 012).
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: { full_name: formData.full_name, signup_kind: "organization", lang, org_name: formData.org_name, org_type: orgType, vat_number: formData.vat_number.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        captchaToken: captcha.token || undefined,
      },
    });
    captcha.reset();
    if (authError || !authData.user) { setError(friendlyAuthError(authError?.message, l)); setLoading(false); return; }
    if (!authData.session) {
      setNotice(l("Compte créé ! Vérifiez votre boîte mail et cliquez sur le lien pour confirmer votre adresse.", "Account aangemaakt! Controleer je mailbox en klik op de link om je e-mailadres te bevestigen."));
      setLoading(false);
      return;
    }
    router.push("/onboarding");
  }

  const currentRole = ROLES.find((r) => r.id === orgType);

  return (
    <div className="min-h-screen flex bg-white" style={{ fontFamily: "var(--font-body, sans-serif)" }}>

      {/* ── Colonne gauche ── */}
      <div className="hidden lg:flex lg:w-[48%] xl:w-[52%] relative flex-col justify-end p-14 overflow-hidden" style={{ background: "#101F43" }}>
        <div className="absolute inset-0" style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=900&q=75')",
          backgroundSize: "cover", backgroundPosition: "center",
          filter: "brightness(0.28) saturate(0.7)",
        }} />
        <div className="absolute top-10 left-12 z-10"><HardSworkLogo size="md" dark /></div>
        <div className="absolute top-10 right-12 z-10"><LangSwitch /></div>
        <div className="relative z-10">
          {step === 1 ? (
            <div>
              <h1 className="font-black text-white uppercase leading-none"
                style={{ fontFamily: "var(--font-display, sans-serif)", fontSize: "clamp(2.8rem, 4.5vw, 4.2rem)", textShadow: "0 2px 20px rgba(0,0,0,0.8)" }}>
                {l("RECRUTEZ LES", "WERF DE")}<br /><span style={{ color: "var(--brand-text)" }}>{l("[MEILLEURS].", "[BESTE].")}</span>
              </h1>
              <p className="text-white/45 mt-5 text-sm leading-relaxed max-w-xs">
                {l("La plateforme de recrutement pour tous les métiers.", "Het wervingsplatform voor alle beroepen.")}
              </p>
            </div>
          ) : (
            <div>
              <h1 className="font-black text-white uppercase leading-none"
                style={{ fontFamily: "var(--font-display, sans-serif)", fontSize: "clamp(2.8rem, 4.5vw, 4.2rem)", textShadow: "0 2px 20px rgba(0,0,0,0.8)" }}>
                {l("CRÉEZ VOTRE", "MAAK JE")}<br /><span style={{ color: "var(--brand-text)" }}>{l("[COMPTE].", "[ACCOUNT] AAN.")}</span>
              </h1>
              <p className="text-white/45 mt-5 text-sm leading-relaxed max-w-xs">
                {l("Accédez aux meilleurs talents.", "Krijg toegang tot de beste talenten.")}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Colonne droite ── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-white min-h-screen overflow-y-auto">
        <div className="lg:hidden mb-8 flex items-center gap-4"><HardSworkLogo size="md" dark={false} /><LangSwitch tone="light" /></div>
        <div className="w-full max-w-[540px]">

          {/* ÉTAPE 1 — Sélection du rôle */}
          {step === 1 && (
            <div>
              <div className="mb-8">
                <h1 className="font-black text-gray-900 uppercase leading-none text-3xl mb-2"
                  style={{ fontFamily: "var(--font-display, sans-serif)" }}>
                  {l("Je suis une", "Ik ben een")}<br /><span style={{ color: "var(--brand-text)" }}>{l("entreprise ou agence ?", "bedrijf of kantoor?")}</span>
                </h1>
                <p className="text-gray-400 text-sm">{l("Sélectionnez votre profil pour commencer.", "Kies je profiel om te starten.")}</p>
              </div>
              <div className="grid grid-cols-2 gap-5 mb-8 w-full">
                {ROLES.map((r) => {
                  const isSelected = orgType === r.id;
                  return (
                    <button key={r.id} onClick={() => setOrgType(r.id)}
                      className="relative rounded-2xl overflow-hidden text-left transition-all duration-200 group"
                      style={{ border: isSelected ? "2.5px solid #FFB900" : "2.5px solid #E5E7EB", boxShadow: isSelected ? "0 4px 20px rgba(255,185,0,0.15)" : "none" }}>
                      {/* Photo */}
                      <div className="relative h-44 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={r.photo} alt={r.title}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          style={{ filter: "brightness(0.55) saturate(0.8)" }} />
                        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.55) 100%)" }} />
                        {isSelected && (
                          <span className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center z-10" style={{ background: "#FFB900" }}>
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
                              <Check size={11} strokeWidth={3} className="shrink-0" style={{ color: "var(--brand-text)" }} />
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
                style={{ background: orgType ? "#FFB900" : "#F3F4F6", color: orgType ? "#101F43" : "#9CA3AF", cursor: orgType ? "pointer" : "not-allowed", fontFamily: "var(--font-display, sans-serif)" }}>
                {l("Continuer", "Verder")} <ArrowRight size={16} strokeWidth={2.5} />
              </button>

              <p className="text-center text-sm text-gray-400 mt-5">
                {l("Déjà un compte ?", "Al een account?")}{" "}
                <Link href="/login" className="font-semibold hover:underline" style={{ color: "var(--brand-text)" }}>{l("Se connecter", "Inloggen")}</Link>
              </p>
            </div>
          )}

          {/* ÉTAPE 2 — Formulaire */}
          {step === 2 && (
            <div>
              <div className="flex items-center gap-3 mb-7">
                <button onClick={() => { setStep(1); setError(""); }}
                  className="text-gray-300 hover:text-gray-600 transition-colors p-1" aria-label={l("Retour", "Terug")}>
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-0.5">
                    {currentRole?.id === "agency" ? l("Agence de recrutement", "Wervingskantoor") : l("Entreprise / PME", "Bedrijf / KMO")}
                  </p>
                  <h2 className="font-black text-xl text-gray-900 uppercase leading-tight"
                    style={{ fontFamily: "var(--font-display, sans-serif)" }}>
                    {l("Formulaire Inscription", "Registratieformulier")} —{" "}
                    <span style={{ color: "var(--brand-text)" }}>{currentRole?.id === "agency" ? l("Agence", "Kantoor") : l("Entreprise", "Bedrijf")}</span>
                  </h2>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">
                    1. {l("Nom de l'entreprise", "Naam van het bedrijf")}
                  </label>
                  <input type="text" name="org_name" required value={formData.org_name} onChange={handleChange}
                    placeholder={currentRole?.placeholder}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#101F43] transition-colors" />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">{l("Numéro de TVA", "Btw-nummer")}</label>
                  <input type="text" placeholder="BE 0123.456.749" name="vat_number" value={formData.vat_number} onChange={handleChange}
                    autoComplete="off" required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#101F43] transition" />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">
                    2. {l("Votre identité", "Jouw gegevens")}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" name="full_name" required value={formData.full_name} onChange={handleChange}
                      placeholder={l("Jean Dupont", "Jan Peeters")}
                      className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#101F43] transition-colors" />
                    <input type="email" name="email" required value={formData.email} onChange={handleChange}
                      placeholder={l("jean.dupont@entreprise.be", "jan.peeters@bedrijf.be")}
                      className="border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#101F43] transition-colors" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2">
                    3. {l("Sécurité", "Beveiliging")}
                  </label>
                  <PasswordInput name="password" required minLength={8} value={formData.password} onChange={handleChange}
                    placeholder={l("Minimum 8 caractères", "Minimum 8 tekens")}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#101F43] transition-colors" />
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={cgu} onChange={(e) => setCgu(e.target.checked)}
                    className="mt-0.5 w-4 h-4 shrink-0 rounded" style={{ accentColor: "#101F43" }} />
                  <span className="text-xs text-gray-400 leading-relaxed">
                    {l("J'accepte les", "Ik aanvaard de")}{" "}
                    <Link href="/legal/cgu" className="hover:underline" style={{ color: "var(--brand-text)" }} target="_blank">{l("CGU", "algemene voorwaarden")}</Link>{" "}
                    {l("et la", "en het")}{" "}
                    <Link href="/legal/privacy" className="hover:underline" style={{ color: "var(--brand-text)" }} target="_blank">{l("politique de confidentialité", "privacybeleid")}</Link>.
                  </span>
                </label>

                {error && <p className="text-xs rounded-xl px-4 py-3 bg-red-50 border border-red-100" style={{ color: "#B91C1C" }}>{error}</p>}
                {notice && <p className="text-xs rounded-xl px-4 py-3 bg-green-50 border border-green-200 text-green-800">{notice}</p>}

                <Turnstile onToken={captcha.setToken} resetKey={captcha.resetKey} />

                <button type="submit" disabled={loading}
                  className="w-full py-4 text-white font-black text-sm tracking-widest uppercase rounded-xl flex items-center justify-center gap-2 transition-all"
                  style={{ background: loading ? "#FFD97A" : "#FFB900", fontFamily: "var(--font-display, sans-serif)" }}>
                  {loading
                    ? <Loader2 size={16} className="animate-spin" />
                    : <><span>{l("Démarrer mes 7 jours d'essai", "Mijn 7 proefdagen starten")}</span><ArrowRight size={15} strokeWidth={2.5} /></>}
                </button>

                <p className="text-center text-sm text-gray-400">
                  {l("Déjà un compte ?", "Al een account?")}{" "}
                  <Link href="/login" className="font-semibold hover:underline" style={{ color: "var(--brand-text)" }}>{l("Se connecter", "Inloggen")}</Link>
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

/* ─────────────────────────────────────────────────────────
   Router — lit le jeton ?invite= pour l'invite flow
───────────────────────────────────────────────────────── */
function SignupRouter() {
  const searchParams = useSearchParams();
  // Ancien format ?org=<id> volontairement ignoré : il permettait de s'auto-rattacher à une organisation.
  const inviteToken = searchParams.get("invite");
  if (inviteToken) return <InviteSignup token={inviteToken} />;
  return <NormalSignup />;
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#101F43]" />}>
      <SignupRouter />
    </Suspense>
  );
}
