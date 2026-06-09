"use client";

import { useState } from "react";
import { Loader2, Phone, User, Mail, CheckCircle2 } from "lucide-react";

interface Props {
  jobId: string;
  orgName: string;
}

const LICENSES = [
  { value: "B", label: "Permis B" },
  { value: "C", label: "Permis C" },
  { value: "CE", label: "Permis CE" },
];

const CACES_OPTIONS = [
  { value: "CACES1", label: "CACES 1" },
  { value: "CACES3", label: "CACES 3" },
  { value: "CACES5", label: "CACES 5" },
];

export default function CandidatureForm({ jobId, orgName }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    availability: "immediate" as "immediate" | "1_semaine" | "1_mois",
    licenses: [] as string[],
    has_caces: false,
    caces_types: [] as string[],
    cover_message: "",
  });

  function toggleArr(
    key: "licenses" | "caces_types",
    val: string
  ) {
    setForm((prev) => {
      const arr = prev[key];
      return {
        ...prev,
        [key]: arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val],
      };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/postuler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        job_offer_id: jobId,
        applicant_name: `${form.first_name} ${form.last_name}`.trim(),
        applicant_phone: form.phone,
        applicant_email: form.email || null,
        availability: form.availability,
        licenses: form.licenses,
        has_caces: form.has_caces,
        caces_types: form.caces_types,
        cover_message: form.cover_message || null,
      }),
    });

    if (!res.ok) {
      setError("Une erreur est survenue. Réessayez.");
      setLoading(false);
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="py-8 text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 size={32} className="text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-ink">
            Candidature envoyée ! ✅
          </h3>
          <p className="text-sm text-ink-500 mt-2">
            <strong>{orgName}</strong> vous contactera par téléphone dans les
            meilleurs délais.
          </p>
        </div>
        <p className="text-xs text-ink-300">
          Vous pouvez fermer cette page.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nom + Prénom */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            Prénom *
          </label>
          <div className="relative">
            <User
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300"
            />
            <input
              type="text"
              required
              value={form.first_name}
              onChange={(e) =>
                setForm((p) => ({ ...p, first_name: e.target.value }))
              }
              placeholder="Jean"
              autoComplete="given-name"
              className="w-full pl-9 pr-3 py-3 border border-ink-100 rounded-xl text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">
            Nom *
          </label>
          <input
            type="text"
            required
            value={form.last_name}
            onChange={(e) =>
              setForm((p) => ({ ...p, last_name: e.target.value }))
            }
            placeholder="Dupont"
            autoComplete="family-name"
            className="w-full px-3 py-3 border border-ink-100 rounded-xl text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition"
          />
        </div>
      </div>

      {/* Téléphone */}
      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">
          Téléphone *
        </label>
        <div className="relative">
          <Phone
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300"
          />
          <input
            type="tel"
            required
            value={form.phone}
            onChange={(e) =>
              setForm((p) => ({ ...p, phone: e.target.value }))
            }
            placeholder="+32 4XX XX XX XX"
            autoComplete="tel"
            inputMode="tel"
            className="w-full pl-9 pr-3 py-3 border border-ink-100 rounded-xl text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition"
          />
        </div>
      </div>

      {/* Email (optionnel) */}
      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">
          Email{" "}
          <span className="text-ink-300 font-normal">(optionnel)</span>
        </label>
        <div className="relative">
          <Mail
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300"
          />
          <input
            type="email"
            value={form.email}
            onChange={(e) =>
              setForm((p) => ({ ...p, email: e.target.value }))
            }
            placeholder="votre@email.be"
            autoComplete="email"
            inputMode="email"
            className="w-full pl-9 pr-3 py-3 border border-ink-100 rounded-xl text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition"
          />
        </div>
      </div>

      {/* Disponibilité */}
      <div>
        <label className="block text-sm font-medium text-ink mb-2">
          Disponibilité *
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { val: "immediate", label: "Immédiatement" },
            { val: "1_semaine", label: "Dans 1 semaine" },
            { val: "1_mois", label: "Dans 1 mois" },
          ].map((opt) => (
            <button
              key={opt.val}
              type="button"
              onClick={() =>
                setForm((p) => ({
                  ...p,
                  availability: opt.val as "immediate" | "1_semaine" | "1_mois",
                }))
              }
              className={`py-3 px-2 rounded-xl border text-xs font-medium transition text-center ${
                form.availability === opt.val
                  ? "border-brand bg-blue-50 text-brand"
                  : "border-ink-100 text-ink-500"
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
          Permis de conduire
        </label>
        <div className="flex gap-2">
          {LICENSES.map((lic) => (
            <button
              key={lic.value}
              type="button"
              onClick={() => toggleArr("licenses", lic.value)}
              className={`flex-1 py-3 rounded-xl border text-sm font-bold transition ${
                form.licenses.includes(lic.value)
                  ? "border-brand bg-brand text-white"
                  : "border-ink-100 text-ink-500"
              }`}
            >
              {lic.value}
            </button>
          ))}
        </div>
      </div>

      {/* CACES */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-ink">CACES ?</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setForm((p) => ({ ...p, has_caces: true }))}
              className={`px-4 py-1.5 rounded-lg border text-sm font-medium transition ${
                form.has_caces
                  ? "border-brand bg-blue-50 text-brand"
                  : "border-ink-100 text-ink-500"
              }`}
            >
              Oui
            </button>
            <button
              type="button"
              onClick={() =>
                setForm((p) => ({
                  ...p,
                  has_caces: false,
                  caces_types: [],
                }))
              }
              className={`px-4 py-1.5 rounded-lg border text-sm font-medium transition ${
                !form.has_caces
                  ? "border-brand bg-blue-50 text-brand"
                  : "border-ink-100 text-ink-500"
              }`}
            >
              Non
            </button>
          </div>
        </div>
        {form.has_caces && (
          <div className="flex gap-2 mt-2">
            {CACES_OPTIONS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => toggleArr("caces_types", c.value)}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition ${
                  form.caces_types.includes(c.value)
                    ? "border-brand bg-brand text-white"
                    : "border-ink-100 text-ink-500"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Message (optionnel) */}
      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">
          Message{" "}
          <span className="text-ink-300 font-normal">
            (optionnel · max 300 car.)
          </span>
        </label>
        <textarea
          value={form.cover_message}
          onChange={(e) =>
            setForm((p) => ({
              ...p,
              cover_message: e.target.value.slice(0, 300),
            }))
          }
          rows={3}
          placeholder="Présentez-vous brièvement..."
          className="w-full px-3 py-3 border border-ink-100 rounded-xl text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition resize-none"
        />
        <p className="text-right text-xs text-ink-300 mt-0.5">
          {form.cover_message.length}/300
        </p>
      </div>

      {error && (
        <div className="text-sm px-4 py-3 rounded-xl bg-red-50 text-red-600 border border-red-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-brand text-white rounded-xl font-semibold text-base hover:bg-brand-dark transition disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          "Envoyer ma candidature"
        )}
      </button>
    </form>
  );
}
