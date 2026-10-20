"use client";

import { useState } from "react";
import { Check, Link2, MessageCircle, Share2 } from "lucide-react";

/** Partage d'une annonce : WhatsApp, Facebook, copie du lien. Aucun script externe. */
export default function ShareButtons({ url, title, city, lang = "fr" }: { url: string; title: string; city?: string | null; lang?: string }) {
  const [done, setDone] = useState(false);
  const nl = lang === "nl";
  const text = nl
    ? `${title}${city ? ` in ${city}` : ""} — solliciteer in 1 minuut op Wolko:`
    : `${title}${city ? ` à ${city}` : ""} — postule en 1 minute sur Wolko :`;
  const wa = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
  const cls = "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-ink-100 text-xs font-bold text-ink-500 hover:bg-surface-2 transition";
  return (
    <div className="flex flex-wrap gap-2">
      <a href={wa} target="_blank" rel="noopener noreferrer" className={cls}><MessageCircle size={14} /> WhatsApp</a>
      <a href={fb} target="_blank" rel="noopener noreferrer" className={cls}><Share2 size={14} /> Facebook</a>
      <button
        type="button"
        className={cls}
        onClick={async () => { try { await navigator.clipboard.writeText(url); setDone(true); setTimeout(() => setDone(false), 2000); } catch { /* copie impossible */ } }}
      >
        {done ? <Check size={14} /> : <Link2 size={14} />} {nl ? "Link kopiëren" : "Copier le lien"}
      </button>
    </div>
  );
}
