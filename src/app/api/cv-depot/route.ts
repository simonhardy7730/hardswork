import { NextResponse } from "next/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { readCvToken } from "@/lib/candidate/cv-link";
import { checkCvFile } from "@/lib/candidate/cv-file";
import { isMiniPath } from "@/lib/candidate/mini-cv";

const MAX = 4.4 * 1024 * 1024; // limite de requête Vercel ≈ 4,5 Mo
const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? v[0] ?? null : v ?? null);

/**
 * Dépôt du CV via le lien personnel (sans compte). Le CV est joint à la candidature du lien
 * et à ses autres candidatures sans CV (même e-mail) : l'employeur le voit, et la candidathèque aussi si le candidat y est.
 */
export async function POST(req: Request) {
  try {
    const fd = await req.formData();
    const appId = readCvToken(String(fd.get("token") ?? ""));
    const file = fd.get("cv");
    if (!appId) return NextResponse.json({ error: "link" }, { status: 400 });
    if (!(file instanceof File)) return NextResponse.json({ error: "file" }, { status: 400 });
    const type = await checkCvFile(file, MAX);
    if (!type) return NextResponse.json({ error: "file" }, { status: 400 });

    const db = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: app } = await db.from("applications").select("id, applicant_email").eq("id", appId).maybeSingle();
    if (!app) return NextResponse.json({ error: "link" }, { status: 404 });

    // Anti-abus : 5 dépôts max par lien.
    const { data: existing } = await db.storage.from("candidate-documents").list(`applications/${appId}`, { limit: 10 });
    if ((existing?.length ?? 0) >= 5) return NextResponse.json({ error: "limit" }, { status: 429 });

    const safe = file.name.replace(/[^\w.\-]+/g, "_").slice(-80) || "cv";
    const path = `applications/${appId}/${Date.now()}_${safe}`;
    const up = await db.storage.from("candidate-documents").upload(path, file, { contentType: type });
    if (up.error) { console.error("cv-depot upload:", up.error.message); return NextResponse.json({ error: "server" }, { status: 500 }); }

    const email = (app.applicant_email as string | null)?.toLowerCase() ?? null;
    let ids = [appId];
    if (email) {
      const { data: same } = await db.from("applications").select("id").ilike("applicant_email", email).limit(50);
      ids = [...new Set([appId, ...(same ?? []).map((a) => a.id as string)])];
    }
    const [{ data: apps }, { data: reqs }] = await Promise.all([
      db.from("applications").select("id, job_offers(title, organization_id, organizations(name))").in("id", ids),
      db.from("cv_requests").select("application_id, status, cv_path").in("application_id", ids),
    ]);
    const reqBy = new Map((reqs ?? []).map((r) => [r.application_id as string, r.status as string]));
    const miniBy = new Set((reqs ?? []).filter((r) => isMiniPath(r.cv_path as string | null)).map((r) => r.application_id as string));
    const now = new Date().toISOString();
    const fields = { status: "fulfilled", cv_path: path, cv_name: file.name.slice(0, 150), fulfilled_at: now };
    let attached = 0;
    for (const a of apps ?? []) {
      const id = a.id as string;
      const st = reqBy.get(id);
      if (st === "fulfilled" && id !== appId && !miniBy.has(id)) continue; // ne remplace pas un vrai CV déjà envoyé à un autre employeur (un mini-CV, si)
      const j = one(a.job_offers as unknown as { title: string; organization_id: string; organizations: unknown } | null);
      if (!j) continue;
      const org = one(j.organizations as { name?: string } | { name?: string }[] | null);
      const r = st
        ? await db.from("cv_requests").update(fields).eq("application_id", id)
        : await db.from("cv_requests").insert({ application_id: id, organization_id: j.organization_id, candidate_email: email ?? "", org_name: org?.name ?? "", job_title: j.title, ...fields });
      if (!r.error) attached++; else console.error("cv-depot row:", r.error.message);
    }
    if (!attached) { await db.storage.from("candidate-documents").remove([path]); return NextResponse.json({ error: "server" }, { status: 500 }); }
    return NextResponse.json({ ok: true, attached });
  } catch (e) {
    console.error("cv-depot:", e);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
