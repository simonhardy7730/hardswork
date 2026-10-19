import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteNav } from "@/components/layout/SiteNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { getDict } from "@/lib/i18n/server";

export const metadata = { title: "Qui sommes-nous" };

/* Photos : déposer public/images/team/simon.webp et johnny.webp (carrées, visage centré).
   Tant qu'elles sont absentes, les initiales s'affichent. */
const FOUNDERS = [
  { name: "Simon Hardy", initials: "SH", photo: "/images/team/simon.webp" },
  { name: "Johnny Dassonville", initials: "JD", photo: "/images/team/johnny.webp" },
];

export default async function AboutPage() {
  const { t } = await getDict();
  const A = t.about;
  return (
    <div className="bg-surface font-body min-h-screen flex flex-col">
      <SiteNav />
      <main className="flex-1 pt-[60px]">
        {/* Intro */}
        <section className="brand-on-dark bg-[#101F43] noise">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
            <p className="text-[#FFB900] text-xs font-bold uppercase tracking-[0.14em] mb-4">{A.label}</p>
            <h1 className="font-display font-black text-white uppercase leading-[0.95] mb-6" style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)" }}>
              {A.title[0]}<br /><span className="text-brand">{A.title[1]}</span>
            </h1>
            <p className="text-white/80 text-lg leading-relaxed max-w-2xl">{A.intro}</p>
          </div>
        </section>

        {/* Fondateurs */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-14">
          <h2 className="font-display font-black text-ink uppercase text-sm tracking-widest mb-8">{A.teamTitle}</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {FOUNDERS.map((f) => (
              <div key={f.name} className="bg-white border border-ink-100 rounded-2xl p-7 flex flex-col items-center text-center">
                <div className="relative w-36 h-36 rounded-full overflow-hidden border-4 border-[#FFB900] bg-[#1C3058] flex items-center justify-center mb-5">
                  <span className="font-display font-black text-3xl text-white">{f.initials}</span>
                  <div role="img" aria-label={f.name} className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${f.photo})` }} />
                </div>
                <h3 className="font-display font-black text-ink text-xl">{f.name}</h3>
                <p className="text-sm font-bold text-brand mt-1">{A.role}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Histoire */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-6">
          <h2 className="font-display font-black text-ink uppercase text-sm tracking-widest mb-5">{A.storyTitle}</h2>
          <div className="space-y-4 text-ink-700 leading-relaxed text-[17px]">
            {A.story.map((p) => <p key={p.slice(0, 20)}>{p}</p>)}
          </div>
        </section>

        {/* Expérience */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <div className="bg-[#101F43] brand-on-dark rounded-2xl p-7">
            <h2 className="font-display font-black text-white text-xl mb-2">{A.expTitle}</h2>
            <p className="text-white/75 leading-relaxed">{A.exp}</p>
          </div>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link href="/jobs" className="btn-brand">{A.ctaCand} <ArrowRight size={15} /></Link>
            <Link href="/inscription/recruteur" className="btn-dark">{A.ctaRec} <ArrowRight size={15} /></Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
