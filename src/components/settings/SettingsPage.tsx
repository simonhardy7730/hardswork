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
import { labels } from "@/lib/utils";
import { useL, useLang } from "@/lib/i18n/context";
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

const TABS: { id: Tab; fr: string; nl: string; icon: React.ElementType }[] = [
  { id: "organisation", fr: "Organisation", nl: "Organisatie", icon: Building2 },
  { id: "equipe", fr: "Équipe", nl: "Team", icon: Users },
  { id: "abonnement", fr: "Abonnement", nl: "Abonnement", icon: CreditCard },
  { id: "personnalisation", fr: "Personnalisation", nl: "Aanpassing", icon: Palette },
];

const roleLabels = (l: (fr: string, nl: string) => string): Record<UserRole, string> => ({
  admin: l("Administrateur", "Beheerder"),
  recruiter: l("Recruteur", "Recruiter"),
  viewer: l("Observateur", "Waarnemer"),
});

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

const planFeatures = (l: (fr: string, nl: string) => string): Record<string, string[]> => ({
  starter: [l("1 recruteur", "1 recruiter"), l("5 offres actives", "5 actieve vacatures"), l("50 candidats", "50 kandidaten")],
  pro: [l("3 recruteurs", "3 recruiters"), l("Offres illimitées", "Onbeperkt vacatures"), l("Candidats illimités", "Onbeperkt kandidaten"), l("Matching auto", "Automatische matching")],
  agency: [l("Recruteurs illimités", "Onbeperkt recruiters"), l("Multi-clients", "Meerdere klanten"), l("Tableau de bord avancé", "Geavanceerd dashboard"), l("Support prioritaire", "Prioritaire ondersteuning")],
});

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
  const l = useL();
  const lang = useLang();
  const REGION_LABELS = labels(lang).region;
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
        setFeedback({ type: "success", message: l("Informations mises à jour avec succès.", "Gegevens succesvol bijgewerkt.") });
      } else {
        setFeedback({ type: "error", message: result.error ?? l("Une erreur est survenue.", "Er is een fout opgetreden.") });
      }
    });
  }

  async function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startProfileTransition(async () => {
      const result = await updateCurrentUserName(fd);
      if (result.success) {
        setProfileFeedback({ type: "success", message: l("Profil mis à jour.", "Profiel bijgewerkt.") });
      } else {
        setProfileFeedback({ type: "error", message: result.error ?? l("Une erreur est survenue.", "Er is een fout opgetreden.") });
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Mon profil */}
      <div className="bg-white rounded-xl border border-ink-100 p-6">
        <h2 className="text-base font-semibold text-ink mb-1">{l("Mon profil", "Mijn profiel")}</h2>
        <p className="text-sm text-ink-500 mb-4">{l("Vos informations personnelles.", "Uw persoonlijke gegevens.")}</p>

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
                {l("Nom complet", "Volledige naam")}
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
                {l("Adresse e-mail", "E-mailadres")}
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
              {l("Enregistrer", "Opslaan")}
            </button>
          </div>
        </form>
      </div>

      {/* Infos organisation */}
      <div className="bg-white rounded-xl border border-ink-100 p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-semibold text-ink">{l("Informations organisation", "Gegevens van de organisatie")}</h2>
          {!isAdmin && (
            <span className="text-xs text-ink-300 flex items-center gap-1">
              <Eye size={12} /> {l("Lecture seule", "Alleen lezen")}
            </span>
          )}
        </div>
        <p className="text-sm text-ink-500 mb-4">
          {l("Ces informations apparaissent sur vos formulaires de candidature publics.", "Deze gegevens verschijnen op uw openbare sollicitatieformulieren.")}
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
                {l("Nom de l'organisation", "Naam van de organisatie")} <span className="text-red-500">*</span>
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
                {l("Type", "Type")}
              </label>
              <input
                value={org.type === "agency" ? l("Agence d'intérim", "Uitzendkantoor") : l("Entreprise", "Bedrijf")}
                disabled
                className="w-full px-3 py-2 text-sm border border-ink-100 rounded-lg bg-surface text-ink-300 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#475569] mb-1.5">
              {l("Adresse", "Adres")}
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
                {l("Ville", "Stad")}
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
                {l("Région", "Regio")}
              </label>
              <select
                name="region"
                defaultValue={org.region ?? ""}
                disabled={!isAdmin}
                className="w-full px-3 py-2 text-sm border border-ink-100 rounded-lg focus:outline-none focus:border-brand disabled:bg-surface disabled:text-ink-300 transition"
              >
                <option value="">{l("Sélectionner...", "Selecteren...")}</option>
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
                {l("Téléphone", "Telefoon")}
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
                {l("Site web", "Website")}
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
                {l("Enregistrer les modifications", "Wijzigingen opslaan")}
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
  const l = useL();
  const ROLE_LABELS = roleLabels(l);
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
      setFeedback({ type: "success", message: l("Rôle mis à jour.", "Rol bijgewerkt.") });
    }
  }

  async function handleRemove(memberId: string, name: string) {
    if (!confirm(l(`Retirer ${name} de l'organisation ?`, `${name} uit de organisatie verwijderen?`))) return;
    setRemoveLoading(memberId);
    const result = await removeMember(memberId);
    setRemoveLoading(null);
    if (result.error) {
      setFeedback({ type: "error", message: result.error });
    } else {
      setFeedback({ type: "success", message: l("Membre retiré.", "Lid verwijderd.") });
    }
  }

  return (
    <div className="space-y-6">
      {/* Invite section */}
      {isAdmin && (
        <div className="bg-white rounded-xl border border-ink-100 p-6">
          <h2 className="text-base font-semibold text-ink mb-1">
            {l("Inviter un membre", "Een lid uitnodigen")}
          </h2>
          <p className="text-sm text-ink-500 mb-4">
            {l("Partagez ce lien avec votre collègue. Il devra créer un compte Wolko pour rejoindre votre organisation.", "Deel deze link met uw collega. Die moet een Wolko-account aanmaken om zich bij uw organisatie aan te sluiten.")}
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
                  <Check size={14} /> {l("Copié !", "Gekopieerd!")}
                </>
              ) : (
                <>
                  <Copy size={14} /> {l("Copier", "Kopiëren")}
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-ink-300 mt-2">
            {l("💡 Le lien pré-remplit le champ organisation lors de l'inscription.", "💡 De link vult het organisatieveld vooraf in bij de registratie.")}
          </p>
        </div>
      )}

      {/* Members list */}
      <div className="bg-white rounded-xl border border-ink-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F1F5F9] flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">
            {l("Membres de l'équipe", "Teamleden")}
          </h2>
          <span className="text-xs font-medium bg-surface-2 text-ink-500 px-2.5 py-1 rounded-full">
            {members.length} {members.length > 1 ? l("membres", "leden") : l("membre", "lid")}
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
                        {l("Vous", "U")}
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
                      <option value="admin">{ROLE_LABELS.admin}</option>
                      <option value="recruiter">{ROLE_LABELS.recruiter}</option>
                      <option value="viewer">{ROLE_LABELS.viewer}</option>
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
                    title={l("Retirer", "Verwijderen")}
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
        <p className="text-xs font-semibold text-[#475569] mb-3">{l("Rôles disponibles", "Beschikbare rollen")}</p>
        <div className="space-y-2">
          {(
            [
              { role: "admin", desc: l("Accès complet : organisation, équipe, offres, candidats, paramètres.", "Volledige toegang: organisatie, team, vacatures, kandidaten, instellingen.") },
              { role: "recruiter", desc: l("Gestion des offres, candidats et pipeline. Ne peut pas modifier l'organisation.", "Beheer van vacatures, kandidaten en pipeline. Kan de organisatie niet wijzigen.") },
              { role: "viewer", desc: l("Lecture seule. Peut voir le dashboard mais pas modifier.", "Alleen lezen. Kan het dashboard bekijken maar niets wijzigen.") },
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
  const l = useL();
  const lang = useLang();
  const PLAN_FEATURES = planFeatures(l);
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
    ? new Date(subscription.current_period_end).toLocaleDateString(lang === "nl" ? "nl-BE" : "fr-BE", {
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
          {l("Abonnement actuel", "Huidig abonnement")}
        </h2>

        <div className="flex items-start gap-4 p-4 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl mb-4">
          <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center shrink-0">
            <CreditCard size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-bold text-ink text-lg">
                {l("Plan", "Abonnement")} {PLAN_LABELS[plan]}
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
                  ? l("Période d'essai", "Proefperiode")
                  : status === "active"
                  ? l("Actif", "Actief")
                  : l("Annulé", "Geannuleerd")}
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
                  ? l(`Il vous reste ${trialDaysLeft} jour${trialDaysLeft > 1 ? "s" : ""} de période d'essai`, `Nog ${trialDaysLeft} ${trialDaysLeft > 1 ? "dagen" : "dag"} proefperiode`)
                  : l("Votre période d'essai est terminée", "Uw proefperiode is afgelopen")}
              </p>
            </div>
          </div>
        )}

        {/* Renewal date */}
        {status === "active" && periodEnd && (
          <p className="text-xs text-ink-300 mb-4">
            {l("Prochain renouvellement le", "Volgende verlenging op")} <strong>{periodEnd}</strong>
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
            {plan === "starter" ? l("Passez au plan Pro", "Neem het Pro-abonnement") : l("Passez au plan Agency", "Neem het Agency-abonnement")}
          </h3>
          <p className="text-blue-100 text-sm mb-4">
            {plan === "starter"
              ? l("Débloquez le matching automatique, les offres illimitées et plus encore.", "Ontgrendel automatische matching, onbeperkt vacatures en meer.")
              : l("Gérez plusieurs clients, des recruteurs illimités et un support prioritaire.", "Beheer meerdere klanten, onbeperkt recruiters en prioritaire ondersteuning.")}
          </p>
          <button className="flex items-center gap-2 bg-white text-brand font-semibold px-5 py-2.5 rounded-lg hover:bg-blue-50 transition text-sm">
            <ExternalLink size={14} />
            {l("Voir les offres", "Abonnementen bekijken")}
          </button>
        </div>
      )}

      {/* All plans comparison */}
      <div className="bg-white rounded-xl border border-ink-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F1F5F9]">
          <h3 className="text-sm font-semibold text-ink">
            {l("Comparatif des formules", "Vergelijking van de formules")}
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
            {l("Résiliation", "Opzegging")}
          </h3>
          <p className="text-sm text-ink-500 mb-3">
            {l("Vous pouvez résilier à tout moment. Votre accès reste actif jusqu'à la fin de la période facturée.", "U kunt op elk moment opzeggen. Uw toegang blijft actief tot het einde van de gefactureerde periode.")}
          </p>
          <button className="text-sm text-red-500 hover:text-red-700 hover:underline transition">
            {l("Résilier mon abonnement", "Mijn abonnement opzeggen")}
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
  const l = useL();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [previewColor, setPreviewColor] = useState(org.primary_color ?? "#FFB900");
  const [previewLogo, setPreviewLogo] = useState(org.logo_url ?? "");
  const isAdmin = currentUser.role === "admin";

  const PRESET_COLORS = [
    "#FFB900", // REKRUUT blue
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
        setFeedback({ type: "success", message: l("Personnalisation enregistrée.", "Aanpassing opgeslagen.") });
      } else {
        setFeedback({ type: "error", message: result.error ?? l("Une erreur est survenue.", "Er is een fout opgetreden.") });
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-ink-100 p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-semibold text-ink">
            {l("Apparence du formulaire public", "Uiterlijk van het openbare formulier")}
          </h2>
          {!isAdmin && (
            <span className="text-xs text-ink-300 flex items-center gap-1">
              <Eye size={12} /> {l("Lecture seule", "Alleen lezen")}
            </span>
          )}
        </div>
        <p className="text-sm text-ink-500 mb-5">
          {l("Ces réglages s'appliquent à la page de candidature publique de vos offres (wolko.be/postuler/…).", "Deze instellingen gelden voor de openbare sollicitatiepagina van uw vacatures (wolko.be/postuler/…).")}
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
                {l("URL du logo", "Logo-URL")}
              </label>
              <input
                name="logo_url"
                type="url"
                placeholder={l("https://votre-site.be/logo.png", "https://uw-site.be/logo.png")}
                value={previewLogo}
                onChange={(e) => setPreviewLogo(e.target.value)}
                disabled={!isAdmin}
                className="w-full px-3 py-2 text-sm border border-ink-100 rounded-lg focus:outline-none focus:border-brand disabled:bg-surface disabled:text-ink-300 transition"
              />
              <p className="text-xs text-ink-300 mt-1">
                {l("Format recommandé : PNG ou SVG, fond transparent, min 200×200px.", "Aanbevolen formaat: PNG of SVG, transparante achtergrond, min. 200×200px.")}
              </p>
            </div>

            {/* Color picker */}
            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1.5">
                {l("Couleur principale", "Hoofdkleur")}
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
                        ? "border-[#101F43] scale-110"
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
                  placeholder="#FFB900"
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
                {l("Enregistrer la personnalisation", "Aanpassing opslaan")}
              </button>
            )}
          </form>

          {/* Preview */}
          <div>
            <p className="text-xs font-medium text-[#475569] mb-2 flex items-center gap-1">
              <Eye size={12} /> {l("Aperçu du formulaire", "Voorbeeld van het formulier")}
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
                    {org.city ?? ""}
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
                  <span className="text-white text-xs font-medium">{l("Postuler maintenant", "Nu solliciteren")}</span>
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
          <h2 className="text-sm font-semibold text-red-600 mb-1">{l("Zone de danger", "Gevarenzone")}</h2>
          <p className="text-sm text-ink-500 mb-3">
            {l("Ces actions sont irréversibles. Procédez avec précaution.", "Deze acties zijn onomkeerbaar. Ga voorzichtig te werk.")}
          </p>
          <button className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 border border-red-200 hover:border-red-300 px-4 py-2 rounded-lg hover:bg-red-50 transition">
            <Trash2 size={14} />
            {l("Supprimer l'organisation", "Organisatie verwijderen")}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────
export default function SettingsPage({ org, currentUser, members, subscription }: Props) {
  const l = useL();
  const [activeTab, setActiveTab] = useState<Tab>("organisation");

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">{l("Paramètres", "Instellingen")}</h1>
        <p className="text-sm text-ink-500 mt-0.5">
          {l("Gérez votre organisation, votre équipe et votre abonnement.", "Beheer uw organisatie, uw team en uw abonnement.")}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-2 p-1 rounded-xl mb-6">
        {TABS.map(({ id, fr, nl, icon: Icon }) => (
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
            {l(fr, nl)}
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
