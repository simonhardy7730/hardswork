import { adminClient } from "@/lib/billing/lifecycle";
import RemindCvButton from "@/components/admin/RemindCvButton";

export const dynamic = "force-dynamic";

const DAY = 86400000;
/** Jour calendaire à Bruxelles (AAAA-MM-JJ). */
const dayOf = (iso: string) => new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Brussels" }).format(new Date(iso));
const label = (d: string) => new Intl.DateTimeFormat("fr-BE", { day: "2-digit", month: "2-digit", timeZone: "UTC" }).format(new Date(d + "T12:00:00Z"));

export default async function AdminStatsPage() {
  const db = adminClient();
  const now = Date.now();
  const since30 = new Date(now - 30 * DAY).toISOString();
  const since7 = new Date(now - 7 * DAY).toISOString();
  const count = async (q: PromiseLike<{ count: number | null }>) => (await q).count ?? 0;

  const [candTotal, candAccounts, cand7, appTotal, app7, offersActive, orgCompany, orgAgency, appsRecent, candRecent, offers] = await Promise.all([
    count(db.from("candidates").select("id", { count: "exact", head: true })),
    count(db.from("candidates").select("id", { count: "exact", head: true }).not("auth_user_id", "is", null)),
    count(db.from("candidates").select("id", { count: "exact", head: true }).gte("created_at", since7)),
    count(db.from("applications").select("id", { count: "exact", head: true })),
    count(db.from("applications").select("id", { count: "exact", head: true }).gte("applied_at", since7)),
    count(db.from("job_offers").select("id", { count: "exact", head: true }).eq("status", "active")),
    count(db.from("organizations").select("id", { count: "exact", head: true }).eq("type", "company")),
    count(db.from("organizations").select("id", { count: "exact", head: true }).eq("type", "agency")),
    db.from("applications").select("applied_at, job_offer_id").gte("applied_at", since30).limit(5000),
    db.from("candidates").select("created_at").gte("created_at", since30).limit(5000),
    db.from("job_offers").select("id, title, city, status, organizations(name)").order("created_at", { ascending: false }).limit(300),
  ]);

  // Série des 30 derniers jours
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) days.push(dayOf(new Date(now - i * DAY).toISOString()));
  const perDay = (rows: { [k: string]: unknown }[] | null, key: string) => {
    const m = new Map(days.map((d) => [d, 0]));
    for (const r of rows ?? []) { const d = dayOf(r[key] as string); if (m.has(d)) m.set(d, (m.get(d) ?? 0) + 1); }
    return days.map((d) => m.get(d) ?? 0);
  };
  const apps = perDay(appsRecent.data, "applied_at");
  const cands = perDay(candRecent.data, "created_at");
  const max = Math.max(1, ...apps, ...cands);
  const today = days[days.length - 1];
  const appsToday = apps[apps.length - 1], candsToday = cands[cands.length - 1];

  // Candidatures par annonce (30 jours)
  const byOffer = new Map<string, number>();
  for (const r of appsRecent.data ?? []) byOffer.set(r.job_offer_id as string, (byOffer.get(r.job_offer_id as string) ?? 0) + 1);
  const offerRows = (offers.data ?? []).map((o) => {
    const org = (Array.isArray(o.organizations) ? o.organizations[0] : o.organizations) as { name?: string } | null;
    return { id: o.id as string, title: o.title as string, city: o.city as string, status: o.status as string, org: org?.name ?? "—", n: byOffer.get(o.id as string) ?? 0 };
  }).filter((o) => o.status === "active" || o.n > 0).sort((a, b) => b.n - a.n);

  // CV : candidatures avec CV, et candidatures récentes sans CV jamais relancées.
  const [cvCount, recentWithMail, recentReqs] = await Promise.all([
    count(db.from("cv_requests").select("id", { count: "exact", head: true }).eq("status", "fulfilled")),
    db.from("applications").select("id").not("applicant_email", "is", null).gte("applied_at", new Date(now - 45 * DAY).toISOString()).limit(2000),
    db.from("cv_requests").select("application_id").gte("created_at", new Date(now - 60 * DAY).toISOString()).limit(5000),
  ]);
  const asked = new Set((recentReqs.data ?? []).map((r) => r.application_id as string));
  const missingCv = (recentWithMail.data ?? []).filter((a) => !asked.has(a.id as string)).length;

  // Provenance (migration 033) : candidatures et inscriptions par lien / groupe, 30 jours.
  const [srcApps, srcCands] = await Promise.all([
    db.from("applications").select("source").gte("applied_at", since30).limit(5000),
    db.from("candidates").select("source").gte("created_at", since30).limit(5000),
  ]);
  const srcReady = !srcApps.error && !srcCands.error;
  const bySrc = new Map<string, { a: number; c: number }>();
  if (srcReady) {
    for (const r of srcApps.data ?? []) { const k = (r.source as string | null) ?? "inconnu"; const v = bySrc.get(k) ?? { a: 0, c: 0 }; v.a++; bySrc.set(k, v); }
    for (const r of srcCands.data ?? []) { const k = (r.source as string | null) ?? "inconnu"; const v = bySrc.get(k) ?? { a: 0, c: 0 }; v.c++; bySrc.set(k, v); }
  }
  const sources = [...bySrc.entries()].sort((x, y) => (y[1].a + y[1].c) - (x[1].a + x[1].c));

  const tiles: [string, string, string][] = [
    ["Candidatures aujourd'hui", String(appsToday), `${app7} sur 7 jours · ${appTotal} au total`],
    ["Nouveaux candidats aujourd'hui", String(candsToday), `${cand7} sur 7 jours · ${candTotal} au total`],
    ["Candidats avec un compte", String(candAccounts), "inscrits via l'espace candidat"],
    ["Offres actives", String(offersActive), `${orgCompany} entreprises · ${orgAgency} agences inscrites`],
    ["Candidatures avec CV", String(cvCount), `sur ${appTotal} candidatures (${appTotal ? Math.round((cvCount / appTotal) * 100) : 0} %)`],
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-black text-[#101F43]">Statistiques</h1>
        <a href="https://dash.cloudflare.com/?to=/:account/web-analytics" target="_blank" rel="noopener noreferrer"
          className="text-sm font-bold text-[#101F43] underline">Visites du site (Cloudflare) →</a>
      </div>

      <RemindCvButton missing={missingCv} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {tiles.map(([k, v, sub]) => (
          <div key={k} className="bg-white border border-ink-100 rounded-xl p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-ink-400">{k}</p>
            <p className="text-3xl font-black text-[#101F43] mt-1 tabular-nums">{v}</p>
            <p className="text-xs text-ink-500 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-ink-100 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="font-black text-[#101F43]">30 derniers jours</h2>
          <div className="flex gap-4 text-xs text-ink-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#FFB900]" />Candidatures</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#101F43]" />Nouveaux candidats</span>
          </div>
        </div>
        <div className="flex items-end gap-1 h-40" role="img" aria-label="Candidatures et nouveaux candidats par jour">
          {days.map((d, i) => (
            <div key={d} className="flex-1 flex items-end gap-px h-full" title={`${label(d)} : ${apps[i]} candidature(s), ${cands[i]} candidat(s)`}>
              <div className="flex-1 bg-[#FFB900] rounded-t" style={{ height: `${(apps[i] / max) * 100}%`, minHeight: apps[i] ? 3 : 0 }} />
              <div className="flex-1 bg-[#101F43] rounded-t" style={{ height: `${(cands[i] / max) * 100}%`, minHeight: cands[i] ? 3 : 0 }} />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-ink-400 mt-1"><span>{label(days[0])}</span><span>{label(days[14])}</span><span>{label(today)}</span></div>
      </div>

      <div className="bg-white border border-ink-100 rounded-xl overflow-x-auto">
        <h2 className="font-black text-[#101F43] p-4 pb-1">D&apos;où viennent les candidats (30 jours)</h2>
        <p className="text-xs text-ink-500 px-4 pb-2">Vrais résultats (candidatures et inscriptions), par lien. « inconnu » = arrivés avant le suivi. Ajoute <code>?g=nom-du-groupe</code> à tes liens Facebook pour voir quel groupe marche.</p>
        {!srcReady ? (
          <p className="text-sm text-amber-700 px-4 pb-4">Suivi pas encore activé : lancer la migration 033 dans Supabase.</p>
        ) : sources.length === 0 ? (
          <p className="text-sm text-ink-500 px-4 pb-4">Rien pour l&apos;instant.</p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase text-ink-400"><th className="px-4 py-2">Provenance</th><th className="px-4 py-2 text-right">Candidatures</th><th className="px-4 py-2 text-right">Inscriptions</th></tr></thead>
            <tbody>{sources.map(([k, v]) => (
              <tr key={k} className="border-t border-ink-100"><td className="px-4 py-2 font-semibold">{k}</td><td className="px-4 py-2 text-right tabular-nums">{v.a}</td><td className="px-4 py-2 text-right tabular-nums">{v.c}</td></tr>
            ))}</tbody>
          </table>
        )}
      </div>

      <div className="bg-white border border-ink-100 rounded-xl overflow-x-auto">
        <h2 className="font-black text-[#101F43] p-4 pb-2">Candidatures par annonce (30 jours)</h2>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-ink-400 uppercase">
            <th className="px-4 py-2">Annonce</th><th className="px-4 py-2">Entreprise</th><th className="px-4 py-2">Ville</th><th className="px-4 py-2 text-right">Candidatures</th>
          </tr></thead>
          <tbody>
            {offerRows.map((o) => (
              <tr key={o.id} className="border-t border-ink-100">
                <td className="px-4 py-2 font-semibold text-[#101F43]"><a href={`/jobs/${o.id}`} target="_blank" rel="noopener noreferrer" className="hover:underline">{o.title}</a></td>
                <td className="px-4 py-2 text-ink-500">{o.org}</td>
                <td className="px-4 py-2 text-ink-500">{o.city}</td>
                <td className="px-4 py-2 text-right font-black tabular-nums">{o.n}</td>
              </tr>
            ))}
            {offerRows.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-ink-400">Aucune annonce active.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-ink-400">Heures de Bruxelles. Les visites (pages vues, provenance Facebook/Google, mobile ou ordinateur) sont dans Cloudflare Web Analytics.</p>
    </div>
  );
}
