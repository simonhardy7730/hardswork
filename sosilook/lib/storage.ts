"use client";

import type { GarmentAnalysis, Mode, SearchResponse } from "./types";

/**
 * Alertes et vestiaire, gardés dans le navigateur pour ce prototype.
 * Étape suivante (voir PLAN.md) : comptes + base Supabase + vérification planifiée + e-mail.
 */

export interface PriceAlert {
  id: string;
  createdAt: string;
  title: string;
  thumb: string | null;
  mode: Mode;
  brand: string | null;
  model: string | null;
  analysis: GarmentAnalysis;
  startPrice: number | null;
  targetPrice: number | null;
  lastPrice: number | null;
  lastCheckedAt: string | null;
}

export interface WardrobeItem {
  id: string;
  savedAt: string;
  thumb: string | null;
  result: SearchResponse;
}

const ALERTS_KEY = "sosilook.alerts.v1";
const WARDROBE_KEY = "sosilook.wardrobe.v1";
const WARDROBE_MAX = 24;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Stockage plein ou bloqué : le site continue de fonctionner sans mémoire.
  }
}

export const loadAlerts = () => read<PriceAlert[]>(ALERTS_KEY, []);
export const saveAlerts = (alerts: PriceAlert[]) => write(ALERTS_KEY, alerts);

export const loadWardrobe = () => read<WardrobeItem[]>(WARDROBE_KEY, []);
export function addToWardrobe(item: WardrobeItem): WardrobeItem[] {
  const next = [item, ...loadWardrobe().filter((w) => w.id !== item.id)].slice(0, WARDROBE_MAX);
  write(WARDROBE_KEY, next);
  return next;
}
export function clearWardrobe() {
  write(WARDROBE_KEY, []);
}

export const newId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

/** Petite vignette (pour le stockage local) à partir d'une image en data URL. */
export async function makeThumb(dataUrl: string, size = 160): Promise<string | null> {
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = dataUrl;
    });
    const scale = size / Math.max(img.width, img.height);
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.7);
  } catch {
    return null;
  }
}
