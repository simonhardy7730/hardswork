import { adminClient } from "@/lib/billing/lifecycle";
import RemindCvButton from "@/components/admin/RemindCvButton";

export const dynamic = "force-dynamic";

const DAY = 86400000;
/** Jour calendaire à Bruxelles (AAAA-MM-JJ). */
const dayOf = (iso: string) => new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Brussels" }).format(new Date(iso));
const label = (d: string) => new Intl.DateTimeFormat("fr-BE", { day: "2-digit", month: "2-digit", timeZone: "UTC" }).format(new Date(d + "T12:00:00Z"));

const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? v[0] ?? null : v ?? null);

/** Comptes de test de l'équipe (exclus des chiffres par défaut). Compléter avec STATS_TEST_PATTERNS=motif1,motif2 */
const TEST_PATTERNS = [
  "simonhardy", "dassonville", "@wolko.be", "@jobalto.be",
  ...(process.env.STATS_TEST_PATTERNS ?? "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean),
  ...(process.env.INTERNAL_SIGNUP_EMAILS ?? "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean),
];
const isTestMail = (e: string | null | undefined) => { const m = (e ?? "").toLowerCase(); return !!m && TEST_PATTERNS.some((p) => m.includes(p)); };

const chunk = <T,>(a: T[], n: number) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));

