import { resend, FROM_EMAIL, FROM_NAME } from "@/lib/resend";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const ROLE: Record<string, string> = { admin: "administrateur", recruiter: "recruteur", viewer: "observateur" };

/** Envoie le lien d'invitation d'équipe. Ne lève jamais d'erreur. */
export async function sendInviteEmail(p: { to: string; orgName: string; token: string; role: string }): Promise<boolean> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://wolko.be";
  const link = `${appUrl}/signup?invite=${encodeURIComponent(p.token)}`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#101F43;line-height:1.5">
  <h2 style="margin:0 0 12px">Vous êtes invité(e) à rejoindre ${esc(p.orgName)} 👋</h2>
  <p><strong>${esc(p.orgName)}</strong> vous invite sur Wolko en tant que <strong>${ROLE[p.role] ?? "membre"}</strong>.</p>
  <p style="margin:24px 0"><a href="${link}" style="background:#FFC107;color:#101F43;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:bold">Rejoindre l'équipe</a></p>
  <p style="font-size:13px;color:#667085">Créez votre compte avec cette adresse e-mail. Le lien est personnel, valable 7 jours et utilisable une seule fois.</p>
</div>`;
  try {
    const r = await resend.emails.send({ from: `${FROM_NAME} <${FROM_EMAIL}>`, to: p.to, subject: `${p.orgName} vous invite sur Wolko`, html });
    if (r.error) { console.error("Invite email error:", r.error); return false; }
    return true;
  } catch (err) {
    console.error("Invite email error:", err);
    return false;
  }
}
