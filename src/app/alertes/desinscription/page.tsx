import type { Metadata } from "next";
import { adminClient } from "@/lib/billing/lifecycle";

export const metadata: Metadata = { title: "Désinscription — Wolko", robots: { index: false } };
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function unsubscribe(formData: FormData) {
  "use server";
  const t = String(formData.get("t") ?? "");
  if (!UUID.test(t)) return;
  const db = adminClient();
  const r = await db.from("job_alerts").update({ active: false, blocked: true }).eq("unsub_token", t);
  if (r.error) await db.from("job_alerts").update({ active: false }).eq("unsub_token", t); // colonne « blocked » absente (migration 040 pas encore lancée)
}

// Un simple clic sur le lien du mail ne désinscrit pas (les antivirus ouvrent les liens) : il faut confirmer.
export default async function Page(props: { searchParams: Promise<{ t?: string; done?: string }> }) {
  const { t = "" } = await props.searchParams;
  const valid = UUID.test(t);
  return (
    <main className="min-h-screen bg-[#FFFBF2] font-body flex items-center justify-center px-4">
      <div className="bg-white border border-[#101F43]/10 rounded-2xl p-8 max-w-md w-full text-center">
        <h1 className="font-display font-black uppercase text-[#101F43] text-2xl mb-3">Alertes emploi</h1>
        {valid ? (
          <form action={unsubscribe}>
            <input type="hidden" name="t" value={t} />
            <p className="text-sm text-[#101F43]/70 mb-5">Confirme pour ne plus recevoir d&apos;e-mails d&apos;offres de Wolko. Tu pourras réactiver les alertes depuis ton espace.</p>
            <button className="bg-[#FFB900] text-[#101F43] font-bold rounded-xl px-6 py-3 min-h-12">Me désinscrire</button>
          </form>
        ) : <p className="text-sm text-[#101F43]/70">Lien invalide.</p>}
      </div>
    </main>
  );
}
