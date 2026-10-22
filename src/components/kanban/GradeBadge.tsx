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

/** Bloc détaillé (fiche candidat) : note, résumé, détail critère par critère et ce qui n'a pas pu être vérifié. */
export function GradePanel({ match, name }: { match: MatchResult | null | undefined; name?: string }) {
  const l = useL();
  const lang = useLang();
  if (!match) return null;
  const pick = (x: { fr: string; nl: string }) => (lang === "nl" ? x.nl : x.fr);
  return (
    <div className="rounded-xl border border-ink-100 bg-surface p-3.5">
      <div className="flex items-center gap-2 mb-1.5">
        <p className="text-[11px] font-black uppercase tracking-widest text-ink-500">{l("Adéquation avec l'offre", "Match met de vacature")}</p>
        {match.grade ? <GradeChip match={match} /> : <span className="rounded-md px-1.5 py-0.5 text-[11px] font-black bg-ink-100 text-ink-500">{l("Non évalué", "Niet beoordeeld")}</span>}
      </div>
      <p className="text-sm text-ink-700 font-body leading-relaxed">{summarize(match, lang === "nl" ? "nl" : "fr", name?.trim().split(/\s+/)[0])}</p>
      {match.capped && <p className="text-xs text-amber-700 font-body mt-1.5">⚠ {pick(match.capped)}</p>}
      <details className="mt-2.5 group">
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
      <p className="text-[11px] text-ink-400 mt-2 font-body">
        {l("Note automatique, sans IA, basée sur les informations fournies et le CV s'il est lisible. Simple aide : c'est toi qui décides.", "Automatische score, zonder AI, op basis van de opgegeven gegevens en het cv indien leesbaar. Louter een hulpmiddel: jij beslist.")}
      </p>
    </div>
  );
}
