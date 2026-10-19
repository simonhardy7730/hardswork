"use client";

import { useRouter } from "next/navigation";
import type { Lang } from "@/lib/i18n/dict";

export function LangSwitcher({ lang, label, tone = "dark" }: { lang: Lang; label: string; tone?: "dark" | "light" }) {
  const router = useRouter();
  function set(l: Lang) {
    if (l === lang) return;
    document.cookie = `lang=${l}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }
  return (
    <div role="group" aria-label={label} className={`inline-flex items-center rounded-lg border overflow-hidden text-[12px] font-bold ${tone === "dark" ? "border-white/20" : "border-ink-100 bg-white"}`}>
      {(["fr", "nl"] as Lang[]).map((l) => (
        <button key={l} type="button" onClick={() => set(l)} aria-pressed={lang === l} lang={l}
          className={`px-2.5 py-1.5 uppercase transition-colors ${lang === l ? "bg-[#FFB900] text-[#101F43]" : tone === "dark" ? "text-white/80 hover:text-white" : "text-ink-500 hover:text-ink"}`}>
          {l}
        </button>
      ))}
    </div>
  );
}
