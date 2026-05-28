"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Loader2,
  Building2,
  Briefcase,
  Mail,
  Lock,
  User,
  ArrowRight,
  Check,
} from "lucide-react";

type OrgType = "agency" | "company";

export default function SignupPage() {
  const router = useRouter();
  const [orgType, setOrgType] = useState<OrgType | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    org_name: "",
    full_name: "",
    email: "",
    password: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orgType) return;
    setLoading(true);
    setError("");

    const supabase = createClient();

    // 1. Créer le compte
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: { full_name: formData.full_name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (authError || !authData.user) {
      setError(authError?.message ?? "Erreur lors de l'inscription.");
      setLoading(false);
      return;
    }

    // 2. Créer l'organisation
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({ name: formData.org_name, type: orgType })
      .select()
      .single();

    if (orgError || !org) {
      setError("Erreur lors de la création de l'organisation.");
      setLoading(false);
      return;
    }

    // 3. Profil utilisateur
    await supabase.from("users").insert({
      id: authData.user.id,
      organization_id: org.id,
      email: formData.email,
      full_name: formData.full_name,
      role: "admin",
    });

    // 4. Abonnement trial
    await supabase.from("subscriptions").insert({
      organization_id: org.id,
      plan: orgType === "agency" ? "agency" : "starter",
      status: "trial",
      trial_ends_at: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
    });

    router.push("/onboarding");
  }

  return (
    <div className="w-full max-w-lg">
      <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-8">
        {/* Step 1 — Choix du type */}
        {step === 1 && (
          <>
            <h1 className="text-2xl font-bold text-[#1E293B] mb-1">
              Bienvenue sur Rekruut 🎉
            </h1>
            <p className="text-[#64748B] text-sm mb-8">
              30 jours gratuits, sans carte bancaire.
              <br />
              Vous êtes...
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {/* Agence */}
              <button
                onClick={() => setOrgType("agency")}
                className={`relative p-5 rounded-xl border-2 text-left transition-all group hover:border-[#1E40AF] ${
                  orgType === "agency"
                    ? "border-[#1E40AF] bg-blue-50"
                    : "border-[#E2E8F0]"
                }`}
              >
                {orgType === "agency" && (
                  <div className="absolute top-3 right-3 w-5 h-5 bg-[#1E40AF] rounded-full flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                )}
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                    orgType === "agency"
                      ? "bg-[#1E40AF]"
                      : "bg-[#F1F5F9] group-hover:bg-blue-100"
                  }`}
                >
                  <Briefcase
                    size={20}
                    className={
                      orgType === "agency" ? "text-white" : "text-[#64748B]"
                    }
                  />
                </div>
                <div className="font-semibold text-[#1E293B] text-sm mb-1">
                  Une agence de recrutement
                </div>
                <div className="text-xs text-[#64748B]">
                  Intérim, placement, sourcing
                </div>
              </button>

              {/* Entreprise */}
              <button
                onClick={() => setOrgType("company")}
                className={`relative p-5 rounded-xl border-2 text-left transition-all group hover:border-[#1E40AF] ${
                  orgType === "company"
                    ? "border-[#1E40AF] bg-blue-50"
                    : "border-[#E2E8F0]"
                }`}
              >
                {orgType === "company" && (
                  <div className="absolute top-3 right-3 w-5 h-5 bg-[#1E40AF] rounded-full flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                )}
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                    orgType === "company"
                      ? "bg-[#1E40AF]"
                      : "bg-[#F1F5F9] group-hover:bg-blue-100"
                  }`}
                >
                  <Building2
                    size={20}
                    className={
                      orgType === "company" ? "text-white" : "text-[#64748B]"
                    }
                  />
                </div>
                <div className="font-semibold text-[#1E293B] text-sm mb-1">
                  Une entreprise
                </div>
                <div className="text-xs text-[#64748B]">
                  PME qui recrute en direct
                </div>
              </button>
            </div>

            <button
              onClick={() => orgType && setStep(2)}
              disabled={!orgType}
              className="w-full bg-[#1E40AF] text-white py-2.5 rounded-lg font-medium text-sm hover:bg-blue-800 transition flex items-center justify-center gap-2 disabled:opacity-40"
            >
              Continuer
              <ArrowRight size={16} />
            </button>

            <p className="text-center text-sm text-[#64748B] mt-5">
              Déjà un compte ?{" "}
              <Link
                href="/login"
                className="text-[#1E40AF] font-medium hover:underline"
              >
                Se connecter
              </Link>
            </p>
          </>
        )}

        {/* Step 2 — Formulaire */}
        {step === 2 && (
          <>
            <button
              onClick={() => setStep(1)}
              className="text-sm text-[#64748B] hover:text-[#1E293B] mb-4 flex items-center gap-1"
            >
              ← Retour
            </button>

            <h1 className="text-2xl font-bold text-[#1E293B] mb-1">
              Créer votre compte
            </h1>
            <p className="text-[#64748B] text-sm mb-6">
              {orgType === "agency"
                ? "Agence de recrutement"
                : "Entreprise"}{" "}
              · 30 jours gratuits
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nom de l'organisation */}
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">
                  {orgType === "agency"
                    ? "Nom de votre agence"
                    : "Nom de votre entreprise"}
                </label>
                <div className="relative">
                  <Building2
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                  />
                  <input
                    type="text"
                    name="org_name"
                    required
                    value={formData.org_name}
                    onChange={handleChange}
                    placeholder={
                      orgType === "agency"
                        ? "Interim Solutions Wallonie"
                        : "LogiTech Industries SA"
                    }
                    className="w-full pl-9 pr-4 py-2.5 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20 transition"
                  />
                </div>
              </div>

              {/* Prénom Nom */}
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">
                  Votre nom complet
                </label>
                <div className="relative">
                  <User
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                  />
                  <input
                    type="text"
                    name="full_name"
                    required
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="Jean-Pierre Dubois"
                    className="w-full pl-9 pr-4 py-2.5 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20 transition"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">
                  Email professionnel
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                  />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="vous@exemple.be"
                    className="w-full pl-9 pr-4 py-2.5 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20 transition"
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div>
                <label className="block text-sm font-medium text-[#1E293B] mb-1.5">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                  />
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={8}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Minimum 8 caractères"
                    className="w-full pl-9 pr-4 py-2.5 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:border-[#1E40AF] focus:ring-2 focus:ring-[#1E40AF]/20 transition"
                  />
                </div>
              </div>

              {error && (
                <div className="text-sm px-4 py-3 rounded-lg bg-red-50 text-red-600 border border-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1E40AF] text-white py-2.5 rounded-lg font-medium text-sm hover:bg-blue-800 transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    Créer mon compte gratuitement
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <p className="text-xs text-[#94A3B8] text-center">
                En créant un compte, vous acceptez nos{" "}
                <Link href="/cgu" className="underline">
                  CGU
                </Link>{" "}
                et notre{" "}
                <Link href="/privacy" className="underline">
                  politique de confidentialité
                </Link>
                .
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
