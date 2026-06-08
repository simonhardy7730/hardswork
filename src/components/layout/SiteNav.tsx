import Link from "next/link";
import { HardSworkLogo } from "@/components/ui/HardieIcon";

export function SiteNav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0F0E0D]/98 backdrop-blur-sm border-b border-white/[0.07]">
      <div className="max-w-7xl mx-auto px-6 h-[60px] flex items-center justify-between">

        {/* Logo */}
        <Link href="/">
          <HardSworkLogo size="md" dark />
        </Link>

        {/* Nav centre */}
        <nav className="hidden md:flex items-center gap-7">
          {[
            { label: "Offres", href: "/jobs" },
            { label: "Secteurs", href: "/#secteurs" },
            { label: "Tarifs", href: "/tarifs" },
          ].map((l) => (
            <Link key={l.href} href={l.href}
              className="text-[13px] text-white/55 hover:text-white transition-colors font-medium underline-grow">
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Actions droite */}
        <div className="flex items-center gap-2">
          {/* Connexion — texte discret */}
          <Link href="/login"
            className="hidden sm:block text-[13px] text-white/45 hover:text-white/80 transition-colors font-medium px-2">
            Connexion
          </Link>

          {/* Je cherche un emploi — ghost outline */}
          <Link href="/signup/candidat"
            className="hidden md:inline-flex items-center gap-1.5 border border-white/20 hover:border-white/40 text-white/70 hover:text-white transition-all rounded-lg font-semibold"
            style={{ padding: "0.4375rem 0.875rem", fontSize: "0.75rem" }}>
            Je cherche un emploi
          </Link>

          {/* Je recrute — brand CTA */}
          <Link href="/recrute"
            className="btn-brand"
            style={{ padding: "0.5rem 1.125rem", fontSize: "0.8125rem" }}>
            Je recrute
          </Link>
        </div>

      </div>
    </header>
  );
}
