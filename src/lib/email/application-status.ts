import { resend, FROM_EMAIL, FROM_NAME } from "@/lib/resend";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

/** Statuts qui déclenchent un e-mail au candidat (jamais « nouveau »). */
export const NOTIFIED_STATUSES = ["contacte", "entretien", "place", "refuse"] as const;

const COPY: Record<string, { subject: (o: string) => string; title: string; body: (o: string, j: string) => string }> = {
  contacte: {
    subject: (o) => `${o} examine votre candidature`,
    title: "Votre candidature est en cours d'examen 👀",
    body: (o, j) => `<strong>${o}</strong> a ouvert votre candidature pour <strong>${j}</strong> et l'étudie en ce moment. Vous serez prévenu(e) de la suite.`,
  },
  entretien: {
    subject: (o) => `${o} souhaite vous rencontrer`,
    title: "Bonne nouvelle : un entretien se prépare 🎉",
    body: (o, j) => `<strong>${o}</strong> souhaite vous rencontrer pour <strong>${j}</strong>. Le recruteur va vous contacter très prochainement : gardez votre téléphone à portée de main.`,
  },
  place: {
    subject: (o) => `Félicitations, ${o} vous a retenu(e)`,
    title: "Félicitations, vous êtes retenu(e) ! 🥳",
    body: (o, j) => `<strong>${o}</strong> a retenu votre candidature pour <strong>${j}</strong>. Le recruteur vous contacte pour les prochaines étapes.`,
  },
  refuse: {
    subject: (o) => `Votre candidature chez ${o}`,
    title: "Votre candidature n'a pas été retenue",
    body: (o, j) => `<strong>${o}</strong> a étudié votre candidature pour <strong>${j}</strong> mais n'a pas pu y donner suite cette fois. Merci pour votre intérêt : de nouvelles offres arrivent chaque jour sur Wolko.`,
  },
};

/** Prévient le candidat d'un changement de statut. Ne lève jamais d'erreur. */
export async function sendApplicationStatusEmail(p: { to: string; candidateName: string; orgName: string; jobTitle: string; status: string }): Promise<boolean> {
  const c = COPY[p.status];
  if (!c) return false;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://wolko.be";
  const first = esc(p.candidateName.trim().split(/\s+/)[0] || "");
  const org = esc(p.orgName), job = esc(p.jobTitle);
  const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#101F43;line-height:1.5">
  <h2 style="margin:0 0 12px">${c.title}</h2>
  <p>Bonjour ${first},</p>
  <p>${c.body(org, job)}</p>
  <p style="margin:24px 0"><a href="${appUrl}/candidat/dashboard" style="background:#FFC107;color:#101F43;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:bold">Voir mes candidatures</a></p>
  <p style="font-size:12px;color:#667085">Suivi automatique Wolko — votre candidature et son statut sont visibles dans votre espace.</p>
</div>`;
  try {
    const r = await resend.emails.send({ from: `${FROM_NAME} <${FROM_EMAIL}>`, to: p.to, subject: c.subject(p.orgName), html });
    if (r.error) { console.error("Status email error:", r.error); return false; }
    return true;
  } catch (err) {
    console.error("Status email error:", err);
    return false;
  }
}
