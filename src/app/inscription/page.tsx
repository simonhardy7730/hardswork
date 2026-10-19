import Link from "next/link";
import { ArrowRight, Search, Building2 } from "lucide-react";
import { SiteNav } from "@/components/layout/SiteNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { getDict } from "@/lib/i18n/server";

export const metadata = { title: "Créer un compte" };

export default function InscriptionPage() {
  const { t } = getDict();
  const L = t.signup;
  return (
    <div className="bg-surface font-body min-h-screen flex flex-col">
      <SiteNav />
      <main className="flex-1 pt-[60px]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <h1 className="font-display font-black text-ink uppercase leading-none mb-3"
            style={{ fontSize: "clamp(2.2rem, 6vw, 4rem)" }}>
            {L.title}
          </h1>
          <p className="text-ink-500 mb-10">{L.ask}</p>
          <div className="grid md:grid-cols-2 gap-4">
            <Link href="/signup/candidat" className="group bg-white border border-ink-100 rounded-2xl p-7 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-brand flex items-center justify-center mb-5"><Search size={22} className="text-[#101F43]" /></div>
              <h2 className="font-display font-black text-ink text-2xl mb-2">{L.candTitle}</h2>
              <p className="text-sm text-ink-500 mb-5">{L.candText}</p>
              <span className="font-bold text-sm text-brand inline-flex items-center gap-1.5">{L.candCta} <ArrowRight size={14} /></span>
            </Link>
            <Link href="/recrute" className="group bg-[#101F43] rounded-2xl p-7 hover:shadow-lg transition-shadow brand-on-dark">
              <div className="w-12 h-12 rounded-xl bg-brand flex items-center justify-center mb-5"><Building2 size={22} className="text-[#101F43]" /></div>
              <h2 className="font-display font-black text-white text-2xl mb-2">{L.recTitle}</h2>
              <p className="text-sm text-white/65 mb-5">{L.recText}</p>
              <span className="font-bold text-sm text-brand inline-flex items-center gap-1.5">{L.recCta} <ArrowRight size={14} /></span>
            </Link>
          </div>
          <p className="text-sm text-ink-500 mt-8">{L.already} <Link href="/login" className="font-bold text-brand underline">{L.login}</Link></p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
