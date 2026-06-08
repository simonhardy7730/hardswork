"use client";

import { useState, useTransition } from "react";
import {
  Building2,
  Users,
  CreditCard,
  Palette,
  Check,
  AlertCircle,
  Copy,
  Trash2,
  Crown,
  Eye,
  Edit3,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import type { Organization, User, Subscription, UserRole } from "@/lib/supabase/types";
import { REGION_LABELS } from "@/lib/utils";
import {
  updateOrganization,
  updateCustomization,
  updateMemberRole,
  removeMember,
  updateCurrentUserName,
} from "@/app/(dashboard)/dashboard/settings/actions";

interface Props {
  org: Organization;
  currentUser: User;
  members: User[];
  subscription: Subscription | null;
}

type Tab = "organisation" | "equipe" | "abonnement" | "personnalisation";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "organisation", label: "Organisation", icon: Building2 },
  { id: "equipe", label: "Équipe", icon: Users },
  { id: "abonnement", label: "Abonnement", icon: CreditCard },
  { id: "personnalisation", label: "Personnalisation", icon: Palette },
];

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrateur",
  recruiter: "Recruteur",
  viewer: "Observateur",
};

const ROLE_COLORS: Record<UserRole, string> = {
  admin: "bg-blue-100 text-blue-700",
  recruiter: "bg-green-100 text-green-700",
  viewer: "bg-gray-100 text-gray-600",
};

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  pro: "Pro",
  agency: "Agency",
};

const PLAN_PRICES: Record<string, string> = {
  starter: "79 €/mois",
  pro: "149 €/mois",
  agency: "299 €/mois",
};

const PLAN_FEATURES: Record<string, string[]> = {
  starter: ["1 recruteur", "5 offres actives", "50 candidats"],
  pro: ["3 recruteurs", "Offres illimitées", "Candidats illimités", "Matching auto"],
  agency: ["Recruteurs illimités", "Multi-clients", "Tableau de bord avancé", "Support prioritaire"],
};

