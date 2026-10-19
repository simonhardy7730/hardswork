"use client";

import { LANGUAGES } from "@/lib/languages";
import { regionForCity } from "@/lib/geo/distance";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  AlertCircle,
  Zap,
} from "lucide-react";
import {
  labels,
  SECTOR_TEMPLATES,
  JOB_TITLE_SUGGESTIONS,
} from "@/lib/utils";
import { useL, useLang } from "@/lib/i18n/context";
import type { JobOfferInsert, Region, Sector, ContractType } from "@/lib/supabase/types";
import OfferPlanningFields, { EMPTY_PLANNING, type OfferPlanning } from "@/components/offres/OfferPlanningFields";

// ── Types ─────────────────────────────────────────────

interface FormData {
  // Étape 1
  title: string;
  sector: Sector;
  contract_type: ContractType;
  city: string;
  postal_code: string;
  region: Region;
  start_date: string;
  is_urgent: boolean;
  // Étape 2
  salary_min: string;
  salary_max: string;
  salary_period: "heure" | "jour" | "mois";
  show_salary: boolean;
  shift_type: "jour" | "nuit" | "week-end" | "flexible";
  required_licenses: string[];
  required_caces: string[];
  required_languages: string[];
  experience_years: string;
  // Étape 3
  description: string;
}

const LICENSES = ["B", "C", "CE", "D"];
const CACES = ["CACES 1", "CACES 3", "CACES 5"];


const STEPS = [
  { num: 1, fr: "L'essentiel", nl: "Het essentiële" },
  { num: 2, fr: "Les critères", nl: "De criteria" },
  { num: 3, fr: "La description", nl: "De beschrijving" },
];

const SECTOR_ICONS: Record<string, string> = {
  logistique: "📦",
  industrie: "⚙️",
  construction: "🏗️",
  transport: "🚛",
  nettoyage: "🧹",
  securite: "🛡️",
  autre: "💼",
};

// ── Composant principal ───────────────────────────────

