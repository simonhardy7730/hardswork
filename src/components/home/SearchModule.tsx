"use client";

import { useState, useEffect, useRef } from "react";
import { Search, MapPin, ChevronDown } from "lucide-react";
import { REGION_LABELS, SECTOR_LABELS } from "@/lib/utils";

const ROTATING_JOBS = [
  "Cariste CACES 3…",
  "Chauffeur SPL…",
  "Infirmier urgences…",
  "Soudeur TIG/MIG…",
  "Maçon coffreur…",
  "Aide-soignant…",
  "Agent logistique…",
  "Opérateur de production…",
  "Conducteur de travaux…",
  "Technicien de maintenance…",
];

export function SearchModule() {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("");
  const [sector, setSector] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isFocused) return;
    const id = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % ROTATING_JOBS.length);
    }, 2800);
    return () => clearInterval(id);
  }, [isFocused]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (region) params.set("region", region);
    if (sector) params.set("secteur", sector);
    window.location.href = `/jobs?${params.toString()}`;
  };

  return (
    <section className="bg-[#FAFAF8] border-b border-[#E8E2DA]">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Label */}
        <p className="section-label mb-6">Recherche d&apos;emploi</p>

        <form onSubmit={handleSubmit}>
          {/* Main search bar */}
          <div
            className="flex items-center gap-0 rounded-2xl overflow-hidden border-2 transition-all duration-200 mb-4 bg-white"
            style={{ borderColor: isFocused ? "#D93B12" : "#E8E2DA" }}
          >
            {/* Search icon */}
            <div className="flex items-center justify-center w-16 h-16 shrink-0">
              <Search size={20} className="text-[#A89F96]" />
            </div>

            {/* Input */}
            <input
              ref={inputRef}
              name="q"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={ROTATING_JOBS[placeholderIdx]}
              className="search-input flex-1 py-4 pr-4"
              style={{ fontFamily: "var(--font-display)" }}
            />

            {/* Divider */}
            <div className="w-px h-8 bg-[#E8E2DA] shrink-0 hidden md:block" />

            {/* Region select */}
            <div className="relative hidden md:flex items-center px-4 py-4 gap-2 shrink-0">
              <MapPin size={15} className="text-[#A89F96] shrink-0" />
              <select
                name="region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="appearance-none bg-transparent text-sm font-semibold text-[#3A3733] pr-6 cursor-pointer focus:outline-none"
                style={{ fontFamily: "var(--font-body)" }}
              >
                <option value="">Toute la Belgique</option>
                {Object.entries(REGION_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-3 text-[#A89F96] pointer-events-none" />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn-brand rounded-none rounded-r-[14px] h-16 px-8 shrink-0"
              style={{ fontFamily: "var(--font-display)", fontSize: "1rem", letterSpacing: "0.01em" }}
            >
              Rechercher
            </button>
          </div>

          {/* Quick filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-[#A89F96] font-medium mr-1">Populaires :</span>
            {[
              { label: "Logistique", sector: "logistique" },
              { label: "Transport", sector: "transport" },
              { label: "Industrie", sector: "industrie" },
              { label: "Construction", sector: "construction" },
              { label: "Médical", sector: "medical" },
            ].map((f) => (
              <button
                key={f.label}
                type="button"
                onClick={() => {
                  window.location.href = `/jobs?secteur=${f.sector}`;
                }}
                className="text-xs font-semibold px-3 py-1.5 rounded-full border border-[#E8E2DA] text-[#6B6760] hover:border-[#D93B12] hover:text-[#D93B12] transition-colors bg-white"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </form>
      </div>
    </section>
  );
}
