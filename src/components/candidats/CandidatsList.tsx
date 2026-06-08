"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Search, Phone, Mail, MapPin, Clock,
  Zap, Award, ChevronRight, Lock, Users,
} from "lucide-react";
import { SECTOR_LABELS, REGION_LABELS } from "@/lib/utils";
import type { Candidate } from "@/lib/supabase/types";

/* ─── Types ──────────────────────────────────────────── */
interface JobOfferBasic {
  id: string;
  title: string;
  sector: string;
  required_licenses: string[];
  required_languages: string[];
  status: string;
}

interface Props {
  candidats: Candidate[];
  total: number;
  searchParams: {
    q?: string;
    disponibilite?: string;
    secteurs?: string;
    caces?: string;
    permis?: string;
    region?: string;
  };
  offresActives: JobOfferBasic[];
  hasSubscription: boolean;
}

/* ─── Données filtres ────────────────────────────────── */
const FILTER_SECTORS = [
  { key: "logistique",   label: "Logistique" },
  { key: "construction", label: "Construction" },
  { key: "industrie",    label: "Industrie" },
  { key: "transport",    label: "Transport" },
  { key: "medical",      label: "Médical" },
  { key: "securite",     label: "Sécurité" },
  { key: "nettoyage",    label: "Nettoyage" },
];

const FILTER_CERTIFS = [
  { key: "vca",     label: "VCA",                  type: "caces"  },
  { key: "caces",   label: "CACES",                type: "caces"  },
  { key: "B",       label: "Permis B",             type: "permis" },
  { key: "C",       label: "Permis C",             type: "permis" },
  { key: "CE",      label: "Permis CE",            type: "permis" },
];

const AVAILABILITY_OPTIONS = [
  { value: "",           label: "Tous" },
  { value: "immediate",  label: "Immédiate" },
  { value: "1_semaine",  label: "Préavis de 1 semaine" },
  { value: "1_mois",     label: "Préavis de 1 mois" },
];

/* ─── Helpers ────────────────────────────────────────── */
function buildTags(c: Candidate): string[] {
  const tags: string[] = [];
  c.caces_types?.forEach(t => tags.push(t));
  c.licenses?.forEach(l => tags.push(`Permis ${l}`));
  c.sectors?.slice(0, 2).forEach(s => {
    const label = SECTOR_LABELS[s];
    if (label) tags.push(label);
  });
  return tags.slice(0, 5);
}

function getMatchScore(c: Candidate, o: JobOfferBasic): number {
  let score = 0;
  if (c.sectors?.includes(o.sector)) score += 2;
  o.required_licenses?.forEach(l => { if (c.licenses?.includes(l)) score++; });
  if (o.required_licenses?.length > 0 && c.has_caces) score++;
  if (c.availability === "immediate") score++;
  return score;
}

