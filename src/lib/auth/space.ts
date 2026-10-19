import { createClient } from "@/lib/supabase/server";

export type Space = "candidate" | "company" | "agency" | "onboarding" | "anonymous";

export const SPACE_HOME: Record<Space, string> = {
  candidate: "/candidat/dashboard",
  company: "/dashboard",
  // TODO : /agence n'existe pas encore → l'agence utilise provisoirement le dashboard recruteur.
  agency: "/dashboard",
  onboarding: "/onboarding",
  anonymous: "/login",
};

/**
 * Détermine l'espace autorisé d'un utilisateur À PARTIR DE LA BASE (jamais d'un paramètre d'URL).
 * - ligne `users` + organisation → entreprise ou agence (organizations.type)
 * - sinon, compte créé via le parcours candidat → candidat
 * - sinon → onboarding
 */
export async function getSpace(): Promise<Space> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "anonymous";

  const { data: profile } = await supabase
    .from("users")
    .select("organization_id, organizations(type)")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) {
    const org = profile.organizations as unknown as { type?: string } | null;
    return org?.type === "agency" ? "agency" : "company";
  }
  // Pas de ligne recruteur : l'indice de métadonnées ne sert qu'à distinguer un candidat d'un compte incomplet.
  if (user.user_metadata?.user_type === "candidate") return "candidate";
  return "onboarding";
}
