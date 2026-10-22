import { createClient as createAdmin } from "@supabase/supabase-js";
import { asCv } from "@/lib/candidate/cv";
import { scoreApplication, softRequirements, titleWords, type MatchOffer, type MatchResult } from "./score";
import { analyzeCv, cvTextFor } from "./cvtext";
import { isMiniPath } from "@/lib/candidate/mini-cv";

type AppRow = { id: string; job_offer_id: string; candidate_id: string | null; licenses?: string[] | null; has_caces?: boolean | null; caces_types?: string[] | null; availability_slots?: string[] | null; screening_answers?: Record<string, boolean> | null };

/**
 * Calcule la note de chaque candidature (côté serveur, uniquement pour l'organisation qui y a accès).
 * Le profil du candidat est lu avec la clé serveur pour calculer la note ; seule la note + les raisons sont renvoyées
 * (aucune coordonnée, aucun CV). Tout échec = pas de note, jamais d'erreur visible.
 */
export async function matchesFor(apps: AppRow[], offers: Map<string, MatchOffer>): Promise<Map<string, MatchResult>> {
  const out = new Map<string, MatchResult>();
  try {
    const ids = Array.from(new Set(apps.map((a) => a.candidate_id).filter((x): x is string => !!x)));
    const profiles = new Map<string, { city: string | null; sectors: string[]; trades: string[]; roles: string[] }>();
    if (ids.length && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const db = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
      const { data } = await db.from("candidates").select("id, auth_user_id, city, sectors, trades, cv_data").in("id", ids);
      for (const c of (data ?? []) as { id: string; auth_user_id: string | null; city: string | null; sectors: string[] | null; trades: string[] | null; cv_data: unknown }[]) {
        // Secteurs/métiers : fiables seulement si le candidat a un compte (il les choisit lui-même). Pour un profil créé en postulant, ils sont déduits de l'offre elle-même : on les ignore.
        const own = !!c.auth_user_id;
        profiles.set(c.id, { city: c.city, sectors: own ? c.sectors ?? [] : [], trades: own ? c.trades ?? [] : [], roles: asCv(c.cv_data).experiences.map((e) => e.role) });
      }
    }
    // CV joint À CETTE candidature (envoyé à la demande de l'entreprise) : seul celui-là est lu, jamais les documents privés du compte.
    const cvPath = new Map<string, string>();
    if (apps.length && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const db = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
      const { data } = await db.from("cv_requests").select("application_id, cv_path").in("application_id", apps.map((a) => a.id)).eq("status", "fulfilled").not("cv_path", "is", null);
      for (const r of (data ?? []) as { application_id: string; cv_path: string }[]) if (!isMiniPath(r.cv_path)) cvPath.set(r.application_id, r.cv_path);
    }
    const budget = { left: 4 }; // nouveaux fichiers lus par affichage (le reste suit au prochain chargement)
    for (const a of apps) {
      const offer = offers.get(a.job_offer_id);
      if (!offer) continue;
      const p = a.candidate_id ? profiles.get(a.candidate_id) : undefined;
      const path = cvPath.get(a.id);
      const text = path ? await cvTextFor(path, budget) : null;
      const cv = text ? analyzeCv(text, (offer.required_licenses?.length ? offer.required_licenses : softRequirements(offer)) ?? [], titleWords(offer.title), offer.sector) : null;
      out.set(a.id, scoreApplication(a, offer, { ...(p ? { city: p.city, sectors: p.sectors, trades: p.trades, experienceRoles: p.roles } : {}), cv }));
    }
  } catch (e) { console.error("matchesFor:", (e as Error).message); }
  return out;
}
