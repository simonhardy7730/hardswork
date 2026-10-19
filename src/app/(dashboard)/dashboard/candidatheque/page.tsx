import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrgAccess } from "@/lib/billing/access";
import { getDict } from "@/lib/i18n/server";
import { poolEnabled } from "@/lib/candidate/pool";
import { RADIUS_OPTIONS, citiesWithin } from "@/lib/geo/distance";
import { JOB_TYPES } from "@/lib/candidate/preferences";
import { labels } from "@/lib/utils";
import RevealContact from "@/components/dashboard/RevealContact";

type SP = { secteur?: string; lieu?: string; rayon?: string; type?: string; dispo?: string; page?: string };
type Row = {
  id: string; first_name: string; last_initial: string; city: string | null; sectors: string[] | null;
  availability: string; licenses: string[] | null; has_caces: boolean | null; experience_years: number | null;
  job_types: string[] | null; is_student: boolean | null;
};
const PAGE = 24;

export default async function CandidathequePage(props: { searchParams: Promise<SP> }) {
  if (!poolEnabled()) notFound();
  const sp = await props.searchParams;
  const { lang } = await getDict();
  const l = (fr: string, nl: string) => (lang === "nl" ? nl : fr);
  const LB = labels(lang);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("users").select("organization_id").eq("id", user.id).single();
  if (!profile) redirect("/onboarding");
  const { hasAccess } = await getOrgAccess(supabase, profile.organization_id);

  const lieu = (sp.lieu ?? "").trim().slice(0, 80);
  const rayon = RADIUS_OPTIONS.find((r) => String(r) === sp.rayon) ?? 0;
  const around = lieu && rayon ? citiesWithin(lieu, rayon) : null;
  const cities = around ? around.names : lieu ? [lieu] : null;
  const page = Math.max(0, parseInt(sp.page ?? "0", 10) || 0);

  let rows: Row[] = [];
  if (hasAccess) {
    const { data } = await supabase.rpc("search_candidate_pool", {
      p_sectors: sp.secteur ? [sp.secteur] : null,
      p_cities: cities,
      p_job_type: JOB_TYPES.some((t) => t.key === sp.type) ? sp.type : null,
      p_availability: ["immediate", "1_semaine", "1_mois"].includes(sp.dispo ?? "") ? sp.dispo : null,
      p_limit: PAGE + 1,
      p_offset: page * PAGE,
    });
    rows = (data as Row[] | null) ?? [];
  }
  const hasNext = rows.length > PAGE;
  rows = rows.slice(0, PAGE);

  const availLbl: Record<string, string> = {
    immediate: l("Disponible tout de suite", "Onmiddellijk beschikbaar"),
    "1_semaine": l("Disponible sous 1 semaine", "Beschikbaar binnen 1 week"),
    "1_mois": l("Disponible sous 1 mois", "Beschikbaar binnen 1 maand"),
  };
  const params = (extra: Record<string, string>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, ...extra })) if (v) p.set(k, String(v));
    return `?${p.toString()}`;
  };
  const sel = "h-11 rounded-xl border border-ink-100 bg-white px-3 text-sm";

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-display font-black text-ink uppercase leading-none" style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)" }}>
          {l("Candidathèque", "Kandidatenbank")}
        </h1>
        <p className="text-ink-500 text-sm mt-1">
          {l("Profils de candidats qui ont accepté d'être visibles des recruteurs abonnés.", "Profielen van kandidaten die ermee instemden zichtbaar te zijn voor werkgevers met een abonnement.")}
        </p>
      </div>

      {!hasAccess ? (
        <div className="bg-white border border-ink-100 rounded-2xl p-8 text-center">
          <p className="text-ink font-semibold mb-2">{l("La candidathèque est réservée aux organisations avec un essai ou un abonnement actif.", "De kandidatenbank is voorbehouden aan organisaties met een actieve proefperiode of abonnement.")}</p>
          <Link href="/dashboard/settings" className="btn-brand inline-flex mt-3">{l("Voir mon abonnement", "Mijn abonnement bekijken")}</Link>
        </div>
      ) : (
        <>
          <form method="GET" className="flex flex-wrap gap-2 items-center">
            <select name="secteur" defaultValue={sp.secteur ?? ""} className={sel} aria-label={l("Métier", "Beroep")}>
              <option value="">{l("Tous les métiers", "Alle beroepen")}</option>
              {Object.entries(LB.sector).map(([k, v]) => <option key={k} value={k}>{v as string}</option>)}
            </select>
            <input name="lieu" defaultValue={lieu} placeholder={l("Ville", "Stad")} className={`${sel} w-40`} />
            <select name="rayon" defaultValue={sp.rayon ?? ""} className={sel} aria-label={l("Distance", "Afstand")}>
              <option value="">{l("Distance", "Afstand")}</option>
              {RADIUS_OPTIONS.map((r) => <option key={r} value={r}>{`+${r} km`}</option>)}
            </select>
            <select name="type" defaultValue={sp.type ?? ""} className={sel} aria-label={l("Type d'emploi", "Soort job")}>
              <option value="">{l("Tous les types", "Alle types")}</option>
              {JOB_TYPES.map((t) => <option key={t.key} value={t.key}>{l(t.fr, t.nl)}</option>)}
            </select>
            <select name="dispo" defaultValue={sp.dispo ?? ""} className={sel} aria-label={l("Disponibilité", "Beschikbaarheid")}>
              <option value="">{l("Toute disponibilité", "Alle beschikbaarheid")}</option>
              {Object.entries(availLbl).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <button type="submit" className="h-11 px-5 rounded-xl bg-[#101F43] font-display font-black uppercase text-xs"
              style={{ letterSpacing: "0.05em", color: "#FFFFFF" }}>{l("Rechercher", "Zoeken")}</button>
          </form>

          {rows.length === 0 ? (
            <p className="text-ink-500 text-sm">{l("Aucun profil ne correspond pour l'instant. Élargissez la zone ou retirez un filtre.", "Geen profielen gevonden. Vergroot de regio of verwijder een filter.")}</p>
          ) : (
            <ul className="grid md:grid-cols-2 gap-3">
              {rows.map((c) => (
                <li key={c.id} className="bg-white border border-ink-100 rounded-2xl p-4 flex flex-col gap-3">
                  <div>
                    <p className="font-display font-black text-ink text-xl leading-tight">{c.first_name} {c.last_initial}.</p>
                    <p className="text-ink-500 text-sm">{[c.city, availLbl[c.availability]].filter(Boolean).join(" · ")}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(c.sectors ?? []).map((s) => <span key={s} className="text-xs bg-surface-2 text-ink rounded-full px-2.5 py-1">{(LB.sector as Record<string, string>)[s] ?? s}</span>)}
                    {(c.job_types ?? []).map((t) => { const jt = JOB_TYPES.find((x) => x.key === t); return jt ? <span key={t} className="text-xs border border-ink-100 text-ink-700 rounded-full px-2.5 py-1">{l(jt.fr, jt.nl)}</span> : null; })}
                    {c.has_caces && <span className="text-xs border border-ink-100 text-ink-700 rounded-full px-2.5 py-1">CACES</span>}
                    {(c.licenses ?? []).map((x) => <span key={x} className="text-xs border border-ink-100 text-ink-700 rounded-full px-2.5 py-1">{x}</span>)}
                  </div>
                  {c.experience_years != null && <p className="text-xs text-ink-500">{l(`${c.experience_years} an(s) d'expérience`, `${c.experience_years} jaar ervaring`)}</p>}
                  <RevealContact candidateId={c.id} />
                </li>
              ))}
            </ul>
          )}

          {(page > 0 || hasNext) && (
            <div className="flex gap-3">
              {page > 0 && <Link href={params({ page: String(page - 1) })} className="text-sm font-semibold underline">{l("Précédent", "Vorige")}</Link>}
              {hasNext && <Link href={params({ page: String(page + 1) })} className="text-sm font-semibold underline">{l("Suivant", "Volgende")}</Link>}
            </div>
          )}
          <p className="text-xs text-ink-500">
            {l("Les coordonnées sont réservées au recrutement. Chaque consultation est journalisée. Respectez le RGPD : contactez uniquement pour une offre concrète.",
               "Contactgegevens zijn enkel voor werving. Elke raadpleging wordt gelogd. Respecteer de GDPR: neem enkel contact op voor een concrete vacature.")}
          </p>
        </>
      )}
    </div>
  );
}
