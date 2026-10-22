"use server";

import { createClient as createAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getOrgAccess } from "@/lib/billing/access";
import { flashUnlockedOfferIds } from "@/lib/flash/access";
import { sendCvRequestEmail } from "@/lib/email/cv-request";
import { sendApplicationStatusEmail } from "@/lib/email/application-status";
import { isMiniPath, type MiniDoc } from "@/lib/candidate/mini-cv";
import { loadMiniDoc } from "@/lib/candidate/pool-cv";

export type CvState =
  | { kind: "none" }
  | { kind: "pending"; requestedAt: string }
  | { kind: "fulfilled"; fileName: string | null }
  | { kind: "unavailable" }; // migration 019 pas encore lancée

const admin = () =>
  createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const UUID = /^[0-9a-f-]{36}$/i;

/** Vérifie (côté serveur) que la candidature appartient à l'organisation de l'utilisateur connecté et qu'elle a accès aux contacts. */
async function authorize(applicationId: string) {
  if (typeof applicationId !== "string" || !UUID.test(applicationId)) return null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("users").select("organization_id").eq("id", user.id).single();
  if (!profile) return null;
  const { hasAccess } = await getOrgAccess(supabase, profile.organization_id);
  // RLS : ne renvoie la candidature que si l'offre est à l'organisation.
  const { data: app } = await supabase
    .from("applications")
    .select("id, job_offer_id, applicant_name, applicant_email, job_offers(title, organization_id, organizations(name))")
    .eq("id", applicationId)
    .single();
  if (!app) return null;
  const job = Array.isArray(app.job_offers) ? app.job_offers[0] : app.job_offers;
  if (!job || job.organization_id !== profile.organization_id) return null;
  // Droit d'accès : abonnement/essai, OU crédit Flash sur l'annonce de cette candidature (jamais sur les autres).
  if (!hasAccess && !(await flashUnlockedOfferIds(supabase, profile.organization_id)).has(app.job_offer_id as string)) return null;
  const orgRaw = job.organizations as unknown as { name?: string } | { name?: string }[] | null;
  const org = Array.isArray(orgRaw) ? orgRaw[0] : orgRaw;
  return {
    orgId: profile.organization_id as string,
    orgName: org?.name ?? "Wolko",
    jobTitle: job.title as string,
    name: app.applicant_name as string,
    email: (app.applicant_email as string | null) ?? null,
  };
}

export async function getCvState(applicationId: string): Promise<CvState> {
  const ctx = await authorize(applicationId);
  if (!ctx) return { kind: "none" };
  const { data, error } = await admin()
    .from("cv_requests")
    .select("status, created_at, cv_name")
    .eq("application_id", applicationId)
    .maybeSingle();
  if (error) return { kind: "unavailable" };
  if (!data) return { kind: "none" };
  if (data.status === "fulfilled") return { kind: "fulfilled", fileName: data.cv_name ?? null };
  return { kind: "pending", requestedAt: data.created_at };
}

export type RequestCvResult = { ok: true; emailed: boolean } | { ok: false; error: "no_email" | "forbidden" | "error" };

export async function requestCv(applicationId: string): Promise<RequestCvResult> {
  const ctx = await authorize(applicationId);
  if (!ctx) return { ok: false, error: "forbidden" };
  if (!ctx.email) return { ok: false, error: "no_email" };
  const db = admin();
  const { data: existing } = await db.from("cv_requests").select("id").eq("application_id", applicationId).maybeSingle();
  if (existing) return { ok: true, emailed: false }; // déjà demandé : pas de second mail
  const { error } = await db.from("cv_requests").insert({
    application_id: applicationId,
    organization_id: ctx.orgId,
    candidate_email: ctx.email.toLowerCase(),
    org_name: ctx.orgName,
    job_title: ctx.jobTitle,
  });
  if (error) {
    console.error("cv_requests insert:", error.message);
    return { ok: false, error: "error" };
  }
  const emailed = await sendCvRequestEmail({
    to: ctx.email, candidateName: ctx.name, orgName: ctx.orgName, jobTitle: ctx.jobTitle,
  });
  return { ok: true, emailed };
}

/** Lien de 60 secondes vers le CV déposé par le candidat. */
export async function getCvUrl(applicationId: string): Promise<string | null> {
  const ctx = await authorize(applicationId);
  if (!ctx) return null;
  const db = admin();
  const { data } = await db
    .from("cv_requests")
    .select("cv_path, status")
    .eq("application_id", applicationId)
    .eq("organization_id", ctx.orgId)
    .maybeSingle();
  if (!data || data.status !== "fulfilled" || !data.cv_path) return null;
  if (isMiniPath(data.cv_path)) return `/dashboard/candidatures/cv/${applicationId}`;
  const { data: signed } = await db.storage.from("candidate-documents").createSignedUrl(data.cv_path, 60);
  return signed?.signedUrl ?? null;
}

