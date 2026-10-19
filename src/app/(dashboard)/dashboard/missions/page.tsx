import { requireAgency } from "@/lib/auth/agency";
import { getL } from "@/lib/i18n/server";
import { createMission, setMissionStatus } from "@/app/actions/agency";
import { ClipboardList, Plus } from "lucide-react";
import Link from "next/link";

const STATUS_STYLE: Record<string, string> = {
  ouverte: "bg-blue-100 text-blue-700",
  en_cours: "bg-amber-100 text-amber-700",
  pourvue: "bg-green-100 text-green-700",
  annulee: "bg-gray-100 text-gray-600",
};

export default async function MissionsPage(props: { searchParams: Promise<{ error?: string }> }) {
  const searchParams = await props.searchParams;
  const l = await getL();
  const { supabase, orgId } = await requireAgency();
  const STATUS_LABEL: Record<string, string> = {
    ouverte: l("Ouverte", "Open"), en_cours: l("En cours", "Lopend"), pourvue: l("Pourvue", "Ingevuld"), annulee: l("Annulée", "Geannuleerd"),
  };

  const { data: clients } = await supabase
    .from("agency_clients").select("id, name").eq("organization_id", orgId).order("name");
  const { data: missions, error } = await supabase
    .from("agency_missions").select("*, agency_clients(name)").eq("organization_id", orgId).order("created_at", { ascending: false });

  const input = "w-full px-3 py-2 text-sm border border-ink-100 rounded-lg focus:outline-none focus:border-brand bg-white";
  const noClients = (clients ?? []).length === 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#101F43]">{l("Missions", "Opdrachten")}</h1>
        <p className="text-sm text-ink-500 mt-0.5">{l("Les postes que vous cherchez à pourvoir pour vos clients.", "De functies die u voor uw klanten invult.")}</p>
      </div>

      {(error || searchParams.error) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-sm px-4 py-3">
          {searchParams.error ?? l("Les tables de l'espace agence ne sont pas encore créées (migration 006 à exécuter dans Supabase).", "De tabellen van de kantoorruimte bestaan nog niet (migratie 006 uitvoeren in Supabase).")}
        </div>
      )}

      {noClients ? (
        <div className="bg-white rounded-xl border border-ink-100 p-5 text-sm text-ink-500">
          {l("Ajoutez d'abord un client pour créer une mission.", "Voeg eerst een klant toe om een opdracht te maken.")}{" "}
          <Link href="/dashboard/clients" className="font-medium text-brand underline">{l("Aller aux clients", "Naar de klanten")}</Link>
        </div>
      ) : (
        <form action={createMission} className="bg-white rounded-xl border border-ink-100 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-ink flex items-center gap-2"><Plus size={15} /> {l("Nouvelle mission", "Nieuwe opdracht")}</h2>
          <div className="grid sm:grid-cols-4 gap-3">
            <select name="client_id" required defaultValue="" className={input}>
              <option value="" disabled>{l("Client *", "Klant *")}</option>
              {(clients ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input name="title" required placeholder={l("Intitulé du poste *", "Functietitel *")} className={`${input} sm:col-span-2`} />
            <input name="positions" type="number" min={1} defaultValue={1} aria-label={l("Nombre de postes", "Aantal functies")} className={input} />
            <input name="start_date" type="date" aria-label={l("Date de début", "Startdatum")} className={input} />
          </div>
          <textarea name="notes" rows={2} placeholder={l("Notes (profil, conditions…)", "Notities (profiel, voorwaarden…)")} className={input} />
          <button className="px-4 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark transition">{l("Créer la mission", "Opdracht maken")}</button>
        </form>
      )}

      {(missions ?? []).length === 0 ? (
        <div className="bg-white rounded-xl border border-ink-100 py-14 text-center">
          <ClipboardList size={36} className="text-[#EADFC4] mx-auto mb-3" />
          <p className="text-sm text-ink-500">{l("Aucune mission pour le moment.", "Nog geen opdrachten.")}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-ink-100 divide-y divide-ink-100">
          {(missions ?? []).map((m) => {
            const client = m.agency_clients as unknown as { name: string } | null;
            return (
              <div key={m.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-ink">{m.title}</p>
                  <p className="text-xs text-ink-500 mt-0.5">
                    {client?.name} · {m.positions} {m.positions > 1 ? l("postes", "functies") : l("poste", "functie")}
                    {m.start_date ? ` · ${l("début", "start")} ${new Date(m.start_date).toLocaleDateString(l("fr-BE", "nl-BE"))}` : ""}
                  </p>
                  {m.notes && <p className="text-xs text-ink-300 mt-1.5 line-clamp-2">{m.notes}</p>}
                </div>
                <form action={setMissionStatus} className="flex items-center gap-2 shrink-0">
                  <input type="hidden" name="id" value={m.id} />
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLE[m.status]}`}>{STATUS_LABEL[m.status]}</span>
                  <select name="status" defaultValue={m.status} className="text-xs border border-ink-100 rounded-lg px-2 py-1.5 bg-white" aria-label={l("Changer le statut", "Status wijzigen")}>
                    {Object.entries(STATUS_LABEL).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                  </select>
                  <button className="text-xs font-medium text-brand hover:underline">OK</button>
                </form>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
