"use client";

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
  SECTOR_LABELS,
  CONTRACT_LABELS,
  SECTOR_TEMPLATES,
  JOB_TITLE_SUGGESTIONS,
} from "@/lib/utils";
import type { JobOfferInsert, Region, Sector, ContractType } from "@/lib/supabase/types";

// ── Types ─────────────────────────────────────────────

interface FormData {
  // Étape 1
  title: string;
  sector: Sector;
  contract_type: ContractType;
  city: string;
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

const LICENSES = ["B", "C", "CE"];
const CACES = ["CACES 1", "CACES 3", "CACES 5"];
const LANGUAGES = [
  { value: "fr", label: "Français" },
  { value: "nl", label: "Néerlandais" },
  { value: "en", label: "Anglais" },
];

const STEPS = [
  { num: 1, label: "L'essentiel" },
  { num: 2, label: "Les critères" },
  { num: 3, label: "La description" },
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
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [descriptionTemplateApplied, setDescriptionTemplateApplied] =
    useState(false);

  const [form, setForm] = useState<FormData>({
    title: "",
    sector: "logistique",
    contract_type: "interim",
    city: "",
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
    if (step === 1) return form.title.trim() && form.city.trim();
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
      region: form.region,
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

    const { data, error } = await supabase
      .from("job_offers")
      .insert(payload)
      .select()
      .single();

    if (error || !data) {
      setLoading(false);
      alert("Erreur lors de la création. Réessayez.");
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
                      : "bg-[#E8E2DA] text-ink-300"
                }`}
              >
                {step > s.num ? <Check size={14} /> : s.num}
              </div>
              <span
                className={`text-sm font-medium ${step === s.num ? "text-ink" : "text-ink-300"}`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-px ${step > s.num ? "bg-[#10B981]" : "bg-[#E8E2DA]"}`}
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
              L&apos;essentiel du poste
            </h2>

            {/* Titre */}
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Titre du poste *
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
                  placeholder="ex: Cariste CACES 3, Chauffeur SPL..."
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
                Secteur *
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
                Type de contrat *
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

            {/* Ville + Région */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  Ville *
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  placeholder="Liège"
                  className="w-full px-3 py-2.5 border border-ink-100 rounded-lg text-sm focus:outline-none focus:border-brand transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  Région *
                </label>
                <select
                  value={form.region}
                  onChange={(e) => set("region", e.target.value as Region)}
                  className="w-full px-3 py-2.5 border border-ink-100 rounded-lg text-sm focus:outline-none focus:border-brand transition bg-white"
                >
                  <option value="wallonie">Wallonie</option>
                  <option value="bruxelles">Bruxelles</option>
                  <option value="flandre">Flandre</option>
                </select>
              </div>
            </div>

            {/* Date + Urgence */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  Date de début
                  <span className="text-ink-300 font-normal ml-1">(optionnel)</span>
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
                  Urgence
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
                    Poste urgent
                  </span>
                  <div
                    className={`w-9 h-5 rounded-full transition-colors flex items-center px-0.5 ${
                      form.is_urgent ? "bg-red-500" : "bg-[#E8E2DA]"
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
              Critères du candidat
            </h2>

            {/* Salaire */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-ink">
                  Fourchette de salaire
                </label>
                <button
                  onClick={() => set("show_salary", !form.show_salary)}
                  className="flex items-center gap-1.5 text-xs text-ink-500"
                >
                  <div
                    className={`w-7 h-4 rounded-full transition-colors flex items-center px-0.5 ${
                      form.show_salary ? "bg-brand" : "bg-[#E8E2DA]"
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full bg-white shadow transition-transform ${
                        form.show_salary ? "translate-x-3" : ""
                      }`}
                    />
                  </div>
                  Afficher le salaire
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
                    value={form.salary_period}
                    onChange={(e) =>
                      set("salary_period", e.target.value as "heure" | "jour" | "mois")
                    }
                    className="px-3 py-2.5 border border-ink-100 rounded-lg text-sm focus:outline-none focus:border-brand bg-white transition"
                  >
                    <option value="heure">€/h</option>
                    <option value="jour">€/j</option>
                    <option value="mois">€/mois</option>
                  </select>
                </div>
              )}
            </div>

            {/* Horaires */}
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Type d&apos;horaire
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { val: "jour", label: "☀️ Jour" },
                  { val: "nuit", label: "🌙 Nuit" },
                  { val: "week-end", label: "📅 Week-end" },
                  { val: "flexible", label: "🔄 Flexible" },
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

            {/* Permis */}
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Permis de conduire requis
              </label>
              <div className="flex gap-2">
                {LICENSES.map((lic) => (
                  <button
                    key={lic}
                    onClick={() => toggleArray("required_licenses", lic)}
                    className={`flex-1 py-2.5 rounded-lg border text-sm font-bold transition ${
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
                CACES requis
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
                Langues requises
              </label>
              <div className="flex gap-2">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.value}
                    onClick={() => toggleArray("required_languages", lang.value)}
                    className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition ${
                      form.required_languages.includes(lang.value)
                        ? "border-brand bg-blue-50 text-brand"
                        : "border-ink-100 text-ink-500 hover:border-brand/50"
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Expérience */}
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Années d&apos;expérience minimum
              </label>
              <select
                value={form.experience_years}
                onChange={(e) => set("experience_years", e.target.value)}
                className="w-full px-3 py-2.5 border border-ink-100 rounded-lg text-sm focus:outline-none focus:border-brand bg-white transition"
              >
                <option value="">Non précisé</option>
                <option value="0">Débutant accepté</option>
                <option value="1">1 an minimum</option>
                <option value="2">2 ans minimum</option>
                <option value="3">3 ans minimum</option>
                <option value="5">5 ans minimum</option>
              </select>
            </div>
          </div>
        )}

        {/* ══════════════ ÉTAPE 3 ══════════════ */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-ink">Description</h2>
              <button
                onClick={applyTemplate}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-medium hover:bg-amber-100 transition"
              >
                <Zap size={13} />
                {descriptionTemplateApplied
                  ? "Modèle appliqué ✓"
                  : `Appliquer le modèle ${SECTOR_LABELS[form.sector]}`}
              </button>
            </div>

            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={12}
              placeholder="Décrivez le poste, les missions et le profil recherché..."
              className="w-full px-3 py-3 border border-ink-100 rounded-lg text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition resize-none"
            />

            {/* Aperçu mini */}
            <div className="bg-surface rounded-lg border border-ink-100 p-4">
              <p className="text-xs font-semibold text-ink-500 mb-2 uppercase tracking-wide">
                Aperçu de l&apos;offre
              </p>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-white border border-ink-100 flex items-center justify-center text-lg shrink-0">
                  {SECTOR_ICONS[form.sector]}
                </div>
                <div>
                  <h3 className="font-semibold text-ink text-sm">
                    {form.title || "Titre du poste"}
                    {form.is_urgent && (
                      <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-semibold">
                        URGENT
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-ink-500">
                    {SECTOR_LABELS[form.sector]} · {CONTRACT_LABELS[form.contract_type]} ·{" "}
                    {form.city || "Ville"} ({form.region})
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
              Retour
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
              Continuer
              <ArrowRight size={15} />
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => handleSubmit("draft")}
                disabled={loading || !canGoNext()}
                className="flex items-center gap-2 px-4 py-2 border border-ink-100 rounded-lg text-sm font-medium text-ink-500 hover:bg-surface-2 transition disabled:opacity-40"
              >
                Sauvegarder en brouillon
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
                Publier l&apos;offre
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