function Alert({
  type,
  message,
  onClose,
}: {
  type: "success" | "error";
  message: string;
  onClose: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm mb-4 ${
        type === "success"
          ? "bg-green-50 border border-green-200 text-green-700"
          : "bg-red-50 border border-red-200 text-red-700"
      }`}
    >
      {type === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 text-lg leading-none">
        ×
      </button>
    </div>
  );
}

// ── Tab: Organisation ────────────────────────────────────
function OrgTab({
  org,
  currentUser,
}: {
  org: Organization;
  currentUser: User;
}) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [profilePending, startProfileTransition] = useTransition();
  const [profileFeedback, setProfileFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const isAdmin = currentUser.role === "admin";

  async function handleOrgSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateOrganization(fd);
      if (result.success) {
        setFeedback({ type: "success", message: "Informations mises à jour avec succès." });
      } else {
        setFeedback({ type: "error", message: result.error ?? "Une erreur est survenue." });
      }
    });
  }

  async function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startProfileTransition(async () => {
      const result = await updateCurrentUserName(fd);
      if (result.success) {
        setProfileFeedback({ type: "success", message: "Profil mis à jour." });
      } else {
        setProfileFeedback({ type: "error", message: result.error ?? "Une erreur est survenue." });
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Mon profil */}
      <div className="bg-white rounded-xl border border-ink-100 p-6">
        <h2 className="text-base font-semibold text-ink mb-1">Mon profil</h2>
        <p className="text-sm text-ink-500 mb-4">Vos informations personnelles.</p>

        {profileFeedback && (
          <Alert
            type={profileFeedback.type}
            message={profileFeedback.message}
            onClose={() => setProfileFeedback(null)}
          />
        )}

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1.5">
                Nom complet
              </label>
              <input
                name="full_name"
                defaultValue={currentUser.full_name}
                required
                className="w-full px-3 py-2 text-sm border border-ink-100 rounded-lg focus:outline-none focus:border-brand transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1.5">
                Adresse e-mail
              </label>
              <input
                value={currentUser.email}
                disabled
                className="w-full px-3 py-2 text-sm border border-ink-100 rounded-lg bg-surface text-ink-300 cursor-not-allowed"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={profilePending}
              className="px-4 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark disabled:opacity-50 transition flex items-center gap-2"
            >
              {profilePending && <RefreshCw size={14} className="animate-spin" />}
              Enregistrer
            </button>
          </div>
        </form>
      </div>

      {/* Infos organisation */}
      <div className="bg-white rounded-xl border border-ink-100 p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-semibold text-ink">Informations organisation</h2>
          {!isAdmin && (
            <span className="text-xs text-ink-300 flex items-center gap-1">
              <Eye size={12} /> Lecture seule
            </span>
          )}
        </div>
        <p className="text-sm text-ink-500 mb-4">
          Ces informations apparaissent sur vos formulaires de candidature publics.
        </p>

        {feedback && (
          <Alert
            type={feedback.type}
            message={feedback.message}
            onClose={() => setFeedback(null)}
          />
        )}

        <form onSubmit={handleOrgSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1.5">
                Nom de l&apos;organisation <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                defaultValue={org.name}
                required
                disabled={!isAdmin}
                className="w-full px-3 py-2 text-sm border border-ink-100 rounded-lg focus:outline-none focus:border-brand disabled:bg-surface disabled:text-ink-300 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1.5">
                Type
              </label>
              <input
                value={org.type === "agency" ? "Agence d'intérim" : "Entreprise"}
                disabled
                className="w-full px-3 py-2 text-sm border border-ink-100 rounded-lg bg-surface text-ink-300 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#475569] mb-1.5">
              Adresse
            </label>
            <input
              name="address"
              defaultValue={org.address ?? ""}
              disabled={!isAdmin}
              className="w-full px-3 py-2 text-sm border border-ink-100 rounded-lg focus:outline-none focus:border-brand disabled:bg-surface disabled:text-ink-300 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1.5">
                Ville
              </label>
              <input
                name="city"
                defaultValue={org.city ?? ""}
                disabled={!isAdmin}
                className="w-full px-3 py-2 text-sm border border-ink-100 rounded-lg focus:outline-none focus:border-brand disabled:bg-surface disabled:text-ink-300 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1.5">
                Région
              </label>
              <select
                name="region"
                defaultValue={org.region ?? ""}
                disabled={!isAdmin}
                className="w-full px-3 py-2 text-sm border border-ink-100 rounded-lg focus:outline-none focus:border-brand disabled:bg-surface disabled:text-ink-300 transition"
              >
                <option value="">Sélectionner...</option>
                {Object.entries(REGION_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1.5">
                Téléphone
              </label>
              <input
                name="phone"
                type="tel"
                defaultValue={org.phone ?? ""}
                disabled={!isAdmin}
                className="w-full px-3 py-2 text-sm border border-ink-100 rounded-lg focus:outline-none focus:border-brand disabled:bg-surface disabled:text-ink-300 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1.5">
                E-mail
              </label>
              <input
                name="email"
                type="email"
                defaultValue={org.email ?? ""}
                disabled={!isAdmin}
                className="w-full px-3 py-2 text-sm border border-ink-100 rounded-lg focus:outline-none focus:border-brand disabled:bg-surface disabled:text-ink-300 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1.5">
                Site web
              </label>
              <input
                name="website"
                type="url"
                placeholder="https://"
                defaultValue={org.website ?? ""}
                disabled={!isAdmin}
                className="w-full px-3 py-2 text-sm border border-ink-100 rounded-lg focus:outline-none focus:border-brand disabled:bg-surface disabled:text-ink-300 transition"
              />
            </div>
          </div>

          {isAdmin && (
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark disabled:opacity-50 transition flex items-center gap-2"
              >
                {isPending && <RefreshCw size={14} className="animate-spin" />}
                Enregistrer les modifications
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

// ── Tab: Équipe ──────────────────────────────────────────
function TeamTab({
  members,
  currentUser,
  orgId,
}: {
  members: User[];
  currentUser: User;
  orgId: string;
}) {
  const [copied, setCopied] = useState(false);
  const [roleLoading, setRoleLoading] = useState<string | null>(null);
  const [removeLoading, setRemoveLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const isAdmin = currentUser.role === "admin";

  const inviteLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/signup?org=${orgId}&role=recruiter`
      : `/signup?org=${orgId}&role=recruiter`;

  async function copyInviteLink() {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  async function handleRoleChange(memberId: string, role: string) {
    setRoleLoading(memberId);
    const result = await updateMemberRole(memberId, role);
    setRoleLoading(null);
    if (result.error) {
      setFeedback({ type: "error", message: result.error });
    } else {
      setFeedback({ type: "success", message: "Rôle mis à jour." });
    }
  }

  async function handleRemove(memberId: string, name: string) {
    if (!confirm(`Retirer ${name} de l'organisation ?`)) return;
    setRemoveLoading(memberId);
    const result = await removeMember(memberId);
    setRemoveLoading(null);
    if (result.error) {
      setFeedback({ type: "error", message: result.error });
    } else {
      setFeedback({ type: "success", message: "Membre retiré." });
    }
  }

  return (
    <div className="space-y-6">
      {/* Invite section */}
      {isAdmin && (
        <div className="bg-white rounded-xl border border-ink-100 p-6">
          <h2 className="text-base font-semibold text-ink mb-1">
            Inviter un membre
          </h2>
          <p className="text-sm text-ink-500 mb-4">
            Partagez ce lien avec votre collègue. Il devra créer un compte HardSwork
            pour rejoindre votre organisation.
          </p>
          <div className="flex gap-2">
            <input
              readOnly
              value={inviteLink}
              className="flex-1 px-3 py-2 text-sm border border-ink-100 rounded-lg bg-surface text-ink-500 font-mono"
            />
            <button
              onClick={copyInviteLink}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition ${
                copied
                  ? "bg-green-100 text-green-700"
                  : "bg-brand text-white hover:bg-brand-dark"
              }`}
            >
              {copied ? (
                <>
                  <Check size={14} /> Copié !
                </>
              ) : (
                <>
                  <Copy size={14} /> Copier
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-ink-300 mt-2">
            💡 Le lien pré-remplit le champ organisation lors de l&apos;inscription.
          </p>
        </div>
      )}

      {/* Members list */}
      <div className="bg-white rounded-xl border border-ink-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F1F5F9] flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">
            Membres de l&apos;équipe
          </h2>
          <span className="text-xs font-medium bg-surface-2 text-ink-500 px-2.5 py-1 rounded-full">
            {members.length} membre{members.length > 1 ? "s" : ""}
          </span>
        </div>

        {feedback && (
          <div className="px-6 pt-4">
            <Alert
              type={feedback.type}
              message={feedback.message}
              onClose={() => setFeedback(null)}
            />
          </div>
        )}

        <ul className="divide-y divide-[#F1F5F9]">
          {members.map((member) => {
            const isMe = member.id === currentUser.id;
            const initials = member.full_name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <li key={member.id} className="flex items-center gap-4 px-6 py-4">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                  <span className="text-brand text-xs font-bold">{initials}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-ink truncate">
                      {member.full_name}
                    </p>
                    {isMe && (
                      <span className="text-[10px] bg-brand/10 text-brand px-1.5 py-0.5 rounded font-medium">
                        Vous
                      </span>
                    )}
                    {member.role === "admin" && (
                      <Crown size={12} className="text-[#F59E0B]" />
                    )}
                  </div>
                  <p className="text-xs text-ink-300 truncate">{member.email}</p>
                </div>

                {/* Role */}
                <div>
                  {isAdmin && !isMe ? (
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value)}
                      disabled={roleLoading === member.id}
                      className="text-xs border border-ink-100 rounded-lg px-2 py-1.5 focus:outline-none focus:border-brand disabled:opacity-50 transition"
                    >
                      <option value="admin">Administrateur</option>
                      <option value="recruiter">Recruteur</option>
                      <option value="viewer">Observateur</option>
                    </select>
                  ) : (
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        ROLE_COLORS[member.role]
                      }`}
                    >
                      {ROLE_LABELS[member.role]}
                    </span>
                  )}
                </div>

                {/* Remove */}
                {isAdmin && !isMe && (
                  <button
                    onClick={() => handleRemove(member.id, member.full_name)}
                    disabled={removeLoading === member.id}
                    className="p-1.5 text-ink-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                    title="Retirer"
                  >
                    {removeLoading === member.id ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Roles explanation */}
      <div className="bg-surface rounded-xl border border-ink-100 p-4">
        <p className="text-xs font-semibold text-[#475569] mb-3">Rôles disponibles</p>
        <div className="space-y-2">
          {(
            [
              { role: "admin", desc: "Accès complet : organisation, équipe, offres, candidats, paramètres." },
              { role: "recruiter", desc: "Gestion des offres, candidats et pipeline. Ne peut pas modifier l'organisation." },
              { role: "viewer", desc: "Lecture seule. Peut voir le dashboard mais pas modifier." },
            ] as { role: UserRole; desc: string }[]
          ).map(({ role, desc }) => (
            <div key={role} className="flex items-start gap-2">
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${ROLE_COLORS[role]}`}>
                {ROLE_LABELS[role]}
              </span>
              <p className="text-xs text-ink-500">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Tab: Abonnement ──────────────────────────────────────
function SubscriptionTab({ subscription }: { subscription: Subscription | null }) {
  const plan = subscription?.plan ?? "starter";
  const status = subscription?.status ?? "trial";

  const trialDaysLeft = subscription?.trial_ends_at
    ? Math.max(
        0,
        Math.ceil(
          (new Date(subscription.trial_ends_at).getTime() - Date.now()) /
            86_400_000
        )
      )
    : 0;

  const periodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString("fr-BE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="space-y-6">
      {/* Current plan */}
      <div className="bg-white rounded-xl border border-ink-100 p-6">
        <h2 className="text-base font-semibold text-ink mb-4">
          Abonnement actuel
        </h2>

        <div className="flex items-start gap-4 p-4 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl mb-4">
          <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center shrink-0">
            <CreditCard size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-bold text-ink text-lg">
                Plan {PLAN_LABELS[plan]}
              </p>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  status === "trial"
                    ? "bg-amber-100 text-amber-700"
                    : status === "active"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {status === "trial"
                  ? "Période d'essai"
                  : status === "active"
                  ? "Actif"
                  : "Annulé"}
              </span>
            </div>
            <p className="text-sm text-ink-500">{PLAN_PRICES[plan]}</p>
          </div>
        </div>

        {/* Trial countdown */}
        {status === "trial" && (
          <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
            <span className="text-xl">⏳</span>
            <div>
              <p className="text-sm font-medium text-amber-800">
                {trialDaysLeft > 0
                  ? `Il vous reste ${trialDaysLeft} jour${trialDaysLeft > 1 ? "s" : ""} d'essai gratuit`
                  : "Votre période d'essai est terminée"}
              </p>
              <p className="text-xs text-amber-600">
                Aucune carte bancaire requise pendant l&apos;essai.
              </p>
            </div>
          </div>
        )}

        {/* Renewal date */}
        {status === "active" && periodEnd && (
          <p className="text-xs text-ink-300 mb-4">
            Prochain renouvellement le <strong>{periodEnd}</strong>
          </p>
        )}

        {/* Features */}
        <ul className="space-y-2 mb-4">
          {PLAN_FEATURES[plan].map((feat) => (
            <li key={feat} className="flex items-center gap-2 text-sm text-[#475569]">
              <Check size={14} className="text-green-500 shrink-0" />
              {feat}
            </li>
          ))}
        </ul>
      </div>

      {/* Upgrade CTA */}
      {plan !== "agency" && (
        <div className="bg-gradient-to-br from-brand to-[#3B82F6] rounded-xl p-6 text-white">
          <h3 className="font-bold text-lg mb-1">
            {plan === "starter" ? "Passez au plan Pro" : "Passez au plan Agency"}
          </h3>
          <p className="text-blue-100 text-sm mb-4">
            {plan === "starter"
              ? "Débloquez le matching automatique, les offres illimitées et plus encore."
              : "Gérez plusieurs clients, des recruteurs illimités et un support prioritaire."}
          </p>
          <button className="flex items-center gap-2 bg-white text-brand font-semibold px-5 py-2.5 rounded-lg hover:bg-blue-50 transition text-sm">
            <ExternalLink size={14} />
            Voir les offres
          </button>
        </div>
      )}

      {/* All plans comparison */}
      <div className="bg-white rounded-xl border border-ink-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F1F5F9]">
          <h3 className="text-sm font-semibold text-ink">
            Comparatif des formules
          </h3>
        </div>
        <div className="grid grid-cols-3 divide-x divide-[#F1F5F9]">
          {(["starter", "pro", "agency"] as const).map((p) => (
            <div
              key={p}
              className={`p-4 ${p === plan ? "bg-[#EFF6FF]" : ""}`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                {p === plan && <Check size={12} className="text-brand" />}
                <p className="text-sm font-bold text-ink">
                  {PLAN_LABELS[p]}
                </p>
              </div>
              <p className="text-xs font-medium text-brand mb-3">
                {PLAN_PRICES[p]}
              </p>
              <ul className="space-y-1.5">
                {PLAN_FEATURES[p].map((feat) => (
                  <li key={feat} className="flex items-start gap-1.5 text-xs text-ink-500">
                    <Check size={11} className="text-green-500 mt-0.5 shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Cancel */}
      {status === "active" && (
        <div className="bg-white rounded-xl border border-ink-100 p-6">
          <h3 className="text-sm font-semibold text-ink mb-1">
            Résiliation
          </h3>
          <p className="text-sm text-ink-500 mb-3">
            Vous pouvez résilier à tout moment. Votre accès reste actif jusqu&apos;à
            la fin de la période facturée.
          </p>
          <button className="text-sm text-red-500 hover:text-red-700 hover:underline transition">
            Résilier mon abonnement
          </button>
        </div>
      )}
    </div>
  );
}

// ── Tab: Personnalisation ────────────────────────────────
function CustomizationTab({
  org,
  currentUser,
}: {
  org: Organization;
  currentUser: User;
}) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [previewColor, setPreviewColor] = useState(org.primary_color ?? "#D93B12");
  const [previewLogo, setPreviewLogo] = useState(org.logo_url ?? "");
  const isAdmin = currentUser.role === "admin";

  const PRESET_COLORS = [
    "#D93B12", // REKRUUT blue
    "#7C3AED", // violet
    "#059669", // green
    "#DC2626", // red
    "#D97706", // amber
    "#0891B2", // cyan
    "#DB2777", // pink
    "#374151", // dark gray
  ];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateCustomization(fd);
      if (result.success) {
        setFeedback({ type: "success", message: "Personnalisation enregistrée." });
      } else {
        setFeedback({ type: "error", message: result.error ?? "Une erreur est survenue." });
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-ink-100 p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-semibold text-ink">
            Apparence du formulaire public
          </h2>
          {!isAdmin && (
            <span className="text-xs text-ink-300 flex items-center gap-1">
              <Eye size={12} /> Lecture seule
            </span>
          )}
        </div>
        <p className="text-sm text-ink-500 mb-5">
          Ces réglages s&apos;appliquent à la page de candidature publique de vos
          offres (hardswork.be/postuler/…).
        </p>

        {feedback && (
          <Alert
            type={feedback.type}
            message={feedback.message}
            onClose={() => setFeedback(null)}
          />
        )}

        <div className="grid grid-cols-2 gap-8">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Logo URL */}
            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1.5">
                URL du logo
              </label>
              <input
                name="logo_url"
                type="url"
                placeholder="https://votre-site.be/logo.png"
                value={previewLogo}
                onChange={(e) => setPreviewLogo(e.target.value)}
                disabled={!isAdmin}
                className="w-full px-3 py-2 text-sm border border-ink-100 rounded-lg focus:outline-none focus:border-brand disabled:bg-surface disabled:text-ink-300 transition"
              />
              <p className="text-xs text-ink-300 mt-1">
                Format recommandé : PNG ou SVG, fond transparent, min 200×200px.
              </p>
            </div>

            {/* Color picker */}
            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1.5">
                Couleur principale
              </label>

              {/* Presets */}
              <div className="flex gap-2 mb-2 flex-wrap">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    disabled={!isAdmin}
                    onClick={() => setPreviewColor(color)}
                    className={`w-7 h-7 rounded-full border-2 transition ${
                      previewColor === color
                        ? "border-[#0F0E0D] scale-110"
                        : "border-transparent hover:scale-110"
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>

              {/* Custom hex */}
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={previewColor}
                  onChange={(e) => setPreviewColor(e.target.value)}
                  disabled={!isAdmin}
                  className="w-9 h-9 rounded-lg border border-ink-100 cursor-pointer disabled:cursor-not-allowed"
                />
                <input
                  name="primary_color"
                  value={previewColor}
                  onChange={(e) => setPreviewColor(e.target.value)}
                  disabled={!isAdmin}
                  placeholder="#D93B12"
                  className="flex-1 px-3 py-2 text-sm border border-ink-100 rounded-lg font-mono focus:outline-none focus:border-brand disabled:bg-surface disabled:text-ink-300 transition"
                />
              </div>
            </div>

            {isAdmin && (
              <button
                type="submit"
                disabled={isPending}
                className="w-full py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                {isPending && <RefreshCw size={14} className="animate-spin" />}
                Enregistrer la personnalisation
              </button>
            )}
          </form>

          {/* Preview */}
          <div>
            <p className="text-xs font-medium text-[#475569] mb-2 flex items-center gap-1">
              <Eye size={12} /> Aperçu du formulaire
            </p>
            <div className="rounded-xl border border-ink-100 overflow-hidden shadow-sm">
              {/* Header preview */}
              <div
                className="px-4 py-3 flex items-center gap-3"
                style={{ backgroundColor: previewColor }}
              >
                {previewLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewLogo}
                    alt="Logo"
                    className="w-8 h-8 rounded object-contain bg-white/20"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/20"
                  >
                    <span className="text-white font-bold text-sm">
                      {org.name[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-white font-bold text-sm">{org.name}</p>
                  <p className="text-white/70 text-xs">
                    {org.city ?? "Wallonie"}
                  </p>
                </div>
              </div>
              {/* Body preview */}
              <div className="bg-white px-4 py-3 space-y-2">
                <div className="h-2 bg-surface-2 rounded w-3/4" />
                <div className="h-2 bg-surface-2 rounded w-1/2" />
                <div className="mt-3 h-8 rounded-lg" style={{ backgroundColor: previewColor, opacity: 0.15 }} />
                <div
                  className="mt-2 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: previewColor }}
                >
                  <span className="text-white text-xs font-medium">Postuler maintenant</span>
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: previewColor }} />
              <span className="text-xs font-mono text-ink-500">{previewColor}</span>
              <Edit3 size={11} className="text-ink-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      {isAdmin && (
        <div className="bg-white rounded-xl border border-red-200 p-6">
          <h2 className="text-sm font-semibold text-red-600 mb-1">Zone de danger</h2>
          <p className="text-sm text-ink-500 mb-3">
            Ces actions sont irréversibles. Procédez avec précaution.
          </p>
          <button className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 border border-red-200 hover:border-red-300 px-4 py-2 rounded-lg hover:bg-red-50 transition">
            <Trash2 size={14} />
            Supprimer l&apos;organisation
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────
export default function SettingsPage({ org, currentUser, members, subscription }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("organisation");

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">Paramètres</h1>
        <p className="text-sm text-ink-500 mt-0.5">
          Gérez votre organisation, votre équipe et votre abonnement.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-2 p-1 rounded-xl mb-6">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === id
                ? "bg-white text-ink shadow-sm"
                : "text-ink-500 hover:text-ink"
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "organisation" && (
        <OrgTab org={org} currentUser={currentUser} />
      )}
      {activeTab === "equipe" && (
        <TeamTab members={members} currentUser={currentUser} orgId={org.id} />
      )}
      {activeTab === "abonnement" && (
        <SubscriptionTab subscription={subscription} />
      )}
      {activeTab === "personnalisation" && (
        <CustomizationTab org={org} currentUser={currentUser} />
      )}
    </div>
  );
}
