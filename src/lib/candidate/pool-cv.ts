import { createClient as createAdmin } from "@supabase/supabase-js";
import { asCv, type CvData } from "@/lib/candidate/cv";
import { isMiniPath, type MiniDoc } from "@/lib/candidate/mini-cv";

export type PoolCv = { kind: "file"; path: string; name: string } | { kind: "built" };

const admin = () => createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

/** Un CV créé sur Wolko compte s'il a au moins un titre, un résumé ou une expérience. */
export function cvFilled(cv: CvData | null | undefined): boolean {
  if (!cv) return false;
  return Boolean(cv.headline?.trim() || cv.summary?.trim() || cv.experiences?.length);
}

/**
 * CV des candidats visibles (déjà filtrés par la recherche) :
 * 1) CV déposé dans son compte (document « CV »),
 * 2) CV joint à une de ses candidatures,
 * 3) CV créé avec le créateur Wolko.
 */
export async function findPoolCvs(ids: string[]): Promise<Map<string, PoolCv>> {
  const out = new Map<string, PoolCv>();
  if (!ids.length) return out;
  const db = admin();
  const { data: cands } = await db.from("candidates").select("id, auth_user_id, email, cv_data").in("id", ids);
  const list = (cands ?? []) as { id: string; auth_user_id: string | null; email: string | null; cv_data: unknown }[];

  const byAuth = new Map(list.filter((c) => c.auth_user_id).map((c) => [c.auth_user_id as string, c.id]));
  if (byAuth.size) {
    const { data: docs } = await db.from("candidate_documents")
      .select("auth_user_id, file_path, file_name, label, created_at")
      .in("auth_user_id", [...byAuth.keys()]).ilike("label", "cv%")
      .order("created_at", { ascending: false });
    for (const d of (docs ?? []) as { auth_user_id: string; file_path: string; file_name: string }[]) {
      const cid = byAuth.get(d.auth_user_id);
      if (cid && !out.has(cid)) out.set(cid, { kind: "file", path: d.file_path, name: d.file_name });
    }
  }

  const minis = new Map<string, PoolCv>();
  const missing = list.filter((c) => !out.has(c.id));
  if (missing.length) {
    const emails = new Map(missing.filter((c) => c.email).map((c) => [c.email!.toLowerCase(), c.id]));
    const [byId, byMail] = await Promise.all([
      db.from("applications").select("id, candidate_id, applicant_email").in("candidate_id", missing.map((c) => c.id)),
      emails.size ? db.from("applications").select("id, candidate_id, applicant_email").in("applicant_email", [...emails.keys()]) : Promise.resolve({ data: [] }),
    ]);
    const appTo = new Map<string, string>();
    for (const a of [...(byId.data ?? []), ...(byMail.data ?? [])] as { id: string; candidate_id: string | null; applicant_email: string | null }[]) {
      const cid = (a.candidate_id && missing.some((m) => m.id === a.candidate_id)) ? a.candidate_id : emails.get((a.applicant_email ?? "").toLowerCase());
      if (cid) appTo.set(a.id, cid);
    }
    if (appTo.size) {
      const { data: reqs } = await db.from("cv_requests").select("application_id, cv_path, cv_name, fulfilled_at")
        .in("application_id", [...appTo.keys()]).eq("status", "fulfilled").not("cv_path", "is", null)
        .order("fulfilled_at", { ascending: false });
      for (const r of (reqs ?? []) as { application_id: string; cv_path: string; cv_name: string | null }[]) {
        const cid = appTo.get(r.application_id);
        if (!cid) continue;
        // Un vrai CV passe avant un mini-CV ; le mini-CV n'est gardé qu'en dernier recours.
        if (isMiniPath(r.cv_path)) { if (!minis.has(cid)) minis.set(cid, { kind: "file", path: r.cv_path, name: r.cv_name ?? "CV" }); continue; }
        if (!out.has(cid)) out.set(cid, { kind: "file", path: r.cv_path, name: r.cv_name ?? "CV" });
      }
    }
  }

  for (const c of list) if (!out.has(c.id) && cvFilled(asCv(c.cv_data))) out.set(c.id, { kind: "built" });
  for (const [cid, m] of minis) if (!out.has(cid)) out.set(cid, m);
  return out;
}

export async function signedCvUrl(path: string): Promise<string | null> {
  const { data } = await admin().storage.from("candidate-documents").createSignedUrl(path, 120);
  return data?.signedUrl ?? null;
}

/** Lit un mini-CV (JSON) stocké à côté d'une candidature. */
export async function loadMiniDoc(path: string): Promise<MiniDoc | null> {
  if (!isMiniPath(path)) return null;
  const { data } = await admin().storage.from("candidate-documents").download(path);
  if (!data) return null;
  try {
    const d = JSON.parse(await data.text()) as MiniDoc;
    return d && d.v === 1 && d.base && d.cv ? { v: 1, base: d.base, cv: asCv(d.cv) } : null;
  } catch { return null; }
}
