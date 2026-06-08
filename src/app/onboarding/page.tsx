"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Building2,
  MapPin,
  Phone,
  Globe,
  UserPlus,
  Briefcase,
  ArrowRight,
  Check,
  Loader2,
  Sparkles,
} from "lucide-react";
import { SECTOR_LABELS } from "@/lib/utils";

type Step = 1 | 2 | 3;

const STEPS = [
  { num: 1, label: "Votre organisation" },
  { num: 2, label: "Votre équipe" },
  { num: 3, label: "Première offre" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Step 1 — Org infos
  const [orgData, setOrgData] = useState({
    city: "",
    region: "wallonie" as "wallonie" | "bruxelles" | "flandre",
    phone: "",
    website: "",
    address: "",
  });

  // Step 2 — Inviter des recruteurs
  const [inviteEmail, setInviteEmail] = useState("");
  const [invites, setInvites] = useState<string[]>([]);

  // Step 3 — Première offre (optionnel)
  const [skipOffer, setSkipOffer] = useState(false);
  const [offerData, setOfferData] = useState({
    title: "",
    sector: "logistique" as string,
    contract_type: "interim" as string,
    city: "",
  });

  function addInvite() {
    if (inviteEmail && !invites.includes(inviteEmail)) {
      setInvites((prev) => [...prev, inviteEmail]);
      setInviteEmail("");
    }
  }

  async function handleFinish() {
    setLoading(true);
    const supabase = createClient();

    // Mettre à jour l'organisation avec les nouvelles infos
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userProfile } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (userProfile) {
      await supabase
        .from("organizations")
        .update({
          city: orgData.city || null,
          region: orgData.region || null,
          phone: orgData.phone || null,
          website: orgData.website || null,
          address: orgData.address || null,
        })
        .eq("id", userProfile.organization_id);

      // Créer la première offre si renseignée
      if (!skipOffer && offerData.title && offerData.city) {
        await supabase.from("job_offers").insert({
          organization_id: userProfile.organization_id,
          created_by: user.id,
          title: offerData.title,
          sector: offerData.sector as never,
          contract_type: offerData.contract_type as never,
          city: offerData.city,
          region: orgData.region,
          status: "draft",
        });
      }
    }

    setDone(true);
    setTimeout(() => router.push("/dashboard"), 1500);
  }

  if (done) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <Check size={32} className="text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-ink">C&apos;est prêt !</h2>
        <p className="text-ink-500 text-sm">
          Redirection vers votre tableau de bord...
        </p>
        <Loader2 size={20} className="animate-spin text-brand mx-auto" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center gap-3 justify-center mb-4">
          {STEPS.map((s, i) => (
            <div key={s.num} className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step > s.num
                      ? "bg-[#10B981] text-white"
                      : step === s.num
                        ? "bg-brand text-white"
                        : "bg-[#E8E2DA] text-ink-300"
                  }`}
                >
                  {step > s.num ? <Check size={14} /> : s.num}
                </div>
                <span
                  className={`text-xs font-medium hidden sm:block ${
                    step === s.num ? "text-ink" : "text-ink-300"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-px w-8 ${step > s.num ? "bg-[#10B981]" : "bg-[#E8E2DA]"}`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="h-1 bg-[#E8E2DA] rounded-full overflow-hidden">
          <div
            className="h-full bg-brand transition-all duration-500"
            style={{ width: `${((step - 1) / 2) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-ink-100 p-8">
        {/* =================== ÉTAPE 1 =================== */}
        {step === 1 && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Building2 size={20} className="text-brand" />
              </div>
              <div>
                <h2 className="font-bold text-ink">
                  Votre organisation
                </h2>
                <p className="text-xs text-ink-500">
                  Complétez votre profil (optionnel)
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  Région
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    ["wallonie", "bruxelles", "flandre"] as const
                  ).map((r) => (
                    <button
                      key={r}
                      onClick={() =>
                        setOrgData((p) => ({ ...p, region: r }))
                      }
                      className={`py-2 px-3 rounded-lg border text-sm font-medium transition capitalize ${
                        orgData.region === r
                          ? "border-brand bg-blue-50 text-brand"
                          : "border-ink-100 text-ink-500 hover:border-brand"
                      }`}
                    >
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    Ville
                  </label>
                  <div className="relative">
                    <MapPin
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300"
                    />
                    <input
                      type="text"
                      value={orgData.city}
                      onChange={(e) =>
                        setOrgData((p) => ({ ...p, city: e.target.value }))
                      }
                      placeholder="Liège"
                      className="w-full pl-9 pr-3 py-2.5 border border-ink-100 rounded-lg text-sm focus:outline-none focus:border-brand transition"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    Téléphone
                  </label>
                  <div className="relative">
                    <Phone
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300"
                    />
                    <input
                      type="tel"
                      value={orgData.phone}
                      onChange={(e) =>
                        setOrgData((p) => ({ ...p, phone: e.target.value }))
                      }
                      placeholder="+32 4 xxx xx xx"
                      className="w-full pl-9 pr-3 py-2.5 border border-ink-100 rounded-lg text-sm focus:outline-none focus:border-brand transition"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  Site web{" "}
                  <span className="text-ink-300 font-normal">(optionnel)</span>
                </label>
                <div className="relative">
                  <Globe
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300"
                  />
                  <input
                    type="url"
                    value={orgData.website}
                    onChange={(e) =>
                      setOrgData((p) => ({ ...p, website: e.target.value }))
                    }
                    placeholder="https://votre-site.be"
                    className="w-full pl-9 pr-3 py-2.5 border border-ink-100 rounded-lg text-sm focus:outline-none focus:border-brand transition"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full mt-6 bg-brand text-white py-2.5 rounded-lg font-medium text-sm hover:bg-brand-dark transition flex items-center justify-center gap-2"
            >
              Continuer <ArrowRight size={16} />
            </button>
          </>
        )}

        {/* =================== ÉTAPE 2 =================== */}
        {step === 2 && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <UserPlus size={20} className="text-brand" />
              </div>
              <div>
                <h2 className="font-bold text-ink">
                  Inviter des recruteurs
                </h2>
                <p className="text-xs text-ink-500">
                  Vous pouvez le faire plus tard
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addInvite()}
                  placeholder="recruteur@example.be"
                  className="flex-1 px-3 py-2.5 border border-ink-100 rounded-lg text-sm focus:outline-none focus:border-brand transition"
                />
                <button
                  onClick={addInvite}
                  className="px-4 py-2.5 bg-surface-2 border border-ink-100 rounded-lg text-sm font-medium text-ink hover:bg-[#E8E2DA] transition"
                >
                  Ajouter
                </button>
              </div>

              {invites.length > 0 && (
                <div className="space-y-2">
                  {invites.map((email) => (
                    <div
                      key={email}
                      className="flex items-center justify-between px-3 py-2 bg-surface-2 rounded-lg"
                    >
                      <span className="text-sm text-ink">{email}</span>
                      <button
                        onClick={() =>
                          setInvites((prev) => prev.filter((e) => e !== email))
                        }
                        className="text-ink-300 hover:text-red-500 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {invites.length === 0 && (
                <p className="text-xs text-ink-300 text-center py-4">
                  Vous inviterez vos collègues depuis les Paramètres.
                </p>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-2.5 border border-ink-100 rounded-lg text-sm font-medium text-ink-500 hover:bg-surface-2 transition"
              >
                Retour
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 bg-brand text-white py-2.5 rounded-lg font-medium text-sm hover:bg-brand-dark transition flex items-center justify-center gap-2"
              >
                Continuer <ArrowRight size={16} />
              </button>
            </div>
          </>
        )}

        {/* =================== ÉTAPE 3 =================== */}
        {step === 3 && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Briefcase size={20} className="text-brand" />
              </div>
              <div>
                <h2 className="font-bold text-ink">
                  Créer votre première offre
                </h2>
                <p className="text-xs text-ink-500">
                  Enregistrée en brouillon, publiez quand vous voulez
                </p>
              </div>
            </div>

            {!skipOffer ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    Titre du poste
                  </label>
                  <input
                    type="text"
                    value={offerData.title}
                    onChange={(e) =>
                      setOfferData((p) => ({ ...p, title: e.target.value }))
                    }
                    placeholder="ex: Cariste CACES 3, Chauffeur SPL..."
                    className="w-full px-3 py-2.5 border border-ink-100 rounded-lg text-sm focus:outline-none focus:border-brand transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">
                      Secteur
                    </label>
                    <select
                      value={offerData.sector}
                      onChange={(e) =>
                        setOfferData((p) => ({
                          ...p,
                          sector: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2.5 border border-ink-100 rounded-lg text-sm focus:outline-none focus:border-brand transition bg-white"
                    >
                      {Object.entries(SECTOR_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">
                      Type de contrat
                    </label>
                    <select
                      value={offerData.contract_type}
                      onChange={(e) =>
                        setOfferData((p) => ({
                          ...p,
                          contract_type: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2.5 border border-ink-100 rounded-lg text-sm focus:outline-none focus:border-brand transition bg-white"
                    >
                      <option value="interim">Contrat intérimaire</option>
                      <option value="cdi">CDI</option>
                      <option value="cdd">CDD</option>
                      <option value="apprentissage">Apprentissage</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    Ville
                  </label>
                  <input
                    type="text"
                    value={offerData.city}
                    onChange={(e) =>
                      setOfferData((p) => ({ ...p, city: e.target.value }))
                    }
                    placeholder="Liège, Charleroi, Namur..."
                    className="w-full px-3 py-2.5 border border-ink-100 rounded-lg text-sm focus:outline-none focus:border-brand transition"
                  />
                </div>

                <button
                  onClick={() => setSkipOffer(true)}
                  className="text-xs text-ink-300 hover:text-ink-500 underline"
                >
                  Passer cette étape →
                </button>
              </div>
            ) : (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto">
                  <Sparkles size={24} className="text-green-600" />
                </div>
                <p className="text-sm text-ink-500">
                  Vous créerez vos offres depuis le tableau de bord.
                </p>
                <button
                  onClick={() => setSkipOffer(false)}
                  className="text-xs text-brand hover:underline"
                >
                  ← Créer une offre maintenant
                </button>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-2.5 border border-ink-100 rounded-lg text-sm font-medium text-ink-500 hover:bg-surface-2 transition"
              >
                Retour
              </button>
              <button
                onClick={handleFinish}
                disabled={loading}
                className="flex-1 bg-brand text-white py-2.5 rounded-lg font-medium text-sm hover:bg-brand-dark transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <Check size={16} /> Accéder au dashboard
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
