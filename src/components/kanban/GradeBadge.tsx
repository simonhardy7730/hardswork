"use client";
import { GRADE_LABEL, summarize, type Grade, type MatchResult } from "@/lib/matching/score";
import { useL, useLang } from "@/lib/i18n/context";

const COLOR: Record<Grade, string> = {
  A: "bg-emerald-600 text-white", B: "bg-lime-500 text-white", C: "bg-amber-400 text-[#101F43]", D: "bg-orange-500 text-white", E: "bg-red-500 text-white",
};

/** Pastille A→E (compact, dans la carte). */
export function GradeChip({ match }: { match: MatchResult | null | undefined }) {
  const l = useL();
  const lang = useLang();
  if (!match) return null;
  if (!match.grade) return <span title={l("Pas assez d'informations vérifiables", "Te weinig controleerbare info")} className="inline-flex rounded-md px-1.5 py-0.5 text-[11px] font-bold bg-ink-100 text-ink-500">{l("Non évalué", "Niet beoordeeld")}</span>;
  return (
    <span title={`${l("Adéquation avec l'offre", "Match met de vacature")} : ${lang === "nl" ? GRADE_LABEL[match.grade].nl : GRADE_LABEL[match.grade].fr}`}
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-black ${COLOR[match.grade]}`}>
      {match.grade}<span className="font-bold opacity-90 hidden sm:inline">· {lang === "nl" ? GRADE_LABEL[match.grade].nl : GRADE_LABEL[match.grade].fr}</span>
    </span>
  );
}


const ICON: Record<string, { c: string; t: string }> = {
  ok: { c: "bg-emerald-100 text-emerald-700", t: "✓" }, partial: { c: "bg-amber-100 text-amber-700", t: "~" },
  no: { c: "bg-red-100 text-red-600", t: "✗" }, unknown: { c: "bg-ink-100 text-ink-400", t: "?" },
};
const REL = {
  same: { fr: "même poste", nl: "zelfde functie", c: "bg-emerald-100 text-emerald-700" },
  domain: { fr: "même domaine", nl: "zelfde domein", c: "bg-amber-100 text-amber-700" },
  other: { fr: "autre métier", nl: "ander beroep", c: "bg-ink-100 text-ink-500" },
} as const;
const dur = (m: number, nl: boolean) => (m >= 12 ? `${Math.round((m / 12) * 10) / 10} ${nl ? "jaar" : "an" + (m >= 18 ? "s" : "")}` : `${m} ${nl ? "mnd" : "mois"}`);
const VERDICT: Record<Grade, { fr: string; nl: string }> = {
  A: { fr: "Profil très cohérent avec l'offre.", nl: "Zeer coherent profiel voor de vacature." },
  B: { fr: "Profil globalement cohérent, avec quelques réserves.", nl: "Over het algemeen coherent profiel, met enkele kanttekeningen." },
  C: { fr: "Profil correct mais incomplet ou peu proche du poste.", nl: "Redelijk profiel maar onvolledig of niet dicht bij de functie." },
  D: { fr: "Peu de points communs avec l'offre.", nl: "Weinig gemeenschappelijke punten met de vacature." },
  E: { fr: "Profil peu adapté à cette offre.", nl: "Weinig geschikt profiel voor deze vacature." },
};

/** Bloc détaillé (fiche candidat) : verdict, pourquoi oui / pourquoi non, résumé du CV lu, détail du calcul. */
export function GradePanel({ match, name }: { match: MatchResult | null | undefined; name?: string }) {
  const l = useL();
  const lang = useLang();
  if (!match) return null;
  const nl = lang === "nl";
  const pick = (x: { fr: string; nl: string }) => (nl ? x.nl : x.fr);
  const who = name?.trim().split(/\s+/)[0] || l("Le candidat", "De kandidaat");
  const cv = match.cv;
  return (
    <div className="rounded-xl border border-ink-100 bg-surface p-3.5 space-y-3">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <p className="text-[11px] font-black uppercase tracking-widest text-ink-500">{l("Adéquation avec l'offre", "Match met de vacature")}</p>
          {match.grade ? <GradeChip match={match} /> : <span className="rounded-md px-1.5 py-0.5 text-[11px] font-black bg-ink-100 text-ink-500">{l("Non évalué", "Niet beoordeeld")}</span>}
        </div>
        <p className="text-sm text-ink-700 font-body font-semibold">{match.grade ? pick(VERDICT[match.grade]) : l("Pas assez d'informations vérifiables pour attribuer une note.", "Te weinig controleerbare informatie om een score te geven.")}</p>
        {match.capped && <p className="text-xs text-amber-700 font-body mt-1">⚠ {pick(match.capped)}</p>}
      </div>

      {match.good.length > 0 && (
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-emerald-700 mb-1">{l("Pourquoi il pourrait correspondre", "Waarom hij zou kunnen passen")}</p>
          <ul className="space-y-0.5 text-sm font-body text-ink-700 list-disc pl-4">{match.good.map((g, i) => <li key={i}>{who} {pick(g)}.</li>)}</ul>
        </div>
      )}
      {match.check.length > 0 && (
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-red-600 mb-1">{l("Pourquoi moins / à vérifier", "Waarom minder / te controleren")}</p>
          <ul className="space-y-0.5 text-sm font-body text-ink-700 list-disc pl-4">{match.check.map((g, i) => <li key={i}>{pick(g).charAt(0).toUpperCase() + pick(g).slice(1)}.</li>)}</ul>
        </div>
      )}

      {cv && cv.status !== "ok" && (
        <p className="text-xs font-body text-ink-500 italic">
          {cv.status === "unreadable" ? l("Un CV est joint mais c'est une image/un scan : Wolko ne peut pas le lire. Ouvre-le pour juger toi-même.", "Er is een cv bijgevoegd maar het is een beeld/scan: Wolko kan het niet lezen. Open het om zelf te oordelen.")
            : l("Le CV est en cours de lecture : recharge la page dans un instant.", "Het cv wordt gelezen: laad de pagina zo opnieuw.")}
        </p>
      )}
      {cv && cv.exps.length > 0 && (
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest text-ink-500 mb-1">{l("Résumé du CV lu", "Samenvatting van het gelezen cv")}</p>
          <p className="text-xs font-body text-ink-500 mb-1.5">
            {l(`${cv.exps.length} expérience${cv.exps.length > 1 ? "s" : ""} repérée${cv.exps.length > 1 ? "s" : ""}, ${dur(cv.totalMonths, false)} au total`, `${cv.exps.length} ervaring(en) gevonden, ${dur(cv.totalMonths, true)} in totaal`)}
            {cv.sameMonths > 0 ? l(` · dont ${dur(cv.sameMonths, false)} dans ce poste`, ` · waarvan ${dur(cv.sameMonths, true)} in deze functie`) : cv.domainMonths > 0 ? l(` · dont ${dur(cv.domainMonths, false)} dans le même domaine`, ` · waarvan ${dur(cv.domainMonths, true)} in hetzelfde domein`) : l(" · aucune dans ce poste ni ce domaine", " · geen in deze functie of dit domein")}.
          </p>
          <ul className="space-y-1">
            {cv.exps.map((e, i) => (
              <li key={i} className="flex items-start gap-2 text-xs font-body text-ink-700">
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${REL[e.rel].c}`}>{nl ? REL[e.rel].nl : REL[e.rel].fr}</span>
                <span><b>{e.role}</b> <span className="text-ink-400">({e.from} → {e.to}, {dur(e.months, nl)})</span></span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <details>
        <summary className="cursor-pointer text-xs font-bold text-brand min-h-9 flex items-center">{l("Voir le détail du calcul", "Bekijk de berekening")}</summary>
        <ul className="mt-2 space-y-1.5">
          {match.rows.map((r) => (
            <li key={r.key} className="flex items-start gap-2 text-xs font-body text-ink-700">
              <span className={`mt-0.5 w-4 h-4 shrink-0 rounded-full text-[10px] font-black flex items-center justify-center ${ICON[r.status].c}`}>{ICON[r.status].t}</span>
              <span>{pick(r)}</span>
            </li>
          ))}
        </ul>
        <p className="text-[11px] text-ink-500 mt-3 font-body leading-relaxed">
          {l("Comment lire la note : A = très bon, B = bon, C = correct, D = partiel, E = peu adapté. Seuls les critères vérifiables comptent (✓ ok, ~ partiel, ✗ non, ? impossible à vérifier). Pour un A, le parcours doit correspondre au poste ; si des critères importants sont inconnus, la note est plafonnée.", "Zo lees je de score: A = zeer goed, B = goed, C = redelijk, D = gedeeltelijk, E = weinig geschikt. Enkel controleerbare criteria tellen (✓ ok, ~ gedeeltelijk, ✗ nee, ? niet te controleren). Voor een A moet het parcours bij de functie passen; als belangrijke criteria onbekend zijn, wordt de score beperkt.")}
        </p>
      </details>
      <p className="text-[11px] text-ink-400 font-body">
        {l("Note automatique, sans IA, basée sur les informations fournies et le CV s'il est lisible (dates et mots-clés). Elle peut se tromper : c'est un tri, pas une décision.", "Automatische score, zonder AI, op basis van de opgegeven gegevens en het cv indien leesbaar (data en trefwoorden). Ze kan zich vergissen: een sortering, geen beslissing.")}
      </p>
    </div>
  );
}
