import type { SupabaseClient } from "@supabase/supabase-js";
import { resend, FROM_EMAIL, FROM_NAME } from "@/lib/resend";
import { layout } from "@/lib/email/subscription";
import { asCv } from "@/lib/candidate/cv";
import { cvFilled } from "@/lib/candidate/pool-cv";

/**
 * Un seul rappel, le lendemain de l'inscription, aux candidats qui n'ont pas encore de CV.
 * Le cron passe une fois par jour : la fenêtre [-48 h, -24 h[ touche chaque candidat une seule fois.
 */
export async function runCvReminders(db: SupabaseClient): Promise<{ sent: number; errors: number }> {
  const out = { sent: 0, errors: 0 };
  const from = new Date(Date.now() - 48 * 3600000).toISOString();
  const to = new Date(Date.now() - 24 * 3600000).toISOString();
  const { data, error } = await db.from("candidates")
    .select("id, auth_user_id, first_name, email, cv_data")
    .not("auth_user_id", "is", null).not("email", "is", null)
    .gte("created_at", from).lt("created_at", to).limit(300);
  if (error) { console.error("cv reminders:", error.message); return { ...out, errors: 1 }; }
  const list = (data ?? []).filter((c) => !cvFilled(asCv(c.cv_data)));
  if (!list.length) return out;

  const { data: docs } = await db.from("candidate_documents").select("auth_user_id")
    .in("auth_user_id", list.map((c) => c.auth_user_id as string)).ilike("label", "cv%");
  const withDoc = new Set((docs ?? []).map((d) => d.auth_user_id as string));
  const { data: reqs } = await db.from("cv_requests").select("candidate_email")
    .in("candidate_email", list.map((c) => c.email as string)).eq("status", "fulfilled");
  const withApplyCv = new Set((reqs ?? []).map((r) => String(r.candidate_email).toLowerCase()));

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://wolko.be";
  for (const c of list) {
    if (withDoc.has(c.auth_user_id as string) || withApplyCv.has(String(c.email).toLowerCase())) continue;
    try {
      const first = String(c.first_name ?? "").replace(/[<>&]/g, "").slice(0, 40);
      const html = layout(
        `${first ? `${first}, il` : "Il"} manque ton CV`,
        `<p>Ton profil Wolko est en ligne 👍 Mais les employeurs appellent <strong>d'abord les candidats qui ont un CV</strong>.</p>
<p>Ça prend 1 minute, depuis ton téléphone :</p>
<ul><li>📸 <strong>prends ton CV papier en photo</strong>,</li><li>📄 ou ajoute ton fichier PDF / Word,</li><li>✍️ ou crée ton CV gratuitement sur Wolko (pas besoin d'en avoir un).</li></ul>`,
        { label: "Ajouter mon CV", href: `${appUrl}/candidat/dashboard` },
      );
      const r = await resend.emails.send({ from: `${FROM_NAME} <${FROM_EMAIL}>`, to: [c.email as string], subject: "Il manque ton CV sur Wolko (1 minute)", html });
      if (r.error) { out.errors++; continue; }
      out.sent++;
    } catch (e) { console.error("cv reminder", c.id, e); out.errors++; }
  }
  return out;
}

/**
 * Relance des personnes qui ont postulé SANS CV (avec ou sans compte) : un e-mail par personne,
 * avec un lien personnel pour ajouter le CV en photo. Une ligne « CV demandé » est créée pour
 * chaque candidature relancée : elle empêche tout second envoi et l'employeur voit que le CV est demandé.
 * - cron : candidatures d'il y a 24 à 48 h ;
 * - backlog (bouton admin) : toutes celles des 45 derniers jours, jamais relancées.
 */
