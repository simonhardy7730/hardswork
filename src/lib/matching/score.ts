// Note A→E d'une candidature par rapport à l'offre : RÈGLES SIMPLES, explicables, sans IA et sans coût.
// Principes : (1) seuls comptent les critères vérifiables des deux côtés ; (2) ce qui ne peut PAS être vérifié est dit
// clairement au recruteur ; (3) un A exige que le parcours colle au poste, pas seulement « habite près + répond oui ».
import { findCity, distanceKm, normalizePlace } from "@/lib/geo/distance";
import { questionsFor } from "@/lib/screening";

export type Grade = "A" | "B" | "C" | "D" | "E";
export interface MatchOffer {
  title: string; sector: string | null; city: string | null;
  description?: string | null; requirements?: string | null;
  required_licenses?: string[] | null; screening_ids?: string[] | null;
  days_needed?: string[] | null; time_slots?: string[] | null;
}
export interface MatchApplication {
  licenses?: string[] | null; has_caces?: boolean | null; caces_types?: string[] | null;
  availability_slots?: string[] | null; screening_answers?: Record<string, boolean> | null;
}
export interface CvFindings { licenses: string[]; titleHits: string[]; sectorHits: string[]; years: number | null }
/** Infos du profil candidat. `sectors`/`trades` ne doivent venir que d'un profil rempli PAR le candidat (jamais déduits de l'offre). */
export interface MatchProfile {
  city?: string | null; sectors?: string[] | null; trades?: string[] | null;
  experienceRoles?: string[]; // intitulés de poste du CV créé sur Wolko
  cv?: CvFindings | null;     // ce qui a été retrouvé dans le CV déposé (PDF/Word)
}
export type RowStatus = "ok" | "partial" | "no" | "unknown";
export interface Row { key: "licenses" | "screening" | "availability" | "distance" | "fit"; status: RowStatus; fr: string; nl: string }
export interface MatchResult {
  grade: Grade | null; percent: number | null;
  good: { fr: string; nl: string }[]; check: { fr: string; nl: string }[];
  rows: Row[]; capped?: { fr: string; nl: string } | null;
}

const STOP = new Set(["de", "du", "des", "la", "le", "les", "et", "en", "au", "aux", "un", "une", "h", "f", "m", "x", "d", "l", "cdi", "cdd", "interim", "int"]);
const words = (s: string) => normalizePlace(s).split(/[^a-z0-9]+/).filter((w) => w.length >= 4 && !STOP.has(w));
export const titleWords = (s: string) => words(s);
const NO_GO = ["travail_be"]; // réponse « non » = pas de note au-dessus de E
/** Questions « de base » : presque tout le monde répond oui, elles ne distinguent pas les profils (poids réduit). */
const GENERIC_Q = new Set(["langue", "travail_be", "debout", "horaires", "vehicule"]);

/** Mots du texte de l'offre → exigences « conseillées » (permis, CACES, VCA), quand l'entreprise ne les a pas cochées. */
export function softRequirements(o: MatchOffer): string[] {
  const t = normalizePlace(`${o.title} ${o.description ?? ""} ${o.requirements ?? ""}`);
  const out: string[] = [];
  const m = t.match(/permis (ce|c|b|d)\b/g);
  for (const x of m ?? []) out.push(x.split(" ")[1].toUpperCase());
  if (/\bcaces\b/.test(t)) out.push("CACES");
  if (/\bvca\b/.test(t)) out.push("VCA");
  return Array.from(new Set(out)).slice(0, 4);
}

