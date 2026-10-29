import { revalidatePath } from "next/cache";
import { adminClient } from "@/lib/billing/lifecycle";
import { getPlatformAdmin, can } from "@/lib/admin/platform";

export const dynamic = "force-dynamic";

/** Offres publiées par le compte Wolko lui-même (pas celles des clients). */
async function wolkoOrgId(db: ReturnType<typeof adminClient>): Promise<string | null> {
  const { data } = await db.from("organizations").select("id").eq("name", "Wolko").limit(1).maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

async function pauseAll(fd: FormData) {
  "use server";
  const admin = await getPlatformAdmin();
  if (!admin || !can(admin.role, "suspend") || fd.get("ok") !== "on") return;
  const db = adminClient();
  const org = await wolkoOrgId(db);
  if (!org) return;
  // « En pause » = retirée du site et des pages publiques, rien n'est supprimé ; réactivable depuis Mes offres.
  await db.from("job_offers").update({ status: "paused" }).eq("organization_id", org).eq("status", "active");
  revalidatePath("/admin/offres-wolko");
}

async function reactivateAll(fd: FormData) {
  "use server";
  const admin = await getPlatformAdmin();
  if (!admin || !can(admin.role, "suspend") || fd.get("ok") !== "on") return;
  const db = adminClient();
  const org = await wolkoOrgId(db);
  if (!org) return;
  await db.from("job_offers").update({ status: "active" }).eq("organization_id", org).eq("status", "paused");
  revalidatePath("/admin/offres-wolko");
}

export default async function Page() {
  const admin = await getPlatformAdmin();
  const db = adminClient();
  const org = await wolkoOrgId(db);
  const { data } = org ? await db.from("job_offers").select("id, title, city, status").eq("organization_id", org).order("created_at", { ascending: false }) : { data: [] };
  const offers = (data ?? []) as { id: string; title: string; city: string | null; status: string }[];
  const active = offers.filter((o) => o.status === "active").length;
  const paused = offers.filter((o) => o.status === "paused").length;
  const allowed = !!admin && can(admin.role, "suspend");
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-black text-[#101F43]">Offres du compte Wolko</h1>
      <p className="text-sm text-gray-700">{offers.length} offre(s) : {active} active(s), {paused} en pause. « En pause » retire l&apos;offre du site et des listes publiques sans rien supprimer ; les candidatures déjà reçues sont conservées.</p>
      <ul className="text-sm bg-white border border-gray-200 rounded-xl divide-y">
        {offers.map((o) => <li key={o.id} className="px-4 py-2">{o.title} · {o.city ?? "—"} · <strong>{o.status}</strong></li>)}
      </ul>
      {allowed ? (
        <div className="grid sm:grid-cols-2 gap-4">
          <form action={pauseAll} className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="ok" /> Je confirme : mettre en pause les {active} offre(s) active(s) de Wolko</label>
            <button className="bg-[#FFB900] text-[#101F43] font-bold rounded-lg px-4 py-2">Mettre en pause</button>
          </form>
          <form action={reactivateAll} className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="ok" /> Je confirme : réactiver les {paused} offre(s) en pause</label>
            <button className="border border-gray-300 font-bold rounded-lg px-4 py-2">Réactiver</button>
          </form>
        </div>
      ) : <p className="text-sm text-red-700">Ton rôle ne permet pas cette action.</p>}
    </div>
  );
}