export default async function AdminStatsPage(props: { searchParams?: Promise<{ tests?: string }> }) {
  const withTests = (await props.searchParams)?.tests === "1";
  const db = adminClient();
  const now = Date.now();
  const since30 = new Date(now - 30 * DAY).toISOString();
  const since7 = now - 7 * DAY;
  const adultLimit = new Date(now - 18 * 365.25 * DAY).toISOString().slice(0, 10);
  const consentLimit = now - 730 * DAY;

  const [candQ, appQ, reqQ, offersActiveQ, orgCompany, orgAgency, offers] = await Promise.all([
    db.from("candidates").select("id, email, auth_user_id, created_at, visible_to_recruiters, status, birth_date, visibility_consent_at").limit(5000),
    db.from("applications").select("id, job_offer_id, applicant_email, applicant_phone, applied_at, candidate_id").limit(5000),
    db.from("cv_requests").select("application_id, status, cv_path").limit(5000),
    db.from("job_offers").select("id", { count: "exact", head: true }).eq("status", "active"),
    db.from("organizations").select("id", { count: "exact", head: true }).eq("type", "company"),
    db.from("organizations").select("id", { count: "exact", head: true }).eq("type", "agency"),
    db.from("job_offers").select("id, title, city, status, organizations(name)").order("created_at", { ascending: false }).limit(300),
  ]);
  const keep = (e: string | null | undefined) => withTests || !isTestMail(e);
  const allCands = (candQ.data ?? []) as { id: string; email: string | null; auth_user_id: string | null; created_at: string; visible_to_recruiters: boolean | null; status: string | null; birth_date: string | null; visibility_consent_at: string | null }[];
  const allApps = (appQ.data ?? []) as { id: string; job_offer_id: string; applicant_email: string | null; applicant_phone: string | null; applied_at: string; candidate_id: string | null }[];
  const cands = allCands.filter((c) => keep(c.email));
  const apps = allApps.filter((a) => keep(a.applicant_email));
  const testCands = allCands.length - cands.length;
  const testApps = allApps.length - apps.length;

  // ── Candidats : de « profil créé » à « visible avec un CV » ──
  const visible = cands.filter((c) => c.visible_to_recruiters === true && c.status === "actif" && !!c.birth_date && c.birth_date <= adultLimit
    && !!c.visibility_consent_at && new Date(c.visibility_consent_at).getTime() > consentLimit);
  const cvOf = new Map<string, { kind: "file" | "built"; path?: string }>();
  try {
    const { findPoolCvs } = await import("@/lib/candidate/pool-cv");
    for (const ids of chunk(visible.map((c) => c.id), 80)) for (const [k, v] of await findPoolCvs(ids)) cvOf.set(k, v.kind === "file" ? { kind: "file", path: v.path } : { kind: "built" });
  } catch { /* sans détail CV, les autres chiffres restent justes */ }
  const isMini = (c: { kind: string; path?: string }) => c.kind === "built" || (c.path ?? "").endsWith(".wolko.json");
  const visRealCv = visible.filter((c) => { const v = cvOf.get(c.id); return v && !isMini(v); }).length;
  const visWolkoCv = visible.filter((c) => { const v = cvOf.get(c.id); return v && isMini(v); }).length;
  const visNoCv = visible.length - visRealCv - visWolkoCv;
  const withAccount = cands.filter((c) => c.auth_user_id).length;
  const hidden = cands.length - visible.length;

  // ── Candidatures : personnes, CV réels / CV Wolko / sans CV ──
  const reqBy = new Map((reqQ.data ?? []).map((r) => [r.application_id as string, r as { status: string; cv_path: string | null }]));
  const persons = new Set(apps.map((a) => (a.applicant_email || a.applicant_phone || a.id).toLowerCase().trim()));
  let appReal = 0, appWolko = 0, appNone = 0;
  for (const a of apps) {
    const r = reqBy.get(a.id);
    if (!r || r.status !== "fulfilled" || !r.cv_path) appNone++;
    else if (r.cv_path.endsWith(".wolko.json")) appWolko++;
    else appReal++;
  }
  const appToday = apps.filter((a) => dayOf(a.applied_at) === dayOf(new Date(now).toISOString())).length;
  const app7 = apps.filter((a) => new Date(a.applied_at).getTime() >= since7).length;
  const candToday = cands.filter((c) => dayOf(c.created_at) === dayOf(new Date(now).toISOString())).length;
  const cand7 = cands.filter((c) => new Date(c.created_at).getTime() >= since7).length;

  // ── Série des 30 derniers jours ──
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) days.push(dayOf(new Date(now - i * DAY).toISOString()));
  const perDay = (rows: { [k: string]: unknown }[], key: string) => {
    const m = new Map(days.map((d) => [d, 0]));
    for (const r of rows) { const d = dayOf(r[key] as string); if (m.has(d)) m.set(d, (m.get(d) ?? 0) + 1); }
    return days.map((d) => m.get(d) ?? 0);
  };
  const appsSeries = perDay(apps, "applied_at");
  const candsSeries = perDay(cands, "created_at");
  const max = Math.max(1, ...appsSeries, ...candsSeries);
  const today = days[days.length - 1];

  // Candidatures par annonce (30 jours)
  const byOffer = new Map<string, number>();
  for (const r of apps) if (new Date(r.applied_at).toISOString() >= since30) byOffer.set(r.job_offer_id, (byOffer.get(r.job_offer_id) ?? 0) + 1);
  const offerRows = (offers.data ?? []).map((o) => {
    const org = one(o.organizations as { name?: string } | { name?: string }[] | null);
    return { id: o.id as string, title: o.title as string, city: o.city as string, status: o.status as string, org: org?.name ?? "—", n: byOffer.get(o.id as string) ?? 0 };
  }).filter((o) => o.status === "active" || o.n > 0).sort((a, b) => b.n - a.n);

  // Relance CV : candidatures récentes sans CV jamais relancées.
  const asked = new Set((reqQ.data ?? []).map((r) => r.application_id as string));
  const missingCv = apps.filter((a) => a.applicant_email && now - new Date(a.applied_at).getTime() < 45 * DAY && !asked.has(a.id)).length;

  // Provenance (migration 033) : candidatures et inscriptions par lien / groupe, 30 jours.
  const [srcApps, srcCands] = await Promise.all([
    db.from("applications").select("id, source").gte("applied_at", since30).limit(5000),
    db.from("candidates").select("id, source").gte("created_at", since30).limit(5000),
  ]);
  const srcReady = !srcApps.error && !srcCands.error;
  const okApp = new Set(apps.map((a) => a.id)), okCand = new Set(cands.map((c) => c.id));
  const bySrc = new Map<string, { a: number; c: number }>();
  if (srcReady) {
    for (const r of srcApps.data ?? []) { if (!okApp.has(r.id as string)) continue; const k = (r.source as string | null) ?? "inconnu"; const v = bySrc.get(k) ?? { a: 0, c: 0 }; v.a++; bySrc.set(k, v); }
    for (const r of srcCands.data ?? []) { if (!okCand.has(r.id as string)) continue; const k = (r.source as string | null) ?? "inconnu"; const v = bySrc.get(k) ?? { a: 0, c: 0 }; v.c++; bySrc.set(k, v); }
  }
  const sources = [...bySrc.entries()].sort((x, y) => (y[1].a + y[1].c) - (x[1].a + x[1].c));

  const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)} %` : "0 %");
  const candTiles: [string, string, string][] = [
    ["Profils créés", String(cands.length), `${cand7} cette semaine · ${candToday} aujourd'hui · ${withAccount} avec un compte`],
    ["Visibles dans la candidathèque", String(visible.length), `${pct(visible.length, cands.length)} des profils · les ${hidden} autres n'ont pas coché la case (ou ont moins de 18 ans)`],
    ["…dont avec leur propre CV", String(visRealCv), "photo ou fichier envoyé par le candidat"],
    ["…dont avec un CV Wolko", String(visWolkoCv), "créé par Wolko avec leurs réponses"],
    ["…dont sans aucun CV", String(visNoCv), "à relancer : les employeurs les appellent en dernier"],
  ];
  const appTiles: [string, string, string][] = [
    ["Candidatures", String(apps.length), `${app7} cette semaine · ${appToday} aujourd'hui`],
    ["Personnes différentes", String(persons.size), "une personne peut postuler à plusieurs offres"],
    ["Avec leur propre CV", String(appReal), pct(appReal, apps.length)],
    ["Avec un CV Wolko", String(appWolko), pct(appWolko, apps.length)],
    ["Sans CV", String(appNone), pct(appNone, apps.length)],
  ];
  const otherTiles: [string, string, string][] = [
    ["Offres actives", String(offersActiveQ.count ?? 0), `${orgCompany.count ?? 0} entreprises · ${orgAgency.count ?? 0} agences inscrites`],
  ];
  const Tiles = ({ title, tiles }: { title: string; tiles: [string, string, string][] }) => (
    <div className="space-y-2">
      <h2 className="text-sm font-black uppercase tracking-wide text-[#101F43]">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {tiles.map(([k, v, sub]) => (
          <div key={k} className="bg-white border border-ink-100 rounded-xl p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-ink-400">{k}</p>
            <p className="text-3xl font-black text-[#101F43] mt-1 tabular-nums">{v}</p>
            <p className="text-xs text-ink-500 mt-1">{sub}</p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-black text-[#101F43]">Statistiques</h1>
        <a href="https://dash.cloudflare.com/?to=/:account/web-analytics" target="_blank" rel="noopener noreferrer"
          className="text-sm font-bold text-[#101F43] underline">Visites du site (Cloudflare) →</a>
      </div>
      <p className="text-xs text-ink-500">
        {withTests
          ? <>Tout est compté, <strong>comptes de test compris</strong>. </>
          : <>Comptes de test de l&apos;équipe exclus ({testCands} profil(s), {testApps} candidature(s)). </>}
        <a href={withTests ? "?" : "?tests=1"} className="underline font-bold">{withTests ? "Masquer les tests" : "Les inclure"}</a>
      </p>

      <RemindCvButton missing={missingCv} />

      <Tiles title="Candidats (profils)" tiles={candTiles} />
      <Tiles title="Candidatures (postuler à une offre)" tiles={appTiles} />
      <Tiles title="Plateforme" tiles={otherTiles} />

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
            <div key={d} className="flex-1 flex items-end gap-px h-full" title={`${label(d)} : ${appsSeries[i]} candidature(s), ${candsSeries[i]} candidat(s)`}>
              <div className="flex-1 bg-[#FFB900] rounded-t" style={{ height: `${(appsSeries[i] / max) * 100}%`, minHeight: appsSeries[i] ? 3 : 0 }} />
              <div className="flex-1 bg-[#101F43] rounded-t" style={{ height: `${(candsSeries[i] / max) * 100}%`, minHeight: candsSeries[i] ? 3 : 0 }} />
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
