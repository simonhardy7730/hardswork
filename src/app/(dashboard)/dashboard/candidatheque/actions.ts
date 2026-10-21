"use server";

import { createClient } from "@/lib/supabase/server";
import { poolEnabled } from "@/lib/candidate/pool";

export type RevealResult =
  | { ok: true; name: string; email: string | null; phone: string | null }
  | { ok: false; error: "closed" | "no_access" | "quota" | "not_found" | "error" };

export async function revealContact(candidateId: string): Promise<RevealResult> {
  if (!poolEnabled()) return { ok: false, error: "closed" };
  if (typeof candidateId !== "string" || !/^[0-9a-f-]{36}$/i.test(candidateId)) return { ok: false, error: "not_found" };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "error" };
  const { data, error } = await supabase.rpc("reveal_candidate_contact", { p_candidate_id: candidateId });
  if (error) {
    const m = error.message ?? "";
    return { ok: false, error: /no_access/.test(m) ? "no_access" : /quota/.test(m) ? "quota" : /not_found/.test(m) ? "not_found" : "error" };
  }
  const row = (data as { first_name: string; last_name: string; email: string | null; phone: string | null }[] | null)?.[0];
  if (!row) return { ok: false, error: "not_found" };
  return { ok: true, name: `${row.first_name} ${row.last_name}`, email: row.email, phone: row.phone };
}

export type CvOpenResult = { ok: true; url: string } | { ok: false; error: "closed" | "no_access" | "quota" | "not_found" | "no_cv" | "error" };

/** Ouvre le CV d'un profil : même contrôle et même journal que « Voir les coordonnées ». */
export async function openPoolCv(candidateId: string): Promise<CvOpenResult> {
  const r = await revealContact(candidateId);
  if (!r.ok) return { ok: false, error: r.error };
  const { findPoolCvs, signedCvUrl } = await import("@/lib/candidate/pool-cv");
  const cv = (await findPoolCvs([candidateId])).get(candidateId);
  if (!cv) return { ok: false, error: "no_cv" };
  if (cv.kind === "built") return { ok: true, url: `/dashboard/candidatheque/cv/${candidateId}` };
  const url = await signedCvUrl(cv.path);
  return url ? { ok: true, url } : { ok: false, error: "error" };
}
