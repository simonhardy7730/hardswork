import { revalidatePath } from "next/cache";
import { adminClient } from "@/lib/billing/lifecycle";
import { getPlatformAdmin } from "@/lib/admin/platform";
import { planInvites, planOffer, sendInvites, sendOffer, SEND_CAP } from "@/lib/email/campaigns";

export const dynamic = "force-dynamic";
const PEPS_JOB = "2142bc80-0b96-4249-bf5f-c4eecf35a46d";

async function doInvites(fd: FormData) {
  "use server";
  if (!(await getPlatformAdmin()) || fd.get("ok") !== "on") return;
  await sendInvites(adminClient());
  revalidatePath("/admin/envois");
}
async function doOffer(fd: FormData) {
  "use server";
  if (!(await getPlatformAdmin()) || fd.get("ok") !== "on") return;
  await sendOffer(adminClient(), PEPS_JOB);
  revalidatePath("/admin/envois");
}

export default async function EnvoisPage() {
  const db = adminClient();
  const [inv, off] = await Promise.all([planInvites(db), planOffer(db, PEPS_JOB)]);
  const Box = ({ title, text, n, sent, action, label }: { title: string; text: string; n: number; sent: number; action: (fd: FormData) => Promise<void>; label: string }) => (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
      <h2 className="font-black text-[#101F43]">{title}</h2>
      <p className="text-sm text-gray-700">{text}</p>
      <p className="text-sm"><strong>{n}</strong> destinataire(s) à contacter · {sent} déjà envoyé(s). Chaque clic envoie au maximum {SEND_CAP} e-mails (limite d&apos;envoi gratuite de Resend : 100 par jour).</p>
      {n > 0 && (
        <form action={action} className="space-y-2">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="ok" /> Je confirme l&apos;envoi de {Math.min(n, SEND_CAP)} e-mail(s)</label>
          <button className="bg-[#FFB900] text-[#101F43] font-bold rounded-lg px-4 py-2">{label}</button>
        </form>
      )}
    </div>
  );
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-black text-[#101F43]">Envois</h1>
      {!inv.ready && <p className="text-sm bg-red-50 text-red-700 border border-red-200 rounded-lg p-3">La migration 040 n&apos;est pas encore lancée dans Supabase : aucun envoi n&apos;est possible.</p>}
      <Box title="Inviter à activer les alertes" text="Un seul e-mail par compte candidat qui n'a pas activé les alertes (sauf ceux qui se sont désinscrits) : on leur propose de les activer pour avoir plus de chances de trouver un job." n={inv.recipients.length} sent={inv.alreadySent} action={doInvites} label="Envoyer l'invitation" />
      <Box title={`Offre Peps Interim${off.offer ? " — " + off.offer.title : ""}`} text="L'offre est envoyée uniquement aux candidats qui ont activé les alertes ET dont le profil correspond vraiment : même métier ou secteur, moins de 30 km de Tournai. Aucune coordonnée n'est transmise à Peps Interim." n={off.recipients.length} sent={off.alreadySent} action={doOffer} label="Envoyer l'offre" />
    </div>
  );
}
