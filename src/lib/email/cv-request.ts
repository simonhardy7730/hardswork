import { resend, FROM_EMAIL, FROM_NAME } from "@/lib/resend";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

/** Prévient le candidat qu'un recruteur souhaite voir son CV. Ne lève jamais d'erreur. */
export async function sendCvRequestEmail(p: { to: string; candidateName: string; orgName: string; jobTitle: string }): Promise<boolean> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://wolko.be";
  const first = esc(p.candidateName.trim().split(/\s+/)[0] || "");
  const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#101F43;line-height:1.5">
  <h2 style="margin:0 0 12px">Un CV vous est demandé 📄</h2>
  <p>Bonjour ${first},</p>
  <p><strong>${esc(p.orgName)}</strong> a bien reçu votre candidature pour <strong>${esc(p.jobTitle)}</strong> et souhaite consulter votre CV.</p>
  <p>Déposez-le en 1 minute depuis votre espace Wolko (avec cette même adresse e-mail) :</p>
  <p style="margin:24px 0"><a href="${appUrl}/candidat/dashboard" style="background:#FFC107;color:#101F43;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:bold">Déposer mon CV</a></p>
  <p style="font-size:13px;color:#667085">Pas encore de compte ? Créez-le gratuitement sur <a href="${appUrl}/signup/candidat">wolko.be</a> avec cette adresse e-mail : la demande apparaîtra directement dans votre tableau de bord.</p>
</div>`;
  try {
    const r = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: p.to,
      subject: `📄 ${p.orgName} souhaite voir votre CV`,
      html,
    });
    if (r.error) { console.error("CV request email error:", r.error); return false; }
    return true;
  } catch (err) {
    console.error("CV request email error:", err);
    return false;
  }
}
