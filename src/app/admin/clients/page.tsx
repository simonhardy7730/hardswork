import { adminClient } from "@/lib/billing/lifecycle";

export const dynamic = "force-dynamic";

type Org = { id: string; name: string; type: string; city: string | null; region: string | null; phone: string | null; email: string | null; website: string | null; vat_number: string | null; address: string | null; created_at: string };
type Sub = { organization_id: string; status: string; plan: string | null; trial_ends_at: string | null; subscribed_at: string | null };
type U = { organization_id: string; full_name: string | null; email: string | null; role: string | null };

const fmt = (iso: string | null) => (iso ? new Intl.DateTimeFormat("fr-BE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Brussels" }).format(new Date(iso)) : "—");
const dash = (v: string | null | undefined) => (v && v.trim() ? v : "—");

function statusOf(s: Sub | undefined): { text: string; cls: string } {
  if (!s) return { text: "Aucun abonnement", cls: "bg-gray-100 text-gray-700" };
  if (s.status === "trial") {
    const end = s.trial_ends_at ? new Date(s.trial_ends_at).getTime() : 0;
    return end > Date.now() ? { text: `Essai gratuit jusqu'au ${fmt(s.trial_ends_at).slice(0, 10)}`, cls: "bg-amber-100 text-amber-900" } : { text: "Essai terminé", cls: "bg-red-100 text-red-800" };
  }
  if (s.status === "active") return { text: `Abonné ${s.plan ?? ""}`.trim(), cls: "bg-green-100 text-green-800" };
  return { text: "Annulé", cls: "bg-red-100 text-red-800" };
}

export default async function AdminClientsPage() {
  const db = adminClient();
  const [orgQ, subQ, userQ, offerQ] = await Promise.all([
    db.from("organizations").select("id, name, type, city, region, phone, email, website, vat_number, address, created_at").order("created_at", { ascending: false }).limit(500),
    db.from("subscriptions").select("organization_id, status, plan, trial_ends_at, subscribed_at").limit(1000),
    db.from("users").select("organization_id, full_name, email, role").limit(2000),
    db.from("job_offers").select("organization_id, status").limit(5000),
  ]);
  // Activité réelle : dernière connexion de chaque utilisateur + candidatures reçues et ce qu'elles sont devenues.
  const authList = await db.auth.admin.listUsers({ page: 1, perPage: 200 }).catch(() => null);
  const lastSeen = new Map((authList?.data?.users ?? []).map((u) => [(u.email ?? "").toLowerCase(), u.last_sign_in_at ?? null]));
  const appQ = await db.from("applications").select("job_offer_id, status, notes, applied_at, updated_at, job_offers(organization_id)").limit(5000);
  type AppRow = { job_offer_id: string; status: string; notes: string | null; applied_at: string; updated_at: string | null; job_offers: { organization_id: string } | { organization_id: string }[] | null };
  const appsByOrg = new Map<string, AppRow[]>();
  for (const a of (appQ.data ?? []) as unknown as AppRow[]) {
    const jo = Array.isArray(a.job_offers) ? a.job_offers[0] : a.job_offers;
    if (jo) appsByOrg.set(jo.organization_id, [...(appsByOrg.get(jo.organization_id) ?? []), a]);
  }
  const orgs = (orgQ.data ?? []) as Org[];
  const subs = new Map(((subQ.data ?? []) as Sub[]).map((s) => [s.organization_id, s]));
  const users = (userQ.data ?? []) as U[];
  const offers = (offerQ.data ?? []) as { organization_id: string; status: string }[];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-[#101F43]">Clients</h1>
        <p className="text-sm text-gray-600">{orgs.length} société(s) et agence(s) inscrites. Du plus récent au plus ancien.</p>
      </div>
      {orgs.map((o) => {
        const st = statusOf(subs.get(o.id));
        const us = users.filter((u) => u.organization_id === o.id);
        const of = offers.filter((x) => x.organization_id === o.id);
        const active = of.filter((x) => x.status === "active").length;
        return (
          <section key={o.id} className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <h2 className="text-lg font-black text-[#101F43]">{o.name}</h2>
              <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-[#101F43] text-white">{o.type === "agency" ? "Agence" : "Entreprise"}</span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${st.cls}`}>{st.text}</span>
            </div>
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-800">
              <div><dt className="inline font-bold">Inscrit le : </dt><dd className="inline">{fmt(o.created_at)}</dd></div>
              <div><dt className="inline font-bold">N° de TVA : </dt><dd className="inline">{dash(o.vat_number)}</dd></div>
              <div><dt className="inline font-bold">Ville : </dt><dd className="inline">{dash(o.city)}</dd></div>
              <div><dt className="inline font-bold">Région : </dt><dd className="inline">{dash(o.region)}</dd></div>
              <div><dt className="inline font-bold">Adresse : </dt><dd className="inline">{dash(o.address)}</dd></div>
              <div><dt className="inline font-bold">Téléphone : </dt><dd className="inline">{dash(o.phone)}</dd></div>
              <div><dt className="inline font-bold">E-mail société : </dt><dd className="inline">{dash(o.email)}</dd></div>
              <div><dt className="inline font-bold">Site web : </dt><dd className="inline">{dash(o.website)}</dd></div>
              <div><dt className="inline font-bold">Offres : </dt><dd className="inline">{of.length} au total, {active} active(s)</dd></div>
            </dl>
            <div className="mt-3 text-sm">
              <span className="font-bold">Utilisateurs : </span>
              {us.length === 0 ? "—" : us.map((u) => `${dash(u.full_name)} (${dash(u.email)}, ${dash(u.role)}) — dernière connexion : ${fmt(lastSeen.get((u.email ?? "").toLowerCase()) ?? null)}`).join(" · ")}
            </div>
            {(() => {
              const ap = appsByOrg.get(o.id) ?? [];
              if (ap.length === 0) return <div className="mt-1 text-sm"><span className="font-bold">Candidatures reçues : </span>aucune</div>;
              const by = ap.reduce<Record<string, number>>((m, a) => ({ ...m, [a.status]: (m[a.status] ?? 0) + 1 }), {});
              const touched = ap.filter((a) => a.status !== "nouveau" || (a.notes ?? "").trim()).length;
              return <div className="mt-1 text-sm"><span className="font-bold">Candidatures reçues : </span>{ap.length} ({Object.entries(by).map(([k, v]) => `${v} ${k}`).join(", ")}) · traitées par l&apos;organisation : {touched}</div>;
            })()}
          </section>
        );
      })}
    </div>
  );
}