export function scoreApplication(app: MatchApplication, offer: MatchOffer, profile: MatchProfile = {}): MatchResult {
  const rows: Row[] = [];
  const good: MatchResult["good"] = [], check: MatchResult["check"] = [];
  const ev: { w: number; ratio: number; strong: boolean }[] = [];
  let applicable = 0; // poids de tous les critères pertinents pour cette offre (vérifiables ou non)
  let missingRequired = false, noGo = false;
  let fitRatio: number | null = null;

  // 1. Permis / qualifications (cochés par l'entreprise = exigés ; sinon lus dans le texte de l'annonce = conseillés)
  const hard = (offer.required_licenses ?? []).filter(Boolean);
  const soft = hard.length ? [] : softRequirements(offer);
  const req = hard.length ? hard : soft;
  const fromCv = new Set((profile.cv?.licenses ?? []).map((x) => x.toUpperCase()));
  if (req.length) {
    const w = hard.length ? 25 : 10; applicable += w;
    const own = new Set([...(app.licenses ?? []), ...(app.has_caces ? ["CACES"] : [])].map((x) => x.toUpperCase()));
    const have = new Set([...own, ...fromCv]);
    const ok = req.filter((r) => have.has(r.toUpperCase()));
    const readable = !!profile.cv;
    const unverifiable = req.filter((r) => !have.has(r.toUpperCase()) && r.toUpperCase() === "VCA" && !readable); // VCA : n'existe que dans un CV
    const ratio = ok.length / req.length;
    const word = hard.length ? { fr: "demandés", nl: "gevraagd" } : { fr: "conseillés dans l'annonce", nl: "aangeraden in de vacature" };
    if (unverifiable.length === req.length - ok.length && unverifiable.length && !ok.length) {
      rows.push({ key: "licenses", status: "unknown", fr: `Qualifications ${word.fr} (${req.join(", ")}) : impossibles à vérifier sans CV lisible`, nl: `Kwalificaties ${word.nl} (${req.join(", ")}): niet te controleren zonder leesbaar cv` });
      applicable -= w;
    } else {
      ev.push({ w, ratio, strong: true });
      const onlyCv = ok.filter((r) => fromCv.has(r.toUpperCase()) && !own.has(r.toUpperCase()));
      if (ratio === 1) {
        rows.push({ key: "licenses", status: "ok", fr: `Permis/qualifications ${word.fr} (${req.join(", ")}) : OK${onlyCv.length ? ` (${onlyCv.join(", ")} lu dans son CV)` : ""}`, nl: `Rijbewijzen/kwalificaties ${word.nl} (${req.join(", ")}): OK${onlyCv.length ? ` (${onlyCv.join(", ")} in cv gelezen)` : ""}` });
        good.push({ fr: `a les permis/qualifications ${word.fr} (${req.join(", ")})${onlyCv.length ? ` — ${onlyCv.join(", ")} lu dans son CV` : ""}`, nl: `heeft de ${word.nl} rijbewijzen/kwalificaties (${req.join(", ")})` });
      } else {
        const miss = req.filter((r) => !have.has(r.toUpperCase()));
        rows.push({ key: "licenses", status: ratio === 0 ? "no" : "partial", fr: `Permis/qualifications ${word.fr} : manquant(s) ${miss.join(", ")}`, nl: `Rijbewijzen/kwalificaties ${word.nl}: ontbreekt ${miss.join(", ")}` });
        check.push({ fr: `permis/qualifications manquants : ${miss.join(", ")}`, nl: `ontbrekende rijbewijzen/kwalificaties: ${miss.join(", ")}` });
        if (ratio === 0 && hard.length) missingRequired = true;
      }
    }
  } else rows.push({ key: "licenses", status: "unknown", fr: "L'annonce ne précise aucun permis ni qualification", nl: "De vacature vermeldt geen rijbewijs of kwalificatie" });

  // 2. Questions de présélection (les questions « de base » comptent peu)
  const qs = questionsFor(offer.screening_ids);
  const ans = app.screening_answers ?? null;
  if (qs.length) {
    const answered = ans ? qs.filter((q) => typeof ans[q.id] === "boolean") : [];
    if (answered.length) {
      const wq = (id: string) => (GENERIC_Q.has(id) ? 0.3 : 1);
      const tot = answered.reduce((s, q) => s + wq(q.id), 0);
      const yes = answered.reduce((s, q) => s + (ans![q.id] ? wq(q.id) : 0), 0);
      const hasSpecific = answered.some((q) => !GENERIC_Q.has(q.id));
      const w = hasSpecific ? 25 : 8; applicable += w;
      ev.push({ w, ratio: yes / tot, strong: hasSpecific });
      const no = answered.filter((q) => !ans![q.id]);
      if (!no.length) {
        rows.push({ key: "screening", status: "ok", fr: `Présélection : « oui » aux ${answered.length} questions${hasSpecific ? "" : " (questions de base, peu discriminantes)"}`, nl: `Voorselectie: “ja” op alle ${answered.length} vragen${hasSpecific ? "" : " (basisvragen)"}` });
        good.push({ fr: `répond « oui » aux ${answered.length} questions de présélection`, nl: `antwoordt “ja” op alle ${answered.length} voorselectievragen` });
      } else {
        rows.push({ key: "screening", status: "no", fr: `Présélection : « non » à ${no.map((q) => q.fr.replace(/\s*\?$/, "")).join(" ; ")}`, nl: `Voorselectie: “nee” op ${no.map((q) => q.nl.replace(/\s*\?$/, "")).join("; ")}` });
        check.push({ fr: `répond « non » à : ${no.map((q) => q.fr.replace(/\s*\?$/, "")).join(" ; ")}`, nl: `antwoordt “nee” op: ${no.map((q) => q.nl.replace(/\s*\?$/, "")).join("; ")}` });
        if (no.some((q) => NO_GO.includes(q.id))) noGo = true;
      }
    } else rows.push({ key: "screening", status: "unknown", fr: "Questions de présélection posées mais sans réponse", nl: "Voorselectievragen gesteld maar niet beantwoord" });
  } else rows.push({ key: "screening", status: "unknown", fr: "Cette offre n'a pas de questions de présélection", nl: "Deze vacature heeft geen voorselectievragen" });

  // 3. Disponibilités vs jours/créneaux demandés
  const days = (offer.days_needed ?? []).filter(Boolean), slots = (offer.time_slots ?? []).filter(Boolean);
  const av = app.availability_slots ?? [];
  if (days.length || slots.length) {
    if (av.length) {
      applicable += 20;
      const wanted = days.length && slots.length ? days.flatMap((d) => slots.map((s) => `${d}:${s}`)) : null;
      let ratio: number;
      if (wanted) ratio = wanted.filter((w) => av.includes(w)).length / wanted.length;
      else if (days.length) ratio = days.filter((d) => av.some((a) => a.startsWith(`${d}:`))).length / days.length;
      else ratio = slots.filter((s) => av.some((a) => a.endsWith(`:${s}`))).length / slots.length;
      ev.push({ w: 20, ratio, strong: true });
      if (ratio >= 0.99) { rows.push({ key: "availability", status: "ok", fr: "Disponible sur tous les jours/créneaux demandés", nl: "Beschikbaar op alle gevraagde dagen/momenten" }); good.push({ fr: "disponible sur tous les jours/créneaux demandés", nl: "beschikbaar op alle gevraagde dagen/momenten" }); }
      else { rows.push({ key: "availability", status: ratio >= 0.5 ? "partial" : "no", fr: ratio >= 0.5 ? "Disponible sur une partie des jours/créneaux demandés" : "Peu de disponibilités en commun avec les horaires demandés", nl: ratio >= 0.5 ? "Beschikbaar op een deel van de gevraagde dagen/momenten" : "Weinig overlap met de gevraagde uren" }); check.push({ fr: ratio >= 0.5 ? "disponible sur une partie des jours/créneaux demandés" : "peu de disponibilités en commun avec les horaires demandés", nl: ratio >= 0.5 ? "beschikbaar op een deel van de gevraagde dagen/momenten" : "weinig overlap met de gevraagde uren" }); }
    } else rows.push({ key: "availability", status: "unknown", fr: "Le candidat n'a pas indiqué ses disponibilités", nl: "De kandidaat gaf geen beschikbaarheid op" });
  } else rows.push({ key: "availability", status: "unknown", fr: "L'annonce ne fixe pas de jours/horaires précis", nl: "De vacature legt geen vaste dagen/uren vast" });

  // 4. Proximité
  const a = profile.city ? findCity(profile.city) : null, b = offer.city ? findCity(offer.city) : null;
  if (a && b) {
    applicable += 15;
    const km = Math.round(distanceKm(a, b));
    const ratio = km <= 15 ? 1 : km <= 30 ? 0.7 : km <= 50 ? 0.4 : 0.1;
    ev.push({ w: 15, ratio, strong: false });
    rows.push({ key: "distance", status: km <= 15 ? "ok" : km <= 30 ? "partial" : "no", fr: `Habite ${km <= 15 ? "à proximité" : "à distance"} : ${profile.city}, ~${km} km du lieu de travail`, nl: `Woont ${km <= 15 ? "dichtbij" : "op afstand"}: ${profile.city}, ~${km} km van de werkplek` });
    if (km <= 15) good.push({ fr: `habite à proximité (${profile.city}, ~${km} km)`, nl: `woont dichtbij (${profile.city}, ~${km} km)` });
    else check.push({ fr: `habite à environ ${km} km (${profile.city})`, nl: `woont op ongeveer ${km} km (${profile.city})` });
  } else rows.push({ key: "distance", status: "unknown", fr: "Ville du candidat inconnue : distance non évaluée", nl: "Stad van de kandidaat onbekend: afstand niet beoordeeld" });

  // 5. Parcours / métier : CV lu, CV Wolko, ou profil rempli par le candidat lui-même
  const t = words(offer.title);
  const roleHit = (profile.experienceRoles ?? []).some((r) => words(r).some((w) => t.includes(w)));
  const cvTitle = (profile.cv?.titleHits.length ?? 0) > 0;
  const cvSector = (profile.cv?.sectorHits.length ?? 0) > 0;
  const tradeHit = (profile.trades ?? []).some((k) => t.some((w) => normalizePlace(k.replace(/_/g, " ")).includes(w)));
  const sectorHit = !!offer.sector && (profile.sectors ?? []).includes(offer.sector);
  const haveCareer = !!profile.cv || (profile.experienceRoles ?? []).length > 0;
  if (haveCareer || (profile.trades ?? []).length || (profile.sectors ?? []).length) {
    applicable += 15;
    fitRatio = roleHit || cvTitle ? 1 : tradeHit ? 0.9 : cvSector ? 0.55 : sectorHit ? 0.6 : haveCareer ? 0.15 : 0.2;
    ev.push({ w: 15, ratio: fitRatio, strong: true });
    if (cvTitle) { const s = `« ${profile.cv!.titleHits.slice(0, 2).join(", ")} »`; rows.push({ key: "fit", status: "ok", fr: `Son CV mentionne ${s} (intitulé du poste)`, nl: `Zijn cv vermeldt ${s} (functietitel)` }); good.push({ fr: `son CV mentionne ${s}`, nl: `zijn cv vermeldt ${s}` }); }
    else if (roleHit) { rows.push({ key: "fit", status: "ok", fr: "Son CV Wolko contient un poste proche de l'offre", nl: "Zijn Wolko-cv bevat een gelijkaardige functie" }); good.push({ fr: "son CV mentionne un poste proche", nl: "zijn cv vermeldt een gelijkaardige functie" }); }
    else if (tradeHit) { rows.push({ key: "fit", status: "ok", fr: "Il a indiqué rechercher précisément ce métier", nl: "Hij gaf aan precies dit beroep te zoeken" }); good.push({ fr: "recherche précisément ce métier", nl: "zoekt precies dit beroep" }); }
    else if (cvSector) { rows.push({ key: "fit", status: "partial", fr: `Son CV évoque le domaine (${profile.cv!.sectorHits.slice(0, 3).join(", ")}) mais pas le même poste`, nl: `Zijn cv raakt het domein (${profile.cv!.sectorHits.slice(0, 3).join(", ")}) maar niet dezelfde functie` }); check.push({ fr: "expérience dans le même domaine mais pas dans le même poste", nl: "ervaring in hetzelfde domein maar niet in dezelfde functie" }); }
    else if (sectorHit) { rows.push({ key: "fit", status: "partial", fr: "Il a indiqué chercher dans ce secteur", nl: "Hij gaf aan in deze sector te zoeken" }); good.push({ fr: "cherche dans ce secteur", nl: "zoekt in deze sector" }); }
    else { rows.push({ key: "fit", status: "no", fr: haveCareer ? "Son parcours ne mentionne ni ce poste ni ce domaine" : "Métier/secteur recherché différent de l'offre", nl: haveCareer ? "Zijn parcours vermeldt noch deze functie noch dit domein" : "Gezocht beroep/sector wijkt af van de vacature" }); check.push({ fr: haveCareer ? "parcours sans lien visible avec ce poste" : "métier/secteur recherché différent de l'offre", nl: haveCareer ? "parcours zonder zichtbare link met deze functie" : "gezocht beroep/sector wijkt af" }); }
  } else rows.push({ key: "fit", status: "unknown", fr: "Expérience non vérifiable : pas de CV lisible (photo, scan ou pas encore reçu)", nl: "Ervaring niet te controleren: geen leesbaar cv (foto, scan of nog niet ontvangen)" });
  if (profile.cv?.years) good.push({ fr: `annonce ${profile.cv.years} an${profile.cv.years > 1 ? "s" : ""} d'expérience dans son CV`, nl: `vermeldt ${profile.cv.years} jaar ervaring in zijn cv` });

  const total = ev.reduce((s, c) => s + c.w, 0);
  const strongW = ev.filter((c) => c.strong).reduce((s, c) => s + c.w, 0);
  if (total < 30 || strongW < 8) return { grade: null, percent: null, good, check, rows, capped: null };
  let percent = Math.round((ev.reduce((s, c) => s + c.w * c.ratio, 0) / total) * 100);
  let capped: MatchResult["capped"] = null;
  const cap = (max: number, fr: string, nl: string) => { if (percent > max) { percent = max; capped = { fr, nl }; } };
  if (missingRequired) cap(49, "plafonné : aucun des permis demandés", "beperkt: geen van de gevraagde rijbewijzen");
  if (noGo) cap(20, "plafonné : pas le droit de travailler en Belgique", "beperkt: mag niet werken in België");
  if (strongW < 20) cap(64, "plafonné à C : trop peu d'éléments solides pour confirmer", "beperkt tot C: te weinig stevige elementen");
  if (applicable > 0 && total / applicable < 0.6) cap(79, "plafonné à B : plusieurs critères n'ont pas pu être vérifiés", "beperkt tot B: meerdere criteria niet te controleren");
  if (fitRatio !== null && fitRatio < 0.9) cap(79, "plafonné à B : le parcours ne correspond pas exactement au poste", "beperkt tot B: parcours komt niet exact overeen");
  if (fitRatio !== null && fitRatio < 0.5) cap(64, "plafonné à C : parcours sans lien clair avec le poste", "beperkt tot C: parcours zonder duidelijke link");
  const grade: Grade = percent >= 80 ? "A" : percent >= 65 ? "B" : percent >= 50 ? "C" : percent >= 35 ? "D" : "E";
  return { grade, percent, good, check, rows, capped };
}

/** Phrase de synthèse (FR/NL). */
export function summarize(m: MatchResult, lang: "fr" | "nl", name?: string): string {
  const pick = (x: { fr: string; nl: string }) => (lang === "nl" ? x.nl : x.fr);
  if (!m.grade) return lang === "nl" ? "Te weinig controleerbare informatie om een score te geven." : "Pas assez d'informations vérifiables pour attribuer une note.";
  const who = name?.trim() || (lang === "nl" ? "De kandidaat" : "Le candidat");
  const parts: string[] = [];
  if (m.good.length) parts.push(`${who} ${m.good.map(pick).join("; ")}.`);
  if (m.check.length) parts.push(`${lang === "nl" ? "Te controleren" : "À vérifier"} : ${m.check.map(pick).join("; ")}.`);
  return parts.join(" ");
}

export const GRADE_LABEL: Record<Grade, { fr: string; nl: string }> = {
  A: { fr: "Très bon profil", nl: "Zeer goed profiel" }, B: { fr: "Bon profil", nl: "Goed profiel" },
  C: { fr: "Correct", nl: "Redelijk" }, D: { fr: "Partiel", nl: "Gedeeltelijk" }, E: { fr: "Peu adapté", nl: "Weinig geschikt" },
};
