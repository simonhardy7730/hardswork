"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  Copy,
  Pause,
  Play,
  Users,
  AlertCircle,
  Briefcase,
  ChevronRight,
  Eye,
  MoreVertical,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  CONTRACT_LABELS,
  SECTOR_LABELS,
  REGION_LABELS,
  formatDate,
} from "@/lib/utils";
import type { JobOffer, JobStatus } from "@/lib/supabase/types";

const STATUS_CONFIG: Record<
  JobStatus,
  { label: string; color: string; dot: string }
> = {
  active: {
    label: "Active",
    color: "bg-green-100 text-green-700",
    dot: "bg-green-500",
  },
  draft: {
    label: "Brouillon",
    color: "bg-gray-100 text-gray-600",
    dot: "bg-gray-400",
  },
  paused: {
    label: "En pause",
    color: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
  },
  closed: {
    label: "Clôturée",
    color: "bg-red-100 text-red-600",
    dot: "bg-red-400",
  },
};

const SECTOR_ICONS: Record<string, string> = {
  logistique: "📦",
  industrie: "⚙️",
  construction: "🏗️",
  transport: "🚛",
  nettoyage: "🧹",
  securite: "🛡️",
  autre: "💼",
};

export default function OffresTable({ offres }: { offres: JobOffer[] }) {
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function toggleStatus(offre: JobOffer) {
    const supabase = createClient();
    const newStatus: JobStatus =
      offre.status === "active"
        ? "paused"
        : offre.status === "paused"
          ? "active"
          : "active";
    await supabase
      .from("job_offers")
      .update({ status: newStatus })
      .eq("id", offre.id);
    router.refresh();
  }

  async function closeOffer(id: string) {
    const supabase = createClient();
    await supabase
      .from("job_offers")
      .update({ status: "closed" })
      .eq("id", id);
    setOpenMenu(null);
    router.refresh();
  }

  function copyLink(id: string) {
    const url = `${window.location.origin}/postuler/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (offres.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-ink-100 py-16 text-center">
        <Briefcase size={40} className="text-[#E8E2DA] mx-auto mb-4" />
        <h3 className="text-sm font-semibold text-ink mb-1">
          Aucune offre
        </h3>
        <p className="text-sm text-ink-300 mb-4">
          Créez votre première offre d&apos;emploi pour démarrer.
        </p>
        <Link
          href="/dashboard/offres/nouvelle"
          className="inline-flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-dark transition"
        >
          Créer une offre
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-ink-100 overflow-hidden">
      {/* Header table */}
      <div className="hidden lg:grid grid-cols-[2fr_1fr_1fr_1fr_80px_100px_120px] gap-3 px-5 py-3 bg-surface border-b border-ink-100 text-xs font-semibold text-ink-500 uppercase tracking-wide">
        <span>Poste</span>
        <span>Secteur</span>
        <span>Ville</span>
        <span>Contrat</span>
        <span className="text-center">Candidat.</span>
        <span>Statut</span>
        <span>Actions</span>
      </div>

      <div className="divide-y divide-[#F1F5F9]">
        {offres.map((offre) => {
          const statusCfg = STATUS_CONFIG[offre.status];
          return (
            <div
              key={offre.id}
              className="grid lg:grid-cols-[2fr_1fr_1fr_1fr_80px_100px_120px] gap-3 items-center px-5 py-4 hover:bg-surface transition group"
            >
              {/* Titre + badges */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-surface-2 flex items-center justify-center shrink-0 text-lg">
                  {SECTOR_ICONS[offre.sector] ?? "💼"}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/offres/${offre.id}/candidatures`}
                      className="text-sm font-semibold text-ink hover:text-brand truncate transition"
                    >
                      {offre.title}
                    </Link>
                    {offre.is_urgent && (
                      <span className="shrink-0 flex items-center gap-1 bg-red-50 text-red-600 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                        <AlertCircle size={10} />
                        URGENT
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-ink-300 mt-0.5">
                    {formatDate(offre.created_at)} · {REGION_LABELS[offre.region]}
                  </div>
                </div>
              </div>

              {/* Secteur */}
              <div className="hidden lg:block text-sm text-ink-500">
                {SECTOR_LABELS[offre.sector]}
              </div>

              {/* Ville */}
              <div className="hidden lg:block text-sm text-ink-500">
                {offre.city}
              </div>

              {/* Contrat */}
              <div className="hidden lg:block text-sm text-ink-500">
                {CONTRACT_LABELS[offre.contract_type]}
              </div>

              {/* Candidatures */}
              <div className="hidden lg:flex justify-center">
                <Link
                  href={`/dashboard/offres/${offre.id}/candidatures`}
                  className="flex items-center gap-1 text-sm font-semibold text-ink hover:text-brand transition"
                >
                  <Users size={14} className="text-ink-300" />
                  {offre.applications_count}
                </Link>
              </div>

              {/* Statut */}
              <div className="hidden lg:block">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${statusCfg.color}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`}
                  />
                  {statusCfg.label}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 justify-end">
                {/* Voir candidatures */}
                <Link
                  href={`/dashboard/offres/${offre.id}/candidatures`}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-500 hover:bg-surface-2 hover:text-brand transition"
                  title="Voir les candidatures"
                >
                  <Eye size={15} />
                </Link>

                {/* Copier lien */}
                <button
                  onClick={() => copyLink(offre.id)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-500 hover:bg-surface-2 hover:text-brand transition"
                  title="Copier le lien de candidature"
                >
                  {copiedId === offre.id ? (
                    <span className="text-[10px] text-green-600 font-bold">
                      ✓
                    </span>
                  ) : (
                    <Copy size={15} />
                  )}
                </button>

                {/* Pause/Play */}
                {(offre.status === "active" || offre.status === "paused") && (
                  <button
                    onClick={() => toggleStatus(offre)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-500 hover:bg-surface-2 hover:text-brand transition"
                    title={
                      offre.status === "active"
                        ? "Mettre en pause"
                        : "Réactiver"
                    }
                  >
                    {offre.status === "active" ? (
                      <Pause size={15} />
                    ) : (
                      <Play size={15} />
                    )}
                  </button>
                )}

                {/* Menu */}
                <div className="relative">
                  <button
                    onClick={() =>
                      setOpenMenu(openMenu === offre.id ? null : offre.id)
                    }
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-500 hover:bg-surface-2 transition"
                  >
                    <MoreVertical size={15} />
                  </button>
                  {openMenu === offre.id && (
                    <div className="absolute right-0 top-9 z-20 w-44 bg-white rounded-xl border border-ink-100 shadow-lg py-1">
                      <a
                        href={`/postuler/${offre.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-surface-2 transition"
                      >
                        <ExternalLink size={14} />
                        Voir l&apos;offre publique
                      </a>
                      <Link
                        href={`/dashboard/offres/${offre.id}/qrcode`}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-surface-2 transition"
                      >
                        <ChevronRight size={14} />
                        QR Code
                      </Link>
                      {offre.status !== "closed" && (
                        <button
                          onClick={() => closeOffer(offre.id)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition w-full"
                        >
                          <X size={14} />
                          Clôturer l&apos;offre
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
