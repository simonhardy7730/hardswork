import { adminClient } from "@/lib/billing/lifecycle";

/**
 * Délai médian (en jours) entre une candidature reçue et la première réponse du recruteur,
 * sur les 90 derniers jours. Renvoie null s'il y a moins de 3 réponses (pas de badge trompeur)
 * ou si la migration 026 n'est pas appliquée.
 */
export async function orgResponseDays(orgId: string): Promise<number | null> {
  try {
    const db = adminClient();
    const since = new Date(Date.now() - 90 * 86400000).toISOString();
    const { data: jobs } = await db.from("job_offers").select("id").eq("organization_id", orgId);
    const ids = (jobs ?? []).map((j) => j.id as string);
    if (ids.length === 0) return null;
    const { data, error } = await db
      .from("applications")
      .select("applied_at, first_response_at")
      .in("job_offer_id", ids)
      .not("first_response_at", "is", null)
      .gte("applied_at", since)
      .limit(500);
    if (error || !data || data.length < 3) return null;
    const days = data
      .map((a) => (new Date(a.first_response_at as string).getTime() - new Date(a.applied_at as string).getTime()) / 86400000)
      .filter((d) => d >= 0)
      .sort((a, b) => a - b);
    if (days.length < 3) return null;
    return days[Math.floor(days.length / 2)];
  } catch {
    return null;
  }
}

/** Libellé du badge : « Répond en général en moins de 24 h / 3 jours / 1 semaine ». */
export function responseBadge(days: number, l: (fr: string, nl: string) => string): string {
  if (days <= 1) return l("Répond en général en moins de 24 h", "Antwoordt meestal binnen 24 u");
  if (days <= 3) return l("Répond en général en moins de 3 jours", "Antwoordt meestal binnen 3 dagen");
  if (days <= 7) return l("Répond en général en moins d'une semaine", "Antwoordt meestal binnen een week");
  return l("Répond en général en plus d'une semaine", "Antwoordt meestal na meer dan een week");
}