/** Supprime définitivement une candidature REFUSÉE de son organisation. */
export async function deleteRefusedApplication(applicationId: string): Promise<{ ok: boolean }> {
  if (typeof applicationId !== "string" || !UUID.test(applicationId)) return { ok: false };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  const { data: profile } = await supabase.from("users").select("organization_id, role").eq("id", user.id).single();
  if (!profile || profile.role === "viewer") return { ok: false };
  // RLS : renvoie la candidature seulement si l'offre est à l'organisation
  const { data: app } = await supabase
    .from("applications").select("id, status, job_offers(organization_id)").eq("id", applicationId).single();
  const job = app && (Array.isArray(app.job_offers) ? app.job_offers[0] : app.job_offers);
  if (!app || app.status !== "refuse" || job?.organization_id !== profile.organization_id) return { ok: false };
  const { error } = await admin().from("applications").delete().eq("id", applicationId);
  return { ok: !error };
}

/** Choisit au bout de combien de jours les candidatures refusées sont supprimées (0 = jamais). */
export async function setRefusedRetention(days: number): Promise<{ ok: boolean }> {
  if (![1, 3, 7, 14, 30, 90, 0].includes(days)) return { ok: false };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  const { data: profile } = await supabase.from("users").select("organization_id, role").eq("id", user.id).single();
  if (!profile || profile.role === "viewer") return { ok: false };
  const { error } = await admin().from("organizations").update({ refused_retention_days: days }).eq("id", profile.organization_id);
  return { ok: !error };
}

const STATUSES = ["nouveau", "contacte", "entretien", "place", "refuse"] as const;

/** Change le statut d'une candidature (droits via RLS) et prévient le candidat par e-mail, une seule fois par statut. */
export async function updateApplicationStatus(applicationId: string, status: string): Promise<{ ok: boolean }> {
  if (typeof applicationId !== "string" || !UUID.test(applicationId)) return { ok: false };
  if (!(STATUSES as readonly string[]).includes(status)) return { ok: false };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  // RLS : l'update n'aboutit que si la candidature appartient à l'organisation.
  const { data: upd, error } = await supabase.from("applications").update({ status }).eq("id", applicationId).select("id");
  if (error || !upd?.length) return { ok: false };
  if (status === "nouveau") return { ok: true };

  try {
    const db = admin();
    // Première réponse du recruteur (badge de délai de réponse, migration 026) : sans effet si la colonne manque.
    await db.from("applications").update({ first_response_at: new Date().toISOString() }).eq("id", applicationId).is("first_response_at", null);
    const { data: app, error: e2 } = await db
      .from("applications")
      .select("applicant_name, applicant_email, last_notified_status, job_offers(title, hide_company, organizations(name))")
      .eq("id", applicationId)
      .single();
    if (e2 || !app || !app.applicant_email) return { ok: true }; // colonne absente (migration 025) ou pas d'e-mail
    if (app.last_notified_status === status) return { ok: true };
    const job = Array.isArray(app.job_offers) ? app.job_offers[0] : app.job_offers;
    const orgRaw = (job?.organizations ?? null) as unknown as { name?: string } | { name?: string }[] | null;
    const org = Array.isArray(orgRaw) ? orgRaw[0] : orgRaw;
    const sent = await sendApplicationStatusEmail({
      to: app.applicant_email as string,
      candidateName: app.applicant_name as string,
      orgName: job?.hide_company ? "Le recruteur" : (org?.name ?? "Le recruteur"),
      jobTitle: (job?.title as string) ?? "votre candidature",
      status,
    });
    if (sent) await db.from("applications").update({ last_notified_status: status }).eq("id", applicationId);
  } catch (err) {
    console.error("updateApplicationStatus notify error:", err);
  }
  return { ok: true };
}

/** Mini-CV (créé en postulant) d'une candidature de son organisation. */
export async function getMiniCv(applicationId: string): Promise<MiniDoc | null> {
  const ctx = await authorize(applicationId);
  if (!ctx) return null;
  const { data } = await admin().from("cv_requests").select("cv_path, status").eq("application_id", applicationId).eq("organization_id", ctx.orgId).maybeSingle();
  if (!data || data.status !== "fulfilled" || !isMiniPath(data.cv_path)) return null;
  return loadMiniDoc(data.cv_path as string);
}


export type MatchVerdict = "juste" | "trop_haute" | "trop_basse";

/** Retour du recruteur sur la note A→E (sert à régler les règles). Réservé aux candidatures de son organisation. */
export async function sendMatchFeedback(applicationId: string, verdict: MatchVerdict, grade: string | null, percent: number | null): Promise<{ ok: boolean }> {
  if (!["juste", "trop_haute", "trop_basse"].includes(verdict)) return { ok: false };
  const ctx = await authorize(applicationId);
  if (!ctx) return { ok: false };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  const g = grade && ["A", "B", "C", "D", "E"].includes(grade) ? grade : null;
  const pct = typeof percent === "number" && percent >= 0 && percent <= 100 ? Math.round(percent) : null;
  const { error } = await admin().from("match_feedback").upsert(
    { application_id: applicationId, user_id: user.id, organization_id: ctx.orgId, verdict, grade: g, percent: pct },
    { onConflict: "application_id,user_id" });
  if (error) console.error("match_feedback (migration 038 ?):", error.message);
  return { ok: !error };
}
