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
  if (!match?.grade) return null;
  return (
    <span title={`${l("Adéquation avec l'offre", "Match met de vacature")} : ${lang === "nl" ? GRADE_LABEL[match.grade].nl : GRADE_LABEL[match.grade].fr}`}
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-black ${COLOR[match.grade]}`}>
      {match.grade}<span className="font-bold opacity-90 hidden sm:inline">· {lang === "nl" ? GRADE_LABEL[match.grade].nl : GRADE_LABEL[match.grade].fr}</span>
    </span>
  );
}

/** Bloc détaillé (fiche candidat) : note + résumé des raisons. */
export function GradePanel({ match, name }: { match: MatchResult | null | undefined; name?: string }) {
  const l = useL();
  const lang = useLang();
  if (!match) return null;
  return (
    <div className="rounded-xl border border-ink-100 bg-surface p-3.5">
      <div className="flex items-center gap-2 mb-1.5">
        <p className="text-[11px] font-black uppercase tracking-widest text-ink-500">{l("Adéquation avec l'offre", "Match met de vacature")}</p>
        {match.grade && <GradeChip match={match} />}
      </div>
      <p className="text-sm text-ink-700 font-body leading-relaxed">{summarize(match, lang === "nl" ? "nl" : "fr", name?.trim().split(/\s+/)[0])}</p>
      <p className="text-[11px] text-ink-400 mt-2 font-body">
        {l("Note automatique basée sur les informations fournies (permis, disponibilités, présélection, lieu, expérience). Simple aide : c'est toi qui décides.", "Automatische score op basis van de opgegeven gegevens (rijbewijs, beschikbaarheid, voorselectie, plaats, ervaring). Louter een hulpmiddel: jij beslist.")}
      </p>
    </div>
  );
}
