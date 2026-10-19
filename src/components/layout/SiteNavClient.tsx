"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { HardSworkLogo } from "@/components/ui/HardieIcon";
import { LangSwitcher } from "./LangSwitcher";
import type { Dict, Lang } from "@/lib/i18n/dict";

const hrefs = { jobs: "/jobs", recruit: "/recrute", pricing: "/tarifs", how: "/#comment-ca-marche", about: "/a-propos" } as const;

export function SiteNavClient({ lang, t }: { lang: Lang; t: Dict["nav"] }) {
  const [open, setOpen] = useState(false);
  const NAV_LINKS = (Object.keys(hrefs) as (keyof typeof hrefs)[]).map((k) => ({ label: t[k], href: hrefs[k] }));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open]);

  return (
    <header
      className="brand-on-dark fixed top-0 left-0 right-0 z-50 border-b border-white/[0.07]"
      style={{ background: "rgba(16,31,67,0.97)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[60px] flex items-center justify-between gap-4">
        <Link href="/" aria-label={t.home} onClick={() => setOpen(false)}>
          <HardSworkLogo size="lg" dark />
        </Link>

        {/* Navigation centrale (desktop) */}
        <nav aria-label={t.main} className="hidden lg:flex items-center gap-5 xl:gap-7">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href}
              className="text-[13px] text-white/80 hover:text-white transition-colors font-semibold">
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Actions (desktop) */}
        <div className="hidden lg:flex items-center gap-3">
          <Link href="/login" className="text-[13px] text-white/80 hover:text-white transition-colors font-semibold px-2">
            {t.login}
          </Link>
          <LangSwitcher lang={lang} label={t.lang} />
          <Link href="/inscription" className="btn-brand" style={{ padding: "0.5rem 1.125rem", fontSize: "0.8125rem" }}>
            {t.signup}
          </Link>
        </div>

        {/* Menu mobile */}
        <div className="flex lg:hidden items-center gap-2">
          <Link href="/inscription" className="btn-brand" style={{ padding: "0.45rem 0.9rem", fontSize: "0.75rem" }}>
            {t.signup}
          </Link>
          <button
            type="button"
            aria-label={open ? t.close : t.open}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
            className="w-11 h-11 -mr-2 flex items-center justify-center text-white rounded-lg"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-menu" className="lg:hidden fixed inset-x-0 top-[60px] h-[calc(100dvh-60px)] bg-[#0B1630] overflow-y-auto">
          <nav aria-label={t.mobile} className="px-4 py-6 flex flex-col">
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                className="py-4 text-lg font-display font-bold text-white border-b border-white/10">
                {l.label}
              </Link>
            ))}
            <Link href="/login" onClick={() => setOpen(false)}
              className="py-4 text-lg font-display font-bold text-white/80 border-b border-white/10">
              {t.login}
            </Link>
            <div className="mt-5"><LangSwitcher lang={lang} label={t.lang} /></div>
            <Link href="/inscription" onClick={() => setOpen(false)} className="btn-brand mt-6 justify-center" style={{ padding: "0.9rem 1rem" }}>
              {t.signup}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
