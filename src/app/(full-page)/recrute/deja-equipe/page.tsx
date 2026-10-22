import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { SiteNav } from "@/components/layout/SiteNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { getDict } from "@/lib/i18n/server";
import { DE, type Bi } from "@/lib/recruiter-content";

// La langue vient du cookie de langue du site (pas de préfixe /fr ou /nl) : une seule URL, contenu FR ou NL.
export async function generateMetadata() {
  const { lang } = await getDict();
  const m = DE.meta;
  return {
    title: lang === "nl" ? m.title.nl : m.title.fr,
    description: lang === "nl" ? m.description.nl : m.description.fr,
    alternates: { canonical: "https://wolko.be/recrute/deja-equipe" },
  };
}

const DEMO_MAIL = "mailto:hello@wolko.be?subject=Demande%20de%20d%C3%A9monstration%20WOLKO";

export default async function DejaEquipePage() {
  const { lang } = await getDict();
  const t = (x: Bi) => (lang === "nl" ? x.nl : x.fr);

  return (
    <div className="min-h-screen bg-[#FFFBF2] font-body">
      <SiteNav />
      <div className="pt-[60px]">
        <div className="bg-[#101F43] px-6 pt-16 pb-20">
          <div className="max-w-4xl mx-auto">
            <h1 className="font-display font-black text-white uppercase leading-[0.95] mb-5"
              style={{ fontSize: "clamp(1.9rem, 4.6vw, 3.4rem)", letterSpacing: "-0.02em" }}>
              {t(DE.h1)}
            </h1>
            <p className="text-white/75 text-base sm:text-lg leading-relaxed max-w-2xl">{t(DE.intro)}</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14 space-y-14">
          <section>
            <h2 className="font-display font-black text-[#101F43] uppercase text-xl sm:text-2xl mb-3">{t(DE.complement.title)}</h2>
            <p className="text-ink-600 leading-relaxed">{t(DE.complement.text)}</p>
          </section>

          <section>
            <h2 className="font-display font-black text-[#101F43] uppercase text-xl sm:text-2xl mb-4">{t(DE.local.title)}</h2>
            <ul className="space-y-2.5">
              {DE.local.items.map((i) => (
                <li key={i.fr} className="flex items-start gap-2 text-ink-700"><Check size={16} className="text-brand shrink-0 mt-1" strokeWidth={3} /> {t(i)}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-display font-black text-[#101F43] uppercase text-xl sm:text-2xl mb-5">{t(DE.how.title)}</h2>
            <ol className="grid sm:grid-cols-3 gap-4">
              {DE.how.steps.map((s, i) => (
                <li key={s.t.fr} className="bg-white border border-ink-100 rounded-2xl p-5">
                  <span className="font-display font-black text-brand/40 text-3xl leading-none">0{i + 1}</span>
                  <h3 className="font-display font-black text-[#101F43] uppercase text-[13px] mt-2 mb-1.5">{t(s.t)}</h3>
                  <p className="text-sm text-ink-500 leading-relaxed">{t(s.d)}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="bg-white border border-brand/40 rounded-2xl p-6" data-testid="limits">
            <h2 className="font-display font-black text-[#101F43] uppercase text-lg mb-3">{t(DE.limits.title)}</h2>
            <ul className="space-y-2">
              {DE.limits.items.map((i) => (
                <li key={i.fr} className="flex items-start gap-2 text-sm text-ink-700"><span aria-hidden className="text-brand font-black">•</span> {t(i)}</li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl bg-[#101F43] p-7 sm:p-9">
            <h2 className="font-display font-black text-white uppercase text-xl sm:text-2xl mb-3">{t(DE.trial.title)}</h2>
            <p className="text-white/75 text-sm sm:text-base leading-relaxed mb-6">{t(DE.trial.text)}</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/recrute" className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-[#101F43] font-display font-black uppercase text-[13px] px-6 py-3.5 rounded-xl transition" style={{ letterSpacing: "0.05em" }}>
                {t(DE.trial.primary)} <ArrowRight size={14} />
              </Link>
              <a href={DEMO_MAIL} className="inline-flex items-center gap-2 border border-white/25 hover:border-brand text-white font-display font-black uppercase text-[13px] px-6 py-3.5 rounded-xl transition" style={{ letterSpacing: "0.05em" }}>
                {t(DE.trial.demo)}
              </a>
              <Link href="/tarifs" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-[13px] font-bold px-2 py-3.5">
                {t(DE.trial.prices)}
              </Link>
            </div>
          </section>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
