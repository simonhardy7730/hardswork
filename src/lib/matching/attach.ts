import { MATCH_ENABLED } from "@/lib/matching/enabled";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { asCv } from "@/lib/candidate/cv";
import { scoreApplication, softRequirements, titleWords, offerKeywords, type MatchOffer, type MatchResult } from "./score";
import { analyzeCv, cvTextFor } from "./cvtext";
import { familiesIn } from "./families";

type AppRow = { id: string; account_user_id?: string | null; job_offer_id: string; candidate_id: string | null; licenses?: string[] | null; has_caces?: boolean | null; caces_types?: string[] | null; availability_slots?: string[] | null; screening_answers?: Record<string, boolean> | null };

/**
 * Calcule la note de chaque candidature (côté serveur, uniquement pour l'organisation qui y a accès).
 * Le profil du candidat est lu avec la clé serveur pour calculer la note ; seule la note + les raisons sont renvoyées
 * (aucune coordonnée, aucun CV). Tout échec = pas de note, jamais d'erreur visible.
 */
export async function matchesFor(apps: AppRow[], offers: Map<string, MatchOffer>): Promise<Map<string, MatchResult>> {
  const out = new Map<string, MatchResult>();
  if (!MATCH_ENABLED) return out;
  try {
    const ok = !!(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL);
    const db = ok ? createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } }) : null;

    // Profils liés aux candidatures
    const ids = Array.from(new Set(apps.map((a) => a.candidate_id).filter((x): x is string => !!x)));
    type Prof = { auth: string | null; city: string | null; sectors: string[]; trades: string[]; roles: string[] };
    const profiles = new Map<string, Prof>();
    if (db && ids.length) {
      const { data } = await db.from("candidates").select("id, auth_user_id, city, sectors, trades, cv_data").in("id", ids);
      for (const c of (data ?? []) as { id: string; auth_user_id: string | null; city: string | null; sectors: string[] | null; trades: string[] | null; cv_data: unknown }[]) {
        profiles.set(c.id, { auth: c.auth_user_id, city: c.city, sectors: c.sectors ?? [], trades: c.trades ?? [], roles: asCv(c.cv_data).experiences.map((e) => e.role) });
      }
    }

    // CV joint À CETTE candidature (envoyé à la demande de l'entreprise)
    const cvPath = new Map<string, string>();
    if (db && apps.length) {
      const { data } = await db.from("cv_requests").select("application_id, cv_path").in("application_id", apps.map((a) => a.id)).eq("status", "fulfilled").not("cv_path", "is", null);
      for (const r of (data ?? []) as { application_id: string; cv_path: string }[]) cvPath.set(r.application_id, r.cv_path); // CV déposé en postulant, mini-CV Wolko ou CV envoyé à la demande de l'entreprise
    }
    // CV déjà enregistré dans le compte du candidat : uniquement si la candidature a été envoyée CONNECTÉ à ce compte (lien vérifié par la session, migration 037).
    const accounts = Array.from(new Set(apps.map((a) => a.account_user_id).filter((x): x is string => !!x)));
    const accountCv = new Map<string, string>();
    if (db && accounts.length) {
      const { data } = await db.from("candidate_documents").select("auth_user_id, file_path, created_at").in("auth_user_id", accounts).ilike("label", "cv%").order("created_at", { ascending: false });
      for (const d of (data ?? []) as { auth_user_id: string; file_path: string }[]) if (!accountCv.has(d.auth_user_id)) accountCv.set(d.auth_user_id, d.file_path);
    }

    const budget = { left: 8 }; // nouveaux fichiers lus par affichage (le reste suit au chargement suivant ; les CV déposés en postulant sont déjà lus en arrière-plan)
    for (const a of apps) {
      const offer = offers.get(a.job_offer_id);
      if (!offer) continue;
      const p = a.candidate_id ? profiles.get(a.candidate_id) : undefined;
      // Profil avec compte : ses infos (ville, secteurs, métiers, CV Wolko) ne servent que si la candidature est bien liée à CE compte.
      const usable = p && (!p.auth || (a.account_user_id && a.account_user_id === p.auth)) ? p : undefined;
      const path = cvPath.get(a.id) ?? (a.account_user_id ? accountCv.get(a.account_user_id) : undefined);
      const read = path ? await cvTextFor(path, budget) : null;
      const text = read?.state === "ok" ? read.text : null;
      const cvStatus = !path ? "none" : read?.state === "ok" ? "ok" : read?.state === "empty" ? "unreadable" : "pending";
      const cv = text ? analyzeCv(text, (offer.required_licenses?.length ? offer.required_licenses : softRequirements(offer)) ?? [], titleWords(offer.title), offer.sector, new Date(), offerKeywords(offer), familiesIn(offer.title)) : null;
      // Secteurs/métiers : pour un profil créé en postulant (sans compte), ils sont déduits de l'offre elle-même : ignorés.
      const prof = usable ? { city: usable.city, sectors: usable.auth ? usable.sectors : [], trades: usable.auth ? usable.trades : [], experienceRoles: usable.roles } : {};
      out.set(a.id, scoreApplication(a, offer, { ...prof, cv, cvStatus }));
    }
  } catch (e) { console.error("matchesFor:", (e as Error).message); }
  return out;
}