export default function NouvelleOffreForm({
  organizationId,
  userId,
}: {
  organizationId: string;
  userId: string;
}) {
  const router = useRouter();
  const l = useL();
  const lang = useLang();
  const { sector: SECTOR_LABELS, contract: CONTRACT_LABELS } = labels(lang);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [descriptionTemplateApplied, setDescriptionTemplateApplied] =
    useState(false);

  const [planning, setPlanning] = useState<OfferPlanning>(EMPTY_PLANNING);

  const [form, setForm] = useState<FormData>({
    title: "",
    sector: "logistique",
    contract_type: "interim",
    city: "",
    postal_code: "",
    region: "wallonie",
    start_date: "",
    is_urgent: false,
    salary_min: "",
    salary_max: "",
    salary_period: "heure",
    show_salary: true,
    shift_type: "jour",
    required_licenses: [],
    required_caces: [],
    required_languages: ["fr"],
    experience_years: "",
    description: "",
  });

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleArray(key: "required_licenses" | "required_caces" | "required_languages", val: string) {
    setForm((prev) => {
      const arr = prev[key] as string[];
      return {
        ...prev,
        [key]: arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val],
      };
    });
  }

  function applyTemplate() {
    const template = SECTOR_TEMPLATES[form.sector] ?? SECTOR_TEMPLATES["autre"];
    set("description", template);
    setDescriptionTemplateApplied(true);
  }

  function canGoNext() {
    if (step === 1) return form.title.trim() && form.city.trim() && /^\d{4}$/.test(form.postal_code);
    if (step === 2) return true;
    if (step === 3) return form.description.trim().length > 10;
    return false;
  }

  async function handleSubmit(status: "draft" | "active") {
    setLoading(true);
    const supabase = createClient();

    const payload: JobOfferInsert = {
      organization_id: organizationId,
      created_by: userId,
      title: form.title,
      sector: form.sector,
      contract_type: form.contract_type,
      city: form.city,
      postal_code: form.postal_code,
      region: regionForCity(form.city.trim()),
      start_date: form.start_date || null,
      is_urgent: form.is_urgent,
      salary_min: form.show_salary && form.salary_min ? parseInt(form.salary_min) : null,
      salary_max: form.show_salary && form.salary_max ? parseInt(form.salary_max) : null,
      salary_period: form.salary_period || null,
      show_salary: form.show_salary,
      shift_type: form.shift_type,
      required_licenses: form.required_licenses,
      required_languages: form.required_languages,
      description: form.description,
      status,
    };

    // Planning (migration 010) : uniquement pour les types concernés ; si les colonnes n'existent
    // pas encore, on enregistre l'offre sans planning plutôt que d'échouer.
    const hasPlanning = ["etudiant", "flexi", "interim"].includes(form.contract_type);
    const planningPayload: Partial<JobOfferInsert> = hasPlanning
      ? {
          work_date_from: planning.work_date_from || null,
          work_date_to: planning.work_date_to || null,
          days_needed: planning.days_needed,
          time_slots: planning.time_slots,
          schedule_note: planning.schedule_note.trim() || null,
          positions_count: Math.min(999, Math.max(1, parseInt(planning.positions_count) || 1)),
          recurrence: planning.recurrence || null,
          requirements: planning.requirements.trim() || null,
          work_location: planning.work_location.trim() || null,
        }
      : {};

    let { data, error } = await supabase
      .from("job_offers")
      .insert({ ...payload, ...planningPayload })
      .select()
      .single();
    // Code postal (migration 018) : tant que la colonne n'existe pas, on publie sans plutôt que d'échouer.
    if (error && /postal_code/.test(error.message ?? "")) {
      const { postal_code: _pc, ...withoutPostal } = payload;
      void _pc;
      ({ data, error } = await supabase.from("job_offers").insert({ ...withoutPostal, ...planningPayload }).select().single());
    }
    if (error && hasPlanning && /work_date|days_needed|time_slots|schedule_note|positions_count|recurrence|requirements|work_location/.test(error.message ?? "")) {
      ({ data, error } = await supabase.from("job_offers").insert(payload).select().single());
    }

    // Publication refusée par le serveur (ni essai ni abonnement en cours) : l'offre est gardée en brouillon
    // et on propose WOLKO Flash (annonce ponctuelle sans abonnement) pour la publier.
    if (error && status === "active" && error.code === "42501") {
      const { data: draft } = await supabase
        .from("job_offers")
        .insert({ ...payload, ...planningPayload, status: "draft" })
        .select()
        .single();
      if (draft) {
        router.push(`/dashboard/flash/commander?offre=${draft.id}`);
        return;
      }
    }

    if (error || !data) {
      setLoading(false);
      alert(l("Erreur lors de la création. Réessayez.", "Fout bij het aanmaken. Probeer opnieuw."));
      return;
    }

    router.push(`/dashboard/offres/${data.id}/confirmation`);
  }

  return (
    <div>
      {/* Progress */}
      <div className="flex items-center gap-3 mb-6">
        {STEPS.map((s, i) => (
          <div key={s.num} className="flex items-center gap-3 flex-1">
            <div className="flex items-center gap-2 shrink-0">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step > s.num
                    ? "bg-[#10B981] text-white"
                    : step === s.num
                      ? "bg-brand text-white"
                      : "bg-[#EADFC4] text-ink-300"
                }`}
              >
                {step > s.num ? <Check size={14} /> : s.num}
              </div>
              <span
                className={`text-sm font-medium ${step === s.num ? "text-ink" : "text-ink-300"}`}
              >
                {l(s.fr, s.nl)}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-px ${step > s.num ? "bg-[#10B981]" : "bg-[#EADFC4]"}`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-ink-100 p-6">
        {/* ══════════════ ÉTAPE 1 ══════════════ */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="font-semibold text-ink">
              {l("L'essentiel du poste", "Het essentiële van de functie")}
            </h2>

            {/* Titre */}
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                {l("Titre du poste *", "Functietitel *")}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => {
                    set("title", e.target.value);
                    setShowSuggestions(e.target.value.length > 1);
                  }}
                  onFocus={() =>
                    setShowSuggestions(form.title.length > 1)
                  }
                  onBlur={() =>
                    setTimeout(() => setShowSuggestions(false), 150)
                  }
                  placeholder={l("ex: Cariste CACES 3, Chauffeur SPL...", "bv. Heftruckchauffeur, Vrachtwagenchauffeur...")}
                  className="w-full px-3 py-2.5 border border-ink-100 rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition"
                />
                {/* Suggestions */}
                {showSuggestions && (
                  <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-ink-100 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {JOB_TITLE_SUGGESTIONS.filter((s) =>
                      s.toLowerCase().includes(form.title.toLowerCase())
                    ).map((suggestion) => (
                      <button
                        key={suggestion}
                        onMouseDown={() => {
                          set("title", suggestion);
                          setShowSuggestions(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-ink hover:bg-surface-2 transition"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Secteur */}
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                {l("Secteur *", "Sector *")}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(SECTOR_LABELS).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => set("sector", val as Sector)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition text-left ${
                      form.sector === val
                        ? "border-brand bg-blue-50 text-brand"
                        : "border-ink-100 text-ink-500 hover:border-brand/50"
                    }`}
                  >
                    <span>{SECTOR_ICONS[val]}</span>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Contrat */}
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                {l("Type de contrat *", "Soort contract *")}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(CONTRACT_LABELS).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => set("contract_type", val as ContractType)}
                    className={`py-2 px-3 rounded-lg border text-sm font-medium transition ${
                      form.contract_type === val
                        ? "border-brand bg-blue-50 text-brand"
                        : "border-ink-100 text-ink-500 hover:border-brand/50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Code postal + ville (la région est déduite automatiquement) */}
            <div className="grid grid-cols-[130px_1fr] gap-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  {l("Code postal *", "Postcode *")}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={form.postal_code}
                  onChange={(e) => set("postal_code", e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="7500"
                  className="w-full px-3 py-2.5 border border-ink-100 rounded-lg text-sm focus:outline-none focus:border-brand transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  {l("Ville *", "Stad *")}
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  placeholder={l("Tournai", "Gent")}
                  className="w-full px-3 py-2.5 border border-ink-100 rounded-lg text-sm focus:outline-none focus:border-brand transition"
                />
              </div>
            </div>

            {/* Date + Urgence */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  {l("Date de début", "Startdatum")}
                  <span className="text-ink-300 font-normal ml-1">{l("(optionnel)", "(optioneel)")}</span>
                </label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => set("start_date", e.target.value)}
                  className="w-full px-3 py-2.5 border border-ink-100 rounded-lg text-sm focus:outline-none focus:border-brand transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  {l("Urgence", "Dringend")}
                </label>
                <button
                  onClick={() => set("is_urgent", !form.is_urgent)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 border rounded-lg text-sm font-medium transition ${
                    form.is_urgent
                      ? "border-red-300 bg-red-50 text-red-600"
                      : "border-ink-100 text-ink-500 hover:border-ink-100"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <AlertCircle size={15} />
                    {l("Poste urgent", "Dringende functie")}
                  </span>
                  <div
                    className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${
                      form.is_urgent ? "bg-red-500" : "bg-[#EADFC4]"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        form.is_urgent ? "translate-x-4" : ""
                      }`}
                    />
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ ÉTAPE 2 ══════════════ */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="font-semibold text-ink">
              {l("Critères du candidat", "Criteria voor de kandidaat")}
            </h2>

            {/* Salaire */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-ink">
                  {l("Fourchette de salaire", "Loonschaal")}
                </label>
                <button
                  onClick={() => set("show_salary", !form.show_salary)}
                  className="flex items-center gap-1.5 text-xs text-ink-500"
                >
                  <div
                    className={`w-7 h-4 rounded-full transition-colors flex items-center px-0.5 ${
                      form.show_salary ? "bg-brand" : "bg-[#EADFC4]"
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full bg-white shadow transition-transform ${
                        form.show_salary ? "translate-x-3" : ""
                      }`}
                    />
                  </div>
                  {l("Afficher le salaire", "Loon tonen")}
                </button>
              </div>
              {form.show_salary && (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={form.salary_min}
                    onChange={(e) => set("salary_min", e.target.value)}
                    placeholder="Min"
                    className="flex-1 px-3 py-2.5 border border-ink-100 rounded-lg text-sm focus:outline-none focus:border-brand transition"
                  />
                  <span className="text-ink-300">—</span>
                  <input
                    type="number"
                    value={form.salary_max}
                    onChange={(e) => set("salary_max", e.target.value)}
                    placeholder="Max"
                    className="flex-1 px-3 py-2.5 border border-ink-100 rounded-lg text-sm focus:outline-none focus:border-brand transition"
                  />
                  <select
                    value={form.salary_period === "heure" ? l("h", "u") : form.salary_period === "jour" ? l("j", "dag") : l("mois", "maand")}
                    onChange={(e) =>
                      set("salary_period", e.target.value as "heure" | "jour" | "mois")
                    }
                    className="px-3 py-2.5 border border-ink-100 rounded-lg text-sm focus:outline-none focus:border-brand bg-white transition"
                  >
                    <option value="heure">€/h</option>
                    <option value="jour">{l("€/j", "€/dag")}</option>
                    <option value="mois">{l("€/mois", "€/maand")}</option>
                  </select>
                </div>
              )}
            </div>

            {/* Horaires */}
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                {l("Type d'horaire", "Soort uurrooster")}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { val: "jour", label: "☀️ " + l("Jour", "Dag") },
                  { val: "nuit", label: "🌙 " + l("Nuit", "Nacht") },
                  { val: "week-end", label: "📅 " + l("Week-end", "Weekend") },
                  { val: "flexible", label: "🔄 " + l("Flexible", "Flexibel") },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    onClick={() => set("shift_type", opt.val as "jour" | "nuit" | "week-end" | "flexible")}
                    className={`py-2 px-3 rounded-lg border text-sm font-medium transition ${
                      form.shift_type === opt.val
                        ? "border-brand bg-blue-50 text-brand"
                        : "border-ink-100 text-ink-500 hover:border-brand/50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Planning de la mission (job étudiant, flexi-job, intérim) */}
            {["etudiant", "flexi", "interim"].includes(form.contract_type) && (
              <OfferPlanningFields value={planning} onChange={setPlanning} flexi={form.contract_type === "flexi"} />
            )}

            {/* Permis */}
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                {l("Permis de conduire requis", "Vereist rijbewijs")}
              </label>
              <div className="flex flex-wrap gap-2">
                {LICENSES.map((lic) => (
                  <button
                    key={lic}
                    onClick={() => toggleArray("required_licenses", lic)}
                    className={`flex-1 min-w-[56px] py-2.5 rounded-lg border text-sm font-bold transition ${
                      form.required_licenses.includes(lic)
                        ? "border-brand bg-brand text-white"
                        : "border-ink-100 text-ink-500 hover:border-brand/50"
                    }`}
                  >
                    {lic}
                  </button>
                ))}
              </div>
            </div>

            {/* CACES */}
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                {l("CACES requis", "Vereist CACES-attest")}
              </label>
              <div className="flex gap-2">
                {CACES.map((c) => (
                  <button
                    key={c}
                    onClick={() => toggleArray("required_caces", c)}
                    className={`flex-1 py-2.5 rounded-lg border text-sm font-semibold transition ${
                      form.required_caces.includes(c)
                        ? "border-brand bg-brand text-white"
                        : "border-ink-100 text-ink-500 hover:border-brand/50"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Langues */}
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                {l("Langues requises", "Vereiste talen")}
              </label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((lg) => (
                  <button
                    key={lg.value}
                    onClick={() => toggleArray("required_languages", lg.value)}
                    className={`px-3.5 py-2.5 rounded-lg border text-sm font-medium transition ${
                      form.required_languages.includes(lg.value)
                        ? "border-brand bg-blue-50 text-brand"
                        : "border-ink-100 text-ink-500 hover:border-brand/50"
                    }`}
                  >
                    {l(lg.fr, lg.nl)}
                  </button>
                ))}
              </div>
            </div>

            {/* Expérience */}
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                {l("Années d'expérience minimum", "Minimaal aantal jaren ervaring")}
              </label>
              <select
                value={form.experience_years}
                onChange={(e) => set("experience_years", e.target.value)}
                className="w-full px-3 py-2.5 border border-ink-100 rounded-lg text-sm focus:outline-none focus:border-brand bg-white transition"
              >
                <option value="">{l("Non précisé", "Niet gespecificeerd")}</option>
                <option value="0">{l("Débutant accepté", "Starter aanvaard")}</option>
                <option value="1">{l("1 an minimum", "Minstens 1 jaar")}</option>
                <option value="2">{l("2 ans minimum", "Minstens 2 jaar")}</option>
                <option value="3">{l("3 ans minimum", "Minstens 3 jaar")}</option>
                <option value="5">{l("5 ans minimum", "Minstens 5 jaar")}</option>
              </select>
            </div>
          </div>
        )}

        {/* ══════════════ ÉTAPE 3 ══════════════ */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-ink">{l("Description", "Beschrijving")}</h2>
              <button
                onClick={applyTemplate}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-medium hover:bg-amber-100 transition"
              >
                <Zap size={13} />
                {descriptionTemplateApplied
                  ? l("Modèle appliqué ✓", "Sjabloon toegepast ✓")
                  : l(`Appliquer le modèle ${SECTOR_LABELS[form.sector]}`, `Sjabloon ${SECTOR_LABELS[form.sector]} toepassen`)}
              </button>
            </div>

            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={12}
              placeholder={l("Décrivez le poste, les missions et le profil recherché...", "Beschrijf de functie, de taken en het gezochte profiel...")}
              className="w-full px-3 py-3 border border-ink-100 rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition resize-none"
            />

            {/* Aperçu mini */}
            <div className="bg-surface rounded-lg border border-ink-100 p-4">
              <p className="text-xs font-semibold text-ink-500 mb-2 uppercase tracking-wide">
                {l("Aperçu de l'offre", "Voorbeeld van de vacature")}
              </p>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-white border border-ink-100 flex items-center justify-center text-lg shrink-0">
                  {SECTOR_ICONS[form.sector]}
                </div>
                <div>
                  <h3 className="font-semibold text-ink text-sm">
                    {form.title || l("Titre du poste", "Functietitel")}
                    {form.is_urgent && (
                      <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-semibold">
                        URGENT
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-ink-500">
                    {SECTOR_LABELS[form.sector]} · {CONTRACT_LABELS[form.contract_type]} ·{" "}
                    {[form.postal_code, form.city].filter(Boolean).join(" ") || l("Ville", "Stad")}
                  </p>
                  {form.show_salary && form.salary_min && (
                    <p className="text-xs text-[#10B981] font-medium mt-1">
                      {form.salary_min}
                      {form.salary_max ? `–${form.salary_max}` : ""} €/
                      {form.salary_period}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6 pt-5 border-t border-ink-100">
          {step > 1 ? (
            <button
              onClick={() => setStep((prev) => (prev - 1) as 1 | 2 | 3)}
              className="flex items-center gap-2 px-4 py-2 border border-ink-100 rounded-lg text-sm font-medium text-ink-500 hover:bg-surface-2 transition"
            >
              <ArrowLeft size={15} />
              {l("Retour", "Terug")}
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep((prev) => (prev + 1) as 1 | 2 | 3)}
              disabled={!canGoNext()}
              className="flex items-center gap-2 bg-brand text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-brand-dark transition disabled:opacity-40"
            >
              {l("Continuer", "Verder")}
              <ArrowRight size={15} />
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => handleSubmit("draft")}
                disabled={loading || !canGoNext()}
                className="flex items-center gap-2 px-4 py-2 border border-ink-100 rounded-lg text-sm font-medium text-ink-500 hover:bg-surface-2 transition disabled:opacity-40"
              >
                {l("Sauvegarder en brouillon", "Opslaan als concept")}
              </button>
              <button
                onClick={() => handleSubmit("active")}
                disabled={loading || !canGoNext()}
                className="flex items-center gap-2 bg-brand text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-brand-dark transition disabled:opacity-40"
              >
                {loading ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Check size={15} />
                )}
                {l("Publier l'offre", "Vacature publiceren")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
