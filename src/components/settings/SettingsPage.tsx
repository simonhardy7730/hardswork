"use client";

import { useState, useTransition, useEffect } from "react";
import ContractSection from "./ContractSection";
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
  createInvite,
  revokeInvite,
} from "@/app/(dashboard)/dashboard/settings/actions";

interface Props {
  org: Organization;
  currentUser: User;
  members: User[];
  subscription: Subscription | null;
  invites: { id: string; email: string; role: string; expires_at: string }[];
  /** Calculé côté serveur (horloge du serveur) */
  billing: BillingView;
}

export interface BillingView {
  hasAccess: boolean;
  state: "trial" | "trial_expired" | "active" | "cancelled_running" | "ended" | "none";
  trialDaysLeft: number;
  trialEndsAtIso: string | null;
  /** Prix mensuel HT à payer aujourd'hui pour chaque formule */
  pro: { price: number; strikethrough: number | null; discount: number | null };
  agency: { price: number; strikethrough: number | null; discount: number | null };
  launch: boolean;
  /** Tarif verrouillé de l'abonnement en cours (€), s'il existe */
  founderPrice: number | null;
  founderEndsAtIso: string | null;
  /** Contrat d'engagement (migration 023), calculé côté serveur */
  contract: {
    startDay: string; endDay: string; noticeDeadlineDay: string; phase: "initial" | "indefinite";
    nextBillingDay: string | null; priceAfterCents: number; termsVersion: string | null;
    cancel: { requestedDay: string; lastDay: string; noticeRespected: boolean; effective: boolean } | null;
  } | null;
  history: { id: string; type: string; at: string }[];
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
  invites,
}: {
  members: User[];
  currentUser: User;
  invites: { id: string; email: string; role: string; expires_at: string }[];
}) {
  const l = useL();
  const ROLE_LABELS = roleLabels(l);
  const [copied, setCopied] = useState(false);
  const [roleLoading, setRoleLoading] = useState<string | null>(null);
  const [removeLoading, setRemoveLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const isAdmin = currentUser.role === "admin";

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"recruiter" | "viewer" | "admin">("recruiter");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [invitePending, startInvite] = useTransition();

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    startInvite(async () => {
      const res = await createInvite(inviteEmail, inviteRole);
      if ("token" in res && res.token) {
        setInviteLink(`${window.location.origin}/signup?invite=${res.token}`);
        setFeedback(("emailed" in res && res.emailed)
          ? { type: "success", message: l(`Invitation envoyée par e-mail à ${inviteEmail}.`, `Uitnodiging per e-mail verzonden naar ${inviteEmail}.`) }
          : { type: "error", message: l("L'e-mail n'a pas pu partir : copiez le lien ci-dessous et envoyez-le vous-même.", "De e-mail kon niet worden verzonden: kopieer de link hieronder en stuur hem zelf door.") });
        setInviteEmail("");
      } else {
        setFeedback({ type: "error", message: ("error" in res && res.error) || l("Une erreur est survenue.", "Er is een fout opgetreden.") });
      }
    });
  }

  async function copyInviteLink() {
    if (!inviteLink) return;
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
            {l("Indiquez l'adresse e-mail de votre collègue : un lien d'invitation personnel, valable 7 jours et utilisable une seule fois, sera généré. Seule cette adresse pourra l'utiliser.", "Geef het e-mailadres van je collega op: er wordt een persoonlijke uitnodigingslink gemaakt, 7 dagen geldig en slechts één keer bruikbaar. Alleen dat adres kan hem gebruiken.")}
          </p>
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2">
            <input
              type="email" required value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
              placeholder={l("collegue@entreprise.be", "collega@bedrijf.be")}
              className="flex-1 px-3 py-2 text-sm border border-ink-100 rounded-lg focus:outline-none focus:border-brand"
            />
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as "recruiter" | "viewer" | "admin")}
              className="px-3 py-2 text-sm border border-ink-100 rounded-lg bg-white">
              <option value="recruiter">{ROLE_LABELS.recruiter}</option>
              <option value="viewer">{ROLE_LABELS.viewer}</option>
              <option value="admin">{ROLE_LABELS.admin}</option>
            </select>
            <button type="submit" disabled={invitePending}
              className="px-4 py-2 text-sm font-medium bg-brand text-white rounded-lg hover:bg-brand-dark disabled:opacity-50 transition flex items-center justify-center gap-2">
              {invitePending && <RefreshCw size={14} className="animate-spin" />}
              {l("Créer l'invitation", "Uitnodiging maken")}
            </button>
          </form>

          {inviteLink && (
            <div className="mt-4 p-3 rounded-lg bg-surface border border-ink-100">
              <p className="text-xs text-ink-500 mb-2">{l("Copiez ce lien maintenant et envoyez-le à votre collègue (il ne sera plus affiché) :", "Kopieer deze link nu en stuur hem naar je collega (hij wordt niet meer getoond):")}</p>
              <div className="flex gap-2">
                <input readOnly value={inviteLink} className="flex-1 px-3 py-2 text-xs border border-ink-100 rounded-lg bg-white text-ink-500 font-mono" />
                <button onClick={copyInviteLink}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition ${copied ? "bg-green-100 text-green-700" : "bg-brand text-white hover:bg-brand-dark"}`}>
                  {copied ? (<><Check size={14} /> {l("Copié !", "Gekopieerd!")}</>) : (<><Copy size={14} /> {l("Copier", "Kopiëren")}</>)}
                </button>
              </div>
            </div>
          )}

          {invites.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-semibold text-[#475569] mb-2">{l("Invitations en attente", "Openstaande uitnodigingen")}</p>
              <ul className="divide-y divide-[#F1F5F9] border border-ink-100 rounded-lg">
                {invites.map((inv) => (
                  <li key={inv.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                    <span className="truncate text-ink">{inv.email} <span className="text-xs text-ink-300">· {ROLE_LABELS[inv.role as UserRole] ?? inv.role}</span></span>
                    <button
                      onClick={async () => { await revokeInvite(inv.id); }}
                      className="text-xs text-red-500 hover:underline shrink-0">
                      {l("Annuler", "Annuleren")}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
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
function SubscriptionTab({ subscription, billing, isAdmin }: { subscription: Subscription | null; billing: BillingView; isAdmin: boolean }) {
  const l = useL();
  const lang = useLang();
  const locale = lang === "nl" ? "nl-BE" : "fr-BE";
  const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" }) : null;

  const plan = subscription?.plan ?? "pro";
  const planName = plan === "agency" ? l("Agence", "Kantoor") : "Pro";
  const state = billing.state;
  const periodEnd = fmt(subscription?.current_period_end ?? null);
  const trialEnd = fmt(billing.trialEndsAtIso);
  const mailto = (subject: string) => `mailto:hello@wolko.be?subject=${encodeURIComponent(subject)}`;

  const statusBadge =
    state === "trial"
      ? { cls: "bg-amber-100 text-amber-700", txt: l("Essai gratuit", "Gratis proef") }
      : state === "active"
      ? { cls: "bg-green-100 text-green-700", txt: l("Actif", "Actief") }
      : state === "cancelled_running"
      ? { cls: "bg-amber-100 text-amber-700", txt: l("Résilié (accès jusqu'à la fin de période)", "Opgezegd (toegang tot einde periode)") }
      : { cls: "bg-red-100 text-red-600", txt: state === "trial_expired" ? l("Essai terminé", "Proef afgelopen") : l("Aucun abonnement actif", "Geen actief abonnement") };

  const cards: { id: "pro" | "agency"; name: string; feats: string[] }[] = [
    {
      id: "pro",
      name: "Pro",
      feats: [l("Offres illimitées", "Onbeperkt vacatures"), l("Coordonnées des candidats", "Contactgegevens van kandidaten"), l("Candidathèque", "Kandidatendatabank")],
    },
    {
      id: "agency",
      name: l("Agence", "Kantoor"),
      feats: [l("Clients et missions", "Klanten en opdrachten"), l("ATS de recrutement", "ATS voor werving"), l("Équipe et rôles", "Team en rollen")],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-ink-100 p-6">
        <h2 className="text-base font-semibold text-ink mb-4">{l("Abonnement actuel", "Huidig abonnement")}</h2>

        <div className="flex items-start gap-4 p-4 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl mb-4">
          <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center shrink-0">
            <CreditCard size={18} className="text-[#101F43]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <p className="font-bold text-ink text-lg">
                {state === "active" || state === "cancelled_running" ? `${l("Formule", "Formule")} ${planName}` : l("Essai gratuit de 7 jours", "Gratis proef van 7 dagen")}
              </p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadge.cls}`}>{statusBadge.txt}</span>
            </div>
            {(state === "active" || state === "cancelled_running") && subscription?.monthly_price_cents ? (
              <p className="text-sm text-ink-500">{(subscription.monthly_price_cents / 100).toLocaleString(locale)} € {l("/mois HT", "/maand excl. btw")}</p>
            ) : null}
          </div>
        </div>

        {state === "trial" && (
          <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
            <span className="text-xl">⏳</span>
            <p className="text-sm font-medium text-amber-800">
              {l(
                `Il vous reste ${billing.trialDaysLeft} jour${billing.trialDaysLeft > 1 ? "s" : ""} d'essai`,
                `Nog ${billing.trialDaysLeft} ${billing.trialDaysLeft > 1 ? "dagen" : "dag"} proefperiode`
              )}
              {trialEnd ? l(` — fin de l'essai le ${trialEnd}`, ` — einde proefperiode op ${trialEnd}`) : ""}
            </p>
          </div>
        )}

        {(state === "trial_expired" || state === "ended") && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4 text-sm text-red-700">
            {state === "trial_expired"
              ? l("Votre essai gratuit est terminé. Vos données sont conservées selon notre politique de confidentialité. Choisissez un abonnement pour continuer à publier des offres et à contacter les candidats.",
                  "Je gratis proefperiode is afgelopen. Je gegevens worden bewaard volgens ons privacybeleid. Kies een abonnement om vacatures te blijven publiceren en kandidaten te contacteren.")
              : l("Vous n'avez pas d'abonnement actif. Vos données sont conservées selon notre politique de confidentialité. Choisissez un abonnement pour retrouver l'accès complet.",
                  "Je hebt geen actief abonnement. Je gegevens worden bewaard volgens ons privacybeleid. Kies een abonnement om weer volledige toegang te krijgen.")}
          </div>
        )}

        {state === "active" && periodEnd && (
          <p className="text-xs text-ink-300 mb-2">
            {l("Prochain renouvellement le", "Volgende verlenging op")} <strong>{periodEnd}</strong>
          </p>
        )}
        {(state === "active" || state === "cancelled_running") && billing.founderPrice !== null && billing.founderEndsAtIso && (
          <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            {l(
              `Tarif de lancement conservé jusqu'au ${fmt(billing.founderEndsAtIso)} (${billing.founderPrice} €/mois HT).`,
              `Lanceringstarief behouden tot ${fmt(billing.founderEndsAtIso)} (${billing.founderPrice} €/maand excl. btw).`
            )}
          </p>
        )}
      </div>

      {/* Formules */}
      <div className="bg-white rounded-xl border border-ink-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#F1F5F9]">
          <h3 className="text-sm font-semibold text-ink">{l("Nos formules", "Onze formules")}</h3>
          {billing.launch && (
            <p className="text-xs text-[#B87C2A] font-bold mt-0.5">
              {l("Offre de lancement jusqu'au 31 décembre 2026 — tarif conservé 12 mois à compter de la souscription.", "Lanceringsaanbod tot 31 december 2026 — tarief behouden gedurende 12 maanden vanaf onderschrijving.")}
            </p>
          )}
        </div>
        <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#F1F5F9]">
          {cards.map((c) => {
            const pr = billing[c.id];
            return (
              <div key={c.id} className={`p-5 ${c.id === plan ? "bg-[#FFFBF2]" : ""}`}>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-bold text-ink">{c.name}</p>
                  {pr.discount !== null && (
                    <span className="text-[10px] font-black uppercase bg-[#101F43] text-brand rounded-full px-2 py-0.5">−{pr.discount} %</span>
                  )}
                </div>
                <p className="mb-3">
                  {pr.strikethrough !== null && <span className="text-xs text-ink-300 line-through mr-1.5">{pr.strikethrough} €</span>}
                  <span className="text-xl font-black text-[#101F43]">{pr.price} €</span>
                  <span className="text-xs text-ink-500"> {l("/mois HT", "/maand excl. btw")}</span>
                </p>
                <ul className="space-y-1.5 mb-4">
                  {c.feats.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-xs text-ink-500">
                      <Check size={11} className="text-green-500 mt-0.5 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={mailto(l(`Souscription ${c.name} — WOLKO`, `Abonnement ${c.name} — WOLKO`))}
                  className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-[#101F43] font-bold px-4 py-2 rounded-lg transition text-xs"
                >
                  <ExternalLink size={12} />
                  {billing.launch ? l("Profiter de l'offre de lancement", "Profiteer van het lanceringsaanbod") : l("Souscrire", "Onderschrijven")}
                </a>
              </div>
            );
          })}
        </div>
        <p className="px-6 py-3 text-[11px] text-ink-400 border-t border-[#F1F5F9]" data-testid="contract-note">
          {l(
            "7 jours d'essai gratuits, sans carte bancaire et sans engagement. Après l'essai, abonnement payant sur souscription expresse, avec engagement initial de 12 mois et facturation mensuelle. Résiliation possible à l'échéance annuelle moyennant un préavis de 30 jours. Tarifs HTVA.",
            "7 dagen gratis proefperiode, zonder bankkaart en zonder verbintenis. Na de proefperiode volgt een betalend abonnement uitsluitend na uitdrukkelijke onderschrijving, met een initiële verbintenis van 12 maanden en maandelijkse facturatie. Opzegging is mogelijk op de jaarlijkse vervaldatum mits een opzegtermijn van 30 dagen. Prijzen excl. btw."
          )}
        </p>
        <p className="px-6 pb-3 text-[11px] text-ink-400">
          {l(
            "Le paiement en ligne n'est pas encore activé : la souscription est finalisée avec notre équipe (hello@wolko.be). Aucun prélèvement sans votre accord explicite.",
            "Online betalen is nog niet actief: je abonnement wordt afgerond met ons team (hello@wolko.be). Geen afschrijving zonder jouw uitdrukkelijke toestemming."
          )}
        </p>
      </div>

      <ContractSection billing={billing} plan={plan} priceCents={subscription?.monthly_price_cents ?? null} isAdmin={isAdmin} />
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
export default function SettingsPage({ org, currentUser, members, subscription, invites, billing }: Props) {
  const l = useL();
  const [activeTab, setActiveTab] = useState<Tab>("organisation");
  // Lien des e-mails : /dashboard/settings?tab=abonnement
  useEffect(() => {
    try {
      const t = new URLSearchParams(window.location.search).get("tab");
      if (t === "abonnement" || t === "equipe" || t === "organisation" || t === "personnalisation") setActiveTab(t);
    } catch { /* ignoré */ }
  }, []);

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
        <TeamTab members={members} currentUser={currentUser} invites={invites} />
      )}
      {activeTab === "abonnement" && (
        <SubscriptionTab subscription={subscription} billing={billing} isAdmin={currentUser.role === "admin"} />
      )}
      {activeTab === "personnalisation" && (
        <CustomizationTab org={org} currentUser={currentUser} />
      )}
    </div>
  );
}
