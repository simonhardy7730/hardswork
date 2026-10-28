import { resend, FROM_EMAIL, FROM_NAME } from "@/lib/resend";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

/**
 * Prévient l'équipe qu'une société ou une agence vient de s'inscrire.
 * Destinataires : SIGNUP_NOTIFY_EMAIL, sinon FACEBOOK_NOTIFY_EMAIL (adresses séparées par des virgules). Sans adresse, rien n'est envoyé.
 * Ne lève jamais d'erreur.
 */
export async function sendSignupNotify(o: { name: string; type: string; vat: string | null; city: string | null }): Promise<boolean> {
  const to = (process.env.SIGNUP_NOTIFY_EMAIL || process.env.FACEBOOK_NOTIFY_EMAIL || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (to.length === 0) return false;
  const kind = o.type === "agency" ? "Agence" : "Entreprise";
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#101F43;line-height:1.5">
  <h2 style="margin:0 0 12px">Nouvelle inscription sur Wolko</h2>
  <p><strong>${esc(o.name)}</strong> (${kind})${o.city ? ` · ${esc(o.city)}` : ""}</p>
  ${o.vat ? `<p>N° de TVA : ${esc(o.vat)}</p>` : ""}
  <p>Essai gratuit de 7 jours en cours. Pense à les appeler dans les 24 heures.</p>
</div>`;
  try {
    const r = await resend.emails.send({ from: `${FROM_NAME} <${FROM_EMAIL}>`, to, subject: `Nouvelle inscription : ${o.name} (${kind})`, html });
    if (r.error) { console.error("Signup notify email error:", r.error); return false; }
    return true;
  } catch (err) {
    console.error("Signup notify email error:", err);
    return false;
  }
}
