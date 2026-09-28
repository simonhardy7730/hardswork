"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SearchResponse } from "@/lib/types";
import {
  addToWardrobe,
  clearWardrobe,
  loadAlerts,
  loadWardrobe,
  makeThumb,
  newId,
  saveAlerts,
  type PriceAlert,
  type WardrobeItem,
} from "@/lib/storage";
import { ZipperIntro } from "@/components/ZipperIntro";
import { SearchFlow, type Reopen } from "@/components/SearchFlow";
import { AlertsPanel, alertStatus } from "@/components/AlertsPanel";
import { Wardrobe } from "@/components/Wardrobe";
import { NotrePromesse } from "@/components/NotrePromesse";

type Tab = "chercher" | "alertes" | "vestiaire" | "promesse";

const RECHECK_AFTER_MS = 6 * 60 * 60 * 1000;

export default function Home() {
  const [tab, setTab] = useState<Tab>("chercher");
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [reopen, setReopen] = useState<Reopen | null>(null);
  const [checking, setChecking] = useState<Set<string>>(new Set());
  const alertsRef = useRef<PriceAlert[]>([]);

  const updateAlerts = useCallback((fn: (prev: PriceAlert[]) => PriceAlert[]) => {
    const next = fn(alertsRef.current);
    alertsRef.current = next;
    setAlerts(next);
    saveAlerts(next);
  }, []);

  const checkAlert = useCallback(
    async (id: string) => {
      const a = alertsRef.current.find((x) => x.id === id);
      if (!a) return;
      setChecking((s) => new Set(s).add(id));
      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ analysis: a.analysis, mode: a.mode, brand: a.brand, model: a.model }),
        });
        if (res.ok) {
          const json = (await res.json()) as SearchResponse;
          updateAlerts((prev) =>
            prev.map((x) => (x.id === id ? { ...x, lastPrice: json.bestPrice, lastCheckedAt: new Date().toISOString() } : x)),
          );
        }
      } finally {
        setChecking((s) => {
          const n = new Set(s);
          n.delete(id);
          return n;
        });
      }
    },
    [updateAlerts],
  );

  // Au chargement : on relit la mémoire du navigateur et on revérifie les alertes un peu anciennes.
  useEffect(() => {
    const saved = loadAlerts();
    alertsRef.current = saved;
    setAlerts(saved);
    setWardrobe(loadWardrobe());
    const stale = saved.filter((a) => !a.lastCheckedAt || Date.now() - Date.parse(a.lastCheckedAt) > RECHECK_AFTER_MS);
    stale.forEach((a) => void checkAlert(a.id));
    try {
      const hash = window.location.hash.slice(1);
      if (["chercher", "alertes", "vestiaire", "promesse"].includes(hash)) setTab(hash as Tab);
    } catch {}
  }, [checkAlert]);

  const go = (t: Tab) => {
    setTab(t);
    try {
      history.replaceState(null, "", t === "chercher" ? " " : `#${t}`);
    } catch {}
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  async function onSearched(result: SearchResponse, image: string) {
    const thumb = await makeThumb(image, 220);
    setWardrobe(addToWardrobe({ id: newId(), savedAt: new Date().toISOString(), thumb, result }));
  }

  async function onCreateAlert(result: SearchResponse, image: string | null) {
    const thumb = image ? await makeThumb(image, 160) : null;
    const start = result.bestPrice;
    updateAlerts((prev) => [
      {
        id: newId(),
        createdAt: new Date().toISOString(),
        title: result.analysis.title,
        thumb,
        mode: result.mode,
        brand: result.analysis.brand.name,
        model: result.analysis.model_guess,
        analysis: result.analysis,
        startPrice: start,
        targetPrice: start != null ? Math.floor(start * 0.9) : null,
        lastPrice: start,
        lastCheckedAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  }

  const promos = alerts.filter((a) => ["baisse", "cible"].includes(alertStatus(a))).length;

  const tabs: Array<[Tab, string, string, number | null]> = [
    ["chercher", "Chercher", "Chercher", null],
    ["alertes", "Mes alertes", "Alertes", alerts.length ? alerts.length : null],
    ["vestiaire", "Mon vestiaire", "Vestiaire", wardrobe.length ? wardrobe.length : null],
    ["promesse", "La promesse", "Promesse", null],
  ];

  return (
    <>
      <ZipperIntro />

      {/* En-tête : l'étiquette cousue au col + les onglets en étiquettes tissées */}
      <header className="sticky top-0 z-30 border-b border-encre/10 bg-[#F7F7F4]/90 backdrop-blur-sm" style={{ top: "env(safe-area-inset-top, 0px)" }}>
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 sm:px-6">
          <button type="button" onClick={() => go("chercher")} className="tissee surpiqure my-3 shrink-0 px-4 py-2" aria-label="Sosilook, accueil">
            <span className="display text-lg uppercase tracking-tight">Sosilook</span>
          </button>
          <nav className="-mb-px hidden flex-1 items-end gap-1 self-stretch sm:flex" aria-label="Sections">
            {tabs.map(([t, label, , count]) => (
              <button
                key={t}
                type="button"
                onClick={() => go(t)}
                aria-current={tab === t ? "page" : undefined}
                className={`relative shrink-0 whitespace-nowrap border-b-[3px] px-3 py-4 text-sm font-semibold transition-colors ${
                  tab === t ? "border-fil text-encre" : "border-transparent text-craie hover:text-encre"
                }`}
              >
                {label}
                {count != null && (
                  <span className={`ml-1.5 font-mono text-[11px] ${t === "alertes" && promos ? "text-fil-fonce" : "text-craie"}`}>
                    {t === "alertes" && promos ? `${promos} promo` : count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-8 sm:px-6 sm:pb-20 sm:pt-12">
        <div hidden={tab !== "chercher"}>
          <SearchFlow reopen={reopen} onSearched={onSearched} onCreateAlert={onCreateAlert} />
        </div>
        {tab === "alertes" && (
          <AlertsPanel
            alerts={alerts}
            checking={checking}
            onCheck={(id) => void checkAlert(id)}
            onCheckAll={() => alertsRef.current.forEach((a) => void checkAlert(a.id))}
            onTarget={(id, p) => updateAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, targetPrice: p } : a)))}
            onDelete={(id) => updateAlerts((prev) => prev.filter((a) => a.id !== id))}
            onGoSearch={() => go("chercher")}
          />
        )}
        {tab === "vestiaire" && (
          <Wardrobe
            items={wardrobe}
            onOpen={(it) => {
              setReopen({ key: it.id + Date.now(), result: it.result, image: it.thumb });
              go("chercher");
            }}
            onClear={() => {
              clearWardrobe();
              setWardrobe([]);
            }}
            onGoSearch={() => go("chercher")}
          />
        )}
        {tab === "promesse" && <NotrePromesse />}
      </main>

      {/* Sur téléphone : les onglets passent en barre fixe en bas, à portée de pouce */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-encre/15 bg-[#F7F7F4]/95 backdrop-blur-sm sm:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        aria-label="Sections"
      >
        {tabs.map(([t, , short, count]) => (
          <button
            key={t}
            type="button"
            onClick={() => go(t)}
            aria-current={tab === t ? "page" : undefined}
            className={`relative border-t-[3px] px-1 pb-2.5 pt-2 text-[11px] font-semibold leading-tight ${
              tab === t ? "border-fil text-encre" : "border-transparent text-craie"
            }`}
          >
            {short}
            {count != null && (
              <span
                className={`absolute right-2 top-1 min-w-[16px] rounded-full px-1 font-mono text-[10px] leading-4 ${
                  t === "alertes" && promos ? "bg-fil text-white" : "bg-encre/10 text-craie"
                }`}
              >
                {t === "alertes" && promos ? promos : count}
              </span>
            )}
          </button>
        ))}
      </nav>

      <footer className="border-t border-encre/10 pb-16 sm:pb-0">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 font-mono text-[11px] uppercase tracking-[0.14em] text-craie sm:px-6">
          <span>Sosilook · le sosie de ton look</span>
          <span>Prototype · certains liens pourront être affiliés</span>
        </div>
      </footer>
    </>
  );
}
