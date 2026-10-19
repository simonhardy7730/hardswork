import Link from "next/link";
import { ArrowRight, Building2, Network } from "lucide-react";
import { SiteNav } from "@/components/layout/SiteNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { getDict } from "@/lib/i18n/server";

export const metadata = { title: "Je recrute" };

export default function RecruteurChoicePage() {
  const { t } = getDict();
  const L = t.recruiterChoice;
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
            <Link href="/signup?type=company" className="group flex flex-col bg-white border border-ink-100 rounded-2xl p-7 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FFB900] transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-[#101F43] flex items-center justify-center mb-5"><Building2 size={22} className="text-[#FFB900]" aria-hidden /></div>
              <h2 className="font-display font-black text-ink text-2xl mb-2">{L.entTitle}</h2>
              <p className="text-sm text-ink-500 mb-5 flex-1">{L.entText}</p>
              <span className="font-bold text-sm text-[#101F43] inline-flex items-center gap-1.5">{L.entCta} <ArrowRight size={14} /></span>
            </Link>
            <Link href="/signup?type=agency" className="group flex flex-col bg-[#101F43] rounded-2xl p-7 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FFB900] transition-shadow brand-on-dark">
              <div className="w-12 h-12 rounded-xl bg-brand flex items-center justify-center mb-5"><Network size={22} className="text-[#101F43]" aria-hidden /></div>
              <h2 className="font-display font-black text-white text-2xl mb-2">{L.agTitle}</h2>
              <p className="text-sm text-white/70 mb-5 flex-1">{L.agText}</p>
              <span className="font-bold text-sm text-brand inline-flex items-center gap-1.5">{L.agCta} <ArrowRight size={14} /></span>
            </Link>
          </div>
          <p className="text-sm text-ink-500 mt-8">
            <Link href="/recrute" className="font-bold text-brand underline">{L.learn}</Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
