import { resend, FROM_EMAIL, FROM_NAME } from "@/lib/resend";
import { facebookPostText, jobLink, type ShareJob } from "@/lib/social/post-text";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

/**
 * Prévient l'équipe qu'une offre vient de partir sur la page Facebook, avec le texte prêt à coller dans les groupes.
 * Destinataires : FACEBOOK_NOTIFY_EMAIL (adresses séparées par des virgules). Sans cette variable, rien n'est envoyé. Ne lève jamais d'erreur.
 */
export async function sendShareNotify(job: ShareJob): Promise<boolean> {
  const to = (process.env.FACEBOOK_NOTIFY_EMAIL ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (to.length === 0) return false;
  const link = jobLink(job.id);
  const text = facebookPostText(job);
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#101F43;line-height:1.5">
  <h2 style="margin:0 0 12px">Une offre vient de partir sur la page Facebook Wolko</h2>
  <p><strong>${esc(job.title)}</strong>${job.city ? ` · ${esc(job.city)}` : ""}</p>
  <p style="margin:20px 0"><a href="${link}" style="background:#FFC107;color:#101F43;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:bold">Voir l'offre</a></p>
  <p>À partager maintenant dans les groupes (texte prêt à copier) :</p>
  <pre style="white-space:pre-wrap;background:#F6F7F9;border-radius:10px;padding:14px;font-family:inherit;font-size:14px">${esc(text)}</pre>
</div>`;
  try {
    const r = await resend.emails.send({ from: `${FROM_NAME} <${FROM_EMAIL}>`, to, subject: `Offre sur Facebook : ${job.title}`, html });
    if (r.error) { console.error("Share notify email error:", r.error); return false; }
    return true;
  } catch (err) {
    console.error("Share notify email error:", err);
    return false;
  }
}