export async function runApplicantCvReminders(db: SupabaseClient, opts: { backlog?: boolean; max?: number } = {}): Promise<{ sent: number; apps: number; errors: number; left: number }> {
  const out = { sent: 0, apps: 0, errors: 0, left: 0 };
  const max = opts.max ?? 80; // offre gratuite Resend : 100 e-mails / jour
  const since = new Date(Date.now() - (opts.backlog ? 45 * 24 : 48) * 3600000).toISOString();
  const until = new Date(Date.now() - (opts.backlog ? 0 : 24) * 3600000).toISOString();
  const { data, error } = await db.from("applications")
    .select("id, applicant_name, applicant_email, applied_at, job_offers(title, organization_id, organizations(name))")
    .not("applicant_email", "is", null).gte("applied_at", since).lt("applied_at", until)
    .order("applied_at", { ascending: false }).limit(1000);
  if (error) { console.error("applicant cv reminders:", error.message); return { ...out, errors: 1 }; }
  const apps = data ?? [];
  if (!apps.length) return out;
  const { data: reqs } = await db.from("cv_requests").select("application_id").in("application_id", apps.map((a) => a.id as string));
  const done = new Set((reqs ?? []).map((r) => r.application_id as string));

  // Personnes qui ont déjà un CV ailleurs (fourni pour une autre offre, ou dans leur compte) : pas de relance.
  const emails = [...new Set(apps.map((a) => String(a.applicant_email).toLowerCase().trim()).filter((e) => e.includes("@")))];
  const { data: ful } = await db.from("cv_requests").select("candidate_email").eq("status", "fulfilled").in("candidate_email", emails);
  const hasCv = new Set((ful ?? []).map((r) => String(r.candidate_email).toLowerCase()));
  const { data: cands } = await db.from("candidates").select("email, auth_user_id, cv_data").in("email", emails);
  const authByEmail = new Map<string, string>();
  for (const c of cands ?? []) {
    const e = String(c.email).toLowerCase();
    if (cvFilled(asCv(c.cv_data))) hasCv.add(e);
    if (c.auth_user_id) authByEmail.set(e, c.auth_user_id as string);
  }
  if (authByEmail.size) {
    const { data: docs } = await db.from("candidate_documents").select("auth_user_id").in("auth_user_id", [...authByEmail.values()]).ilike("label", "cv%");
    const withDoc = new Set((docs ?? []).map((d) => d.auth_user_id as string));
    for (const [e, uid] of authByEmail) if (withDoc.has(uid)) hasCv.add(e);
  }

  const byEmail = new Map<string, typeof apps>();
  for (const a of apps) {
    const e = String(a.applicant_email).toLowerCase().trim();
    if (!e.includes("@") || done.has(a.id as string) || hasCv.has(e)) continue;
    byEmail.set(e, [...(byEmail.get(e) ?? []), a]);
  }
  const { cvLink } = await import("@/lib/candidate/cv-link");
  const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? v[0] ?? null : v ?? null);
  const esc = (s: string) => s.replace(/[<>&"]/g, "");
  for (const [email, list] of byEmail) {
    if (out.sent >= max) { out.left++; continue; }
    const last = list[0];
    const first = esc(String(last.applicant_name ?? "").trim().split(/\s+/)[0] ?? "").slice(0, 40);
    const titles = [...new Set(list.map((a) => one(a.job_offers as unknown as { title: string } | null)?.title).filter(Boolean))] as string[];
    try {
      const html = layout(
        `${first ? `${first}, ajoute` : "Ajoute"} ton CV à ta candidature`,
        `<p>Merci pour ta candidature${titles.length ? ` (${titles.slice(0, 3).map((t) => `<strong>${esc(t)}</strong>`).join(", ")})` : ""} 👍</p>
<p>Les employeurs appellent <strong>d'abord les candidats qui ont envoyé un CV</strong>. Le tien manque encore.</p>
<p>Pas besoin d'ordinateur : clique sur le bouton et <strong>prends ton CV papier en photo</strong> (ou envoie ton PDF / Word). Ça prend 1 minute, sans créer de compte.</p>`,
        { label: "📄 Ajouter mon CV", href: cvLink(last.id as string) },
      );
      const r = await resend.emails.send({ from: `${FROM_NAME} <${FROM_EMAIL}>`, to: [email], subject: "📄 Il manque ton CV pour ta candidature", html });
      if (r.error) { out.errors++; continue; }
      out.sent++;
      const rows = list.map((a) => {
        const j = one(a.job_offers as unknown as { title: string; organization_id: string; organizations: unknown } | null);
        const org = j ? one(j.organizations as { name?: string } | { name?: string }[] | null) : null;
        return j ? { application_id: a.id, organization_id: j.organization_id, candidate_email: email, org_name: org?.name ?? "", job_title: j.title } : null;
      }).filter(Boolean);
      if (rows.length) {
        const ins = await db.from("cv_requests").upsert(rows as object[], { onConflict: "application_id", ignoreDuplicates: true });
        if (ins.error) console.error("cv reminder rows:", ins.error.message); else out.apps += rows.length;
      }
    } catch (e) { console.error("applicant cv reminder", email, e); out.errors++; }
  }
  return out;
}
