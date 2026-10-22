import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteNav } from "@/components/layout/SiteNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { GUIDES, guideBySlug } from "@/lib/ressources/guides";

export const dynamicParams = false;
export function generateStaticParams() { return GUIDES.map((g) => ({ slug: g.slug })); }

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const g = guideBySlug((await props.params).slug);
  if (!g) return {};
  return { title: `${g.titre} — Wolko`, description: g.resume, alternates: { canonical: `https://wolko.be/ressources/guides/${g.slug}` } };
}

const fmt = (d: string) => new Date(d + "T12:00:00Z").toLocaleDateString("fr-BE", { day: "numeric", month: "long", year: "numeric" });

export default async function GuidePage(props: { params: Promise<{ slug: string }> }) {
  const g = guideBySlug((await props.params).slug);
  if (!g) notFound();
  return (
    <div className="min-h-screen bg-[#FFFBF2] font-body">
      <SiteNav />
      <main className="pt-[60px]">
        <article className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
          <Link href="/ressources" className="text-sm text-[#101F43]/60 hover:text-[#101F43]">← Ressources</Link>
          <h1 className="font-display font-black uppercase text-[#101F43] leading-[0.95] mt-3" style={{ fontSize: "clamp(1.8rem, 4.5vw, 3rem)" }}>{g.titre}</h1>
          <p className="text-[#101F43]/70 mt-3">{g.resume}</p>
          <p className="text-xs text-[#101F43]/50 mt-2">Vérifié le {fmt(g.verifie)}</p>
          {g.points.map((s) => (
            <section key={s.t} className="mt-8">
              <h2 className="font-display font-black uppercase text-[#101F43] text-xl mb-2">{s.t}</h2>
              <ul className="space-y-2 list-disc pl-5 text-[#101F43]/85 leading-relaxed">{s.p.map((x) => <li key={x}>{x}</li>)}</ul>
            </section>
          ))}
          <section className="mt-10 border-t border-[#101F43]/10 pt-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#101F43]/50 mb-2">Sources officielles</h2>
            <ul className="space-y-1 text-sm">{g.sources.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer" className="text-[#101F43] underline">{s.label}</a></li>)}</ul>
            <p className="text-xs text-[#101F43]/55 mt-4">Information générale, pas un conseil juridique. Les règles changent : vérifie toujours la source avant de décider.</p>
          </section>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
