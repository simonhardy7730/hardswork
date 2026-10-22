import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteNav } from "@/components/layout/SiteNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { BAREMES, baremeBySlug, eur } from "@/lib/ressources/baremes";

export const dynamicParams = false;
export function generateStaticParams() { return BAREMES.map((b) => ({ cp: b.slug })); }

const fmt = (d: string) => new Date(d + "T12:00:00Z").toLocaleDateString("fr-BE", { day: "numeric", month: "long", year: "numeric" });

export async function generateMetadata(props: { params: Promise<{ cp: string }> }): Promise<Metadata> {
  const b = baremeBySlug((await props.params).cp);
  if (!b) return {};
  return {
    title: `Barème ${b.titre} — salaires minimums — Wolko`,
    description: `Salaires horaires minimums bruts ${b.titre}, en vigueur depuis le ${fmt(b.enVigueur)}. Source officielle.`,
    alternates: { canonical: `https://wolko.be/ressources/baremes/${b.slug}` },
  };
}

export default async function BaremePage(props: { params: Promise<{ cp: string }> }) {
  const b = baremeBySlug((await props.params).cp);
  if (!b) notFound();
  return (
    <div className="min-h-screen bg-[#FFFBF2] font-body">
      <SiteNav />
      <main className="pt-[60px]">
        <article className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
          <Link href="/ressources/baremes" className="text-sm text-[#101F43]/60 hover:text-[#101F43]">← Barèmes</Link>
          <h1 className="font-display font-black uppercase text-[#101F43] leading-[0.95] mt-3" style={{ fontSize: "clamp(1.8rem, 4.5vw, 3rem)" }}>Barème {b.titre}</h1>
          <p className="text-[#101F43]/70 mt-3">Salaires horaires minimums bruts, en vigueur depuis le {fmt(b.enVigueur)}.{b.heures ? ` ${b.heures}.` : ""} {b.prochaine ?? ""}</p>
          <p className="text-xs text-[#101F43]/50 mt-2">Vérifié le {fmt(b.verifie)}</p>
          <div className="mt-6 bg-white border border-[#101F43]/10 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-[#101F43] text-white text-left"><th className="px-4 py-3 font-semibold">Catégorie</th><th className="px-4 py-3 font-semibold text-right">Minimum brut / heure</th></tr></thead>
              <tbody>
                {b.lignes.map((r, i) => (
                  <tr key={r.cat + i} className="border-t border-[#101F43]/10">
                    <td className="px-4 py-2.5">{r.cat}{r.label && <span className="text-[#101F43]/55"> · {r.label}</span>}</td>
                    <td className="px-4 py-2.5 text-right font-semibold tabular-nums">{eur(r.montant)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="mt-6 space-y-2 list-disc pl-5 text-[#101F43]/85 leading-relaxed text-sm">
            {b.notes.map((n) => <li key={n}>{n}</li>)}
            <li>Ce sont des minimums : ton contrat ou ton ancienneté peuvent donner plus. Le net dépend de ta situation personnelle (impôts, cotisations).</li>
          </ul>
          <section className="mt-10 border-t border-[#101F43]/10 pt-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#101F43]/50 mb-2">Source</h2>
            <ul className="space-y-1 text-sm">{b.sources.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer" className="underline text-[#101F43]">{s.label}</a></li>)}</ul>
            <p className="text-xs text-[#101F43]/55 mt-4">Information indicative, pas un conseil juridique. En cas de doute, vérifie auprès de ton syndicat ou de ton secrétariat social.</p>
          </section>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