/* ─── Composant ──────────────────────────────────────── */
export default function CandidatsList({
  candidats,
  total,
  searchParams,
  offresActives,
  hasSubscription,
}: Props) {
  const router   = useRouter();
  const pathname = usePathname();

  /* Filtres locaux (checkboxes secteurs multi-select) */
  const [localSectors, setLocalSectors] = useState<string[]>(
    searchParams.secteurs ? searchParams.secteurs.split(",").filter(Boolean) : []
  );
  const [searchText, setSearchText] = useState(searchParams.q ?? "");

  /* Mettre à jour un paramètre URL */
  function update(key: string, value: string) {
    const params = new URLSearchParams(
      Object.entries(searchParams).filter(([, v]) => !!v) as [string, string][]
    );
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  /* Appliquer les filtres secteurs */
  function applySectors(sectors: string[]) {
    const params = new URLSearchParams(
      Object.entries(searchParams).filter(([, v]) => !!v) as [string, string][]
    );
    if (sectors.length > 0) params.set("secteurs", sectors.join(","));
    else params.delete("secteurs");
    router.push(`${pathname}?${params.toString()}`);
  }

  function toggleSector(key: string) {
    const next = localSectors.includes(key)
      ? localSectors.filter(s => s !== key)
      : [...localSectors, key];
    setLocalSectors(next);
    applySectors(next);
  }

  /* Match auto */
  const matchMap = new Map<string, number>(
    candidats.map(c => [c.id, offresActives.length > 0
      ? Math.max(...offresActives.map(o => getMatchScore(c, o)))
      : 0])
  );

  /* ────────────────────────────────────────────────── */
  return (
    <div className="flex gap-0 h-full -m-6">

      {/* ══ SIDEBAR FILTRES ════════════════════════════ */}
      <aside className="w-56 shrink-0 bg-white border-r border-ink-100 overflow-y-auto p-4 space-y-5">

        {/* Recherche rapide */}
        <form onSubmit={e => { e.preventDefault(); update("q", searchText); }}>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-300" />
            <input
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder="Nom, ville…"
              className="w-full pl-8 pr-3 py-2 text-xs border border-ink-100 rounded-lg focus:outline-none focus:border-brand transition bg-surface"
            />
          </div>
        </form>

        {/* ── Secteur ── */}
        <div>
          <p className="text-[10px] font-black text-ink uppercase tracking-widest mb-2.5">Secteur</p>
          <div className="space-y-1.5">
            {FILTER_SECTORS.map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={localSectors.includes(key)}
                  onChange={() => toggleSector(key)}
                  className="w-3.5 h-3.5 rounded border-ink-100 text-brand accent-brand cursor-pointer"
                />
                <span className={`text-xs font-medium transition-colors ${localSectors.includes(key) ? "text-brand" : "text-ink-700 group-hover:text-ink"}`}>
                  {label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* ── Localisation ── */}
        <div>
          <p className="text-[10px] font-black text-ink uppercase tracking-widest mb-2.5">Localisation</p>
          <select
            value={searchParams.region ?? ""}
            onChange={e => update("region", e.target.value)}
            className="w-full text-xs border border-ink-100 rounded-lg px-2.5 py-2 focus:outline-none focus:border-brand transition bg-surface appearance-none"
          >
            <option value="">Toute la Belgique</option>
            {Object.entries(REGION_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>

        {/* ── Disponibilité ── */}
        <div>
          <p className="text-[10px] font-black text-ink uppercase tracking-widest mb-2.5">Disponibilité</p>
          <div className="space-y-1.5">
            {AVAILABILITY_OPTIONS.map(({ value, label }) => (
              <label key={value} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="dispo"
                  checked={(searchParams.disponibilite ?? "") === value}
                  onChange={() => update("disponibilite", value)}
                  className="w-3.5 h-3.5 accent-brand cursor-pointer"
                />
                <span className={`text-xs font-medium ${(searchParams.disponibilite ?? "") === value ? "text-brand" : "text-ink-700"}`}>
                  {label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* ── Permis / Certifications ── */}
        <div>
          <p className="text-[10px] font-black text-ink uppercase tracking-widest mb-2.5">Permis / Certifications</p>
          <div className="space-y-1.5">
            {FILTER_CERTIFS.map(({ key, label, type }) => {
              const isActive = type === "caces"
                ? searchParams.caces === "1"
                : searchParams.permis === key;
              return (
                <label key={key} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={() => {
                      if (type === "caces") update("caces", isActive ? "" : "1");
                      else update("permis", isActive ? "" : key);
                    }}
                    className="w-3.5 h-3.5 rounded border-ink-100 accent-brand cursor-pointer"
                  />
                  <span className={`text-xs font-medium ${isActive ? "text-brand" : "text-ink-700"}`}>
                    {label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Réinitialiser */}
        {(localSectors.length > 0 || searchParams.disponibilite || searchParams.caces || searchParams.permis || searchParams.region || searchParams.q) && (
          <button
            onClick={() => {
              setLocalSectors([]);
              setSearchText("");
              router.push(pathname);
            }}
            className="text-[11px] text-brand hover:text-brand-dark font-bold underline-offset-2 hover:underline transition"
          >
            Réinitialiser les filtres
          </button>
        )}
      </aside>

      {/* ══ CONTENU PRINCIPAL ══════════════════════════ */}
      <div className="flex-1 overflow-y-auto p-6 bg-surface">

        {/* Headline */}
        <div className="mb-6">
          <h1
            className="font-display font-black text-ink uppercase leading-none mb-1"
            style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", letterSpacing: "-0.01em" }}
          >
            Votre prochaine{" "}
            <span className="text-brand">[Recrue]</span>{" "}
            est ici.
          </h1>
          <p className="text-ink-500 text-sm">
            <span className="font-bold text-ink">{total.toLocaleString("fr-BE")}</span> profil{total > 1 ? "s" : ""} qualifié{total > 1 ? "s" : ""} disponible{total > 1 ? "s" : ""}
          </p>
        </div>

        {/* Empty state */}
        {candidats.length === 0 && (
          <div className="bg-white border border-ink-100 rounded-2xl py-16 text-center">
            <Users size={40} className="text-ink-100 mx-auto mb-3" />
            <p className="font-display font-black text-ink text-lg mb-1">Aucun candidat trouvé</p>
            <p className="text-sm text-ink-500">Ajustez vos filtres ou revenez plus tard.</p>
          </div>
        )}

        {/* Liste */}
        {candidats.length > 0 && (
          <div className="bg-white border border-ink-100 rounded-2xl overflow-hidden">
            {candidats.map((c, idx) => {
              const isUnlocked = hasSubscription;
              const tags = buildTags(c);
              const score = matchMap.get(c.id) ?? 0;
              const initials = `${c.first_name?.[0] ?? ""}${c.last_name?.[0] ?? ""}`.toUpperCase();

              return (
                <div
                  key={c.id}
                  className={`flex items-center gap-3 px-5 py-3.5 border-b border-ink-100 last:border-0 hover:bg-surface transition-colors ${!isUnlocked ? "opacity-80" : ""}`}
                >
                  {/* Badge PRO / NON-PRO */}
                  <div className="shrink-0 w-14 flex flex-col items-center gap-1">
                    <span className={`text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full ${
                      isUnlocked
                        ? "bg-brand text-white"
                        : "bg-ink-100 text-ink-300"
                    }`}>
                      {isUnlocked ? "PRO" : "NON-PRO"}
                    </span>
                    {score >= 2 && (
                      <span className="text-[8px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                        ★ Match
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black font-display shrink-0 ${
                      isUnlocked ? "bg-brand text-white" : "bg-ink-100 text-ink-300"
                    }`}
                  >
                    {initials}
                  </div>

                  {/* Infos principales */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <Link
                        href={`/dashboard/candidats/${c.id}`}
                        className="font-display font-black text-ink text-[14px] hover:text-brand transition-colors uppercase tracking-tight"
                      >
                        {c.first_name}{" "}
                        <span className="text-brand">[{c.last_name.toUpperCase()}]</span>
                      </Link>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Titre / Secteur */}
                      {c.sectors?.[0] && (
                        <span className="text-[11px] text-ink-500 font-semibold">
                          {c.sectors.map(s => SECTOR_LABELS[s] ?? s).join(" · ")}
                        </span>
                      )}
                      {/* Expérience */}
                      {c.experience_years != null && (
                        <span className="flex items-center gap-1 text-[11px] text-ink-300">
                          <Clock size={10} />
                          {c.experience_years === 0 ? "Débutant" : `${c.experience_years} ans d'exp.`}
                        </span>
                      )}
                      {/* Ville */}
                      {c.city && (
                        <span className="flex items-center gap-1 text-[11px] text-ink-300">
                          <MapPin size={10} />
                          {c.city}
                          {c.region ? `, ${REGION_LABELS[c.region as string] ?? c.region}` : ""}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tags compétences */}
                  <div className="hidden lg:flex items-center gap-1.5 flex-wrap max-w-[260px]">
                    {tags.map((tag, i) => (
                      <span key={i}
                        className="text-[10px] font-bold bg-surface border border-ink-100 text-ink-700 px-2 py-0.5 rounded-md">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Actions droite */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isUnlocked ? (
                      <>
                        {/* Bouton CONTACTER */}
                        <Link
                          href={`/dashboard/candidats/${c.id}`}
                          className="font-display font-black text-white bg-brand hover:bg-brand-dark rounded-lg px-3 py-2 text-[11px] uppercase tracking-wide transition hidden sm:flex items-center gap-1.5"
                        >
                          Contacter
                          <ChevronRight size={11} />
                        </Link>
                        {/* Icônes contact rapide */}
                        <a href={`tel:${c.phone}`}
                          className="w-8 h-8 rounded-lg bg-surface border border-ink-100 flex items-center justify-center text-ink-300 hover:text-brand hover:border-brand/30 transition"
                          title={c.phone}>
                          <Phone size={13} />
                        </a>
                        {c.email && (
                          <a href={`mailto:${c.email}`}
                            className="w-8 h-8 rounded-lg bg-surface border border-ink-100 flex items-center justify-center text-ink-300 hover:text-brand hover:border-brand/30 transition"
                            title={c.email}>
                            <Mail size={13} />
                          </a>
                        )}
                      </>
                    ) : (
                      <>
                        {/* Lock CTA */}
                        <Link href="/#tarifs"
                          className="font-display font-black text-brand bg-brand/10 hover:bg-brand/15 border border-brand/20 rounded-lg px-3 py-2 text-[11px] uppercase tracking-wide transition hidden sm:flex items-center gap-1.5">
                          <Lock size={10} />
                          Débloquer
                        </Link>
                        {/* Icônes grisées */}
                        <div className="w-8 h-8 rounded-lg bg-surface border border-ink-100 flex items-center justify-center text-ink-100 cursor-not-allowed">
                          <Phone size={13} />
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-surface border border-ink-100 flex items-center justify-center text-ink-100 cursor-not-allowed">
                          <Mail size={13} />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CTA abonnement si non abonné */}
        {!hasSubscription && candidats.length > 0 && (
          <div className="mt-5 bg-[#0F0E0D] rounded-2xl p-5 flex items-center justify-between gap-4">
            <div>
              <p className="font-display font-black text-white text-base mb-0.5">
                Débloquez tous les contacts
              </p>
              <p className="text-white/40 text-xs">
                Passez à un plan Pro pour accéder aux coordonnées directes de tous vos candidats.
              </p>
            </div>
            <Link href="/#tarifs"
              className="btn-brand shrink-0"
              style={{ fontSize: "0.8rem", padding: "0.5rem 1rem" }}>
              Voir les tarifs
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
