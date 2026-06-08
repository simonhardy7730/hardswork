import Link from "next/link";
import { HardSworkLogo, HardieIcon } from "@/components/ui/HardieIcon";
import { ArrowRight, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0F0E0D] font-body flex flex-col">
      {/* Nav minimal */}
      <header className="px-6 h-[60px] flex items-center border-b border-white/[0.07]">
        <Link href="/"><HardSworkLogo size="md" dark /></Link>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center py-20">
        {/* Hardie mascot */}
        <div className="mb-6">
          <HardieIcon size={96} />
        </div>

        {/* 404 number */}
        <p
          className="font-display font-black text-white/10 leading-none mb-4 select-none"
          style={{ fontSize: "clamp(6rem, 20vw, 14rem)", letterSpacing: "-0.04em" }}
        >
          404
        </p>

        {/* Headline */}
        <h1
          className="font-display font-black text-white uppercase leading-none mb-4 -mt-8"
          style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", letterSpacing: "-0.02em" }}
        >
          Cette page n&apos;existe{" "}
          <span className="text-brand">[pas].</span>
        </h1>

        <p className="text-white/40 text-sm max-w-sm mb-8 leading-relaxed">
          La page que vous cherchez a peut-être été déplacée, supprimée, ou n&apos;existe tout simplement pas.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 font-display font-black uppercase text-white bg-brand hover:bg-brand-dark transition rounded-xl px-6 py-3 text-sm"
            style={{ letterSpacing: "0.05em" }}
          >
            Retour à l&apos;accueil
            <ArrowRight size={15} />
          </Link>
          <Link
            href="/jobs"
            className="flex items-center gap-2 font-display font-black uppercase text-white/60 hover:text-white border border-white/15 hover:border-white/30 transition rounded-xl px-6 py-3 text-sm"
            style={{ letterSpacing: "0.05em" }}
          >
            <Search size={14} />
            Voir les offres
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-white/[0.07] text-center">
        <p className="text-xs text-white/20">
          © 2025 HardSwork · Belgique · Tous droits réservés
        </p>
      </footer>
    </div>
  );
}
