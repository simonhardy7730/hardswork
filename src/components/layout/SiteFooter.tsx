import Link from "next/link";
import { HardSworkLogo } from "@/components/ui/HardieIcon";
import { BRAND } from "@/lib/brand";

const COLUMNS = [
  {
    title: "Candidats",
    links: [
      { label: "Trouver un emploi", href: "/jobs" },
      { label: "Créer mon profil", href: "/signup/candidat" },
      { label: "Connexion", href: "/login" },
    ],
  },
  {
    title: "Recruteurs",
    links: [
      { label: "Espace recruteurs", href: "/recrute" },
      { label: "Tarifs", href: "/tarifs" },
      { label: "Créer un compte", href: "/inscription" },
    ],
  },
  {
    title: "Informations",
    links: [
      { label: "Contact", href: `mailto:${BRAND.contactEmail}` },
      { label: "Conditions générales", href: "/legal/cgu" },
      { label: "Politique de confidentialité", href: "/legal/privacy" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="brand-on-dark bg-[#0B1630] border-t border-white/[0.06] py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          <div className="lg:col-span-2">
            <div className="mb-4"><HardSworkLogo size="md" dark /></div>
            <p className="text-white/55 text-sm leading-relaxed max-w-xs">{BRAND.tagline}</p>
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
          <p className="text-xs text-white/45">© {new Date().getFullYear()} {BRAND.name} · Tous droits réservés</p>
        </div>
      </div>
    </footer>
  );
}
