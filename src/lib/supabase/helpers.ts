/**
 * Helpers typés pour les opérations Supabase.
 * Fournit une couche de sécurité de type sur le client non-générique.
 */

import type {
  OrganizationInsert,
  UserInsert,
  JobOfferInsert,
  CandidateInsert,
  ApplicationInsert,
  SubscriptionInsert,
  Organization,
  User,
  JobOffer,
  Candidate,
  Application,
  Subscription,
} from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

export async function insertOrganization(
  supabase: AnySupabase,
  values: OrganizationInsert
): Promise<{ data: Organization | null; error: unknown }> {
  return supabase.from("organizations").insert(values).select().single();
}

export async function insertUser(
  supabase: AnySupabase,
  values: UserInsert
): Promise<{ data: User | null; error: unknown }> {
  return supabase.from("users").insert(values).select().single();
}

export async function insertJobOffer(
  supabase: AnySupabase,
  values: JobOfferInsert
): Promise<{ data: JobOffer | null; error: unknown }> {
  return supabase.from("job_offers").insert(values).select().single();
}

export async function insertCandidate(
  supabase: AnySupabase,
  values: CandidateInsert
): Promise<{ data: Candidate | null; error: unknown }> {
  return supabase.from("candidates").insert(values).select().single();
}

export async function insertApplication(
  supabase: AnySupabase,
  values: ApplicationInsert
): Promise<{ data: Application | null; error: unknown }> {
  return supabase.from("applications").insert(values).select().single();
}

export async function insertSubscription(
  supabase: AnySupabase,
  values: SubscriptionInsert
): Promise<{ data: Subscription | null; error: unknown }> {
  return supabase.from("subscriptions").insert(values).select().single();
}
