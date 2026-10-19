import Link from "next/link";
import { HardSworkLogo } from "@/components/ui/HardieIcon";
import { BRAND } from "@/lib/brand";
import { getDict } from "@/lib/i18n/server";

export function SiteFooter() {
  const { t } = getDict();
  const f = t.footer;
  const COLUMNS = [
    { title: f.candidates, links: [
      { label: f.findJob, href: "/jobs" },
      { label: f.createProfile, href: "/signup/candidat" },
      { label: f.login, href: "/login" },
    ] },
    { title: f.recruiters, links: [
      { label: f.recruiterSpace, href: "/recrute" },
      { label: f.pricing, href: "/tarifs" },
      { label: f.createAccount, href: "/inscription" },
    ] },
    { title: f.info, links: [
      { label: t.about.nav, href: "/a-propos" },
      { label: f.contact, href: `mailto:${BRAND.contactEmail}` },
      { label: f.cgu, href: "/legal/cgu" },
      { label: f.privacy, href: "/legal/privacy" },
    ] },
  ];
  return (
    <footer className="brand-on-dark bg-[#0B1630] border-t border-white/[0.06] py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          <div className="lg:col-span-2">
            <div className="mb-4"><HardSworkLogo size="md" dark /></div>
            <p className="text-white/55 text-sm leading-relaxed max-w-xs">{t.tagline}</p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-[11px] font-bold text-white/50 uppercase tracking-widest mb-4">{col.title}</p>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-white/70 hover:text-white transition-colors">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-8 border-t border-white/[0.06]">
          <p className="text-xs text-white/45">© {new Date().getFullYear()} {BRAND.name} · {f.rights}</p>
        </div>
      </div>
    </footer>
  );
}
