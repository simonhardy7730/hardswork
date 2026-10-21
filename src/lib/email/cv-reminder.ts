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
