import { requireAgency } from "@/lib/auth/agency";
import { getL } from "@/lib/i18n/server";
import { createAgencyClient, setClientStatus } from "@/app/actions/agency";
import { Building2, Plus, Phone, Mail, MapPin } from "lucide-react";

const STATUS_STYLE: Record<string, string> = {
  prospect: "bg-amber-100 text-amber-700",
  actif: "bg-green-100 text-green-700",
  inactif: "bg-gray-100 text-gray-600",
};

export default async function ClientsPage(props: { searchParams: Promise<{ error?: string }> }) {
  const searchParams = await props.searchParams;
  const l = await getL();
  const { supabase, orgId } = await requireAgency();
  const STATUS_LABEL: Record<string, string> = {
    prospect: l("Prospect", "Prospect"), actif: l("Client actif", "Actieve klant"), inactif: l("Inactif", "Inactief"),
  };

  const { data: clients, error } = await supabase
    .from("agency_clients").select("*").eq("organization_id", orgId).order("created_at", { ascending: false });
  const { data: missions } = await supabase
    .from("agency_missions").select("client_id, status").eq("organization_id", orgId);
  const openByClient = new Map<string, number>();
  (missions ?? []).forEach((m) => {
    if (m.status === "ouverte" || m.status === "en_cours") openByClient.set(m.client_id, (openByClient.get(m.client_id) ?? 0) + 1);
  });

  const input = "w-full px-3 py-2 text-sm border border-ink-100 rounded-lg focus:outline-none focus:border-brand bg-white";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#101F43]">{l("Entreprises clientes", "Klantbedrijven")}</h1>
        <p className="text-sm text-ink-500 mt-0.5">{l("Les entreprises pour lesquelles votre agence recrute.", "De bedrijven voor wie uw kantoor werft.")}</p>
      </div>

      {(error || searchParams.error) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-sm px-4 py-3">
          {searchParams.error ?? l("Les tables de l'espace agence ne sont pas encore créées (migration 006 à exécuter dans Supabase).", "De tabellen van de kantoorruimte bestaan nog niet (migratie 006 uitvoeren in Supabase).")}
        </div>
      )}

      <form action={createAgencyClient} className="bg-white rounded-xl border border-ink-100 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-ink flex items-center gap-2"><Plus size={15} /> {l("Ajouter un client", "Een klant toevoegen")}</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          <input name="name" required placeholder={l("Nom de l'entreprise *", "Naam van het bedrijf *")} className={input} />
          <input name="contact_name" placeholder={l("Personne de contact", "Contactpersoon")} className={input} />
          <input name="city" placeholder={l("Ville", "Stad")} className={input} />
          <input name="contact_email" type="email" placeholder={l("E-mail", "E-mail")} className={input} />
          <input name="contact_phone" placeholder={l("Téléphone", "Telefoon")} className={input} />
          <select name="status" defaultValue="prospect" className={input}>
            <option value="prospect">{STATUS_LABEL.prospect}</option>
            <option value="actif">{STATUS_LABEL.actif}</option>
            <option value="inactif">{STATUS_LABEL.inactif}</option>
          </select>
        </div>
        <textarea name="notes" rows={2} placeholder={l("Notes (conditions, besoins, historique…)", "Notities (voorwaarden, noden, historiek…)")} className={input} />
        <button className="px-4 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark transition">{l("Enregistrer le client", "Klant opslaan")}</button>
      </form>

      {(clients ?? []).length === 0 ? (
        <div className="bg-white rounded-xl border border-ink-100 py-14 text-center">
          <Building2 size={36} className="text-[#EADFC4] mx-auto mb-3" />
          <p className="text-sm text-ink-500">{l("Aucun client pour le moment.", "Nog geen klanten.")}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-ink-100 divide-y divide-ink-100">
          {(clients ?? []).map((c) => (
            <div key={c.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-ink">{c.name}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500 mt-1">
                  {c.contact_name && <span>{c.contact_name}</span>}
                  {c.city && <span className="inline-flex items-center gap-1"><MapPin size={11} />{c.city}</span>}
                  {c.contact_phone && <a href={`tel:${c.contact_phone}`} className="inline-flex items-center gap-1 hover:text-brand"><Phone size={11} />{c.contact_phone}</a>}
                  {c.contact_email && <a href={`mailto:${c.contact_email}`} className="inline-flex items-center gap-1 hover:text-brand"><Mail size={11} />{c.contact_email}</a>}
                </div>
                {c.notes && <p className="text-xs text-ink-300 mt-1.5 line-clamp-2">{c.notes}</p>}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-ink-500">{openByClient.get(c.id) ?? 0} {l("mission(s) en cours", "lopende opdracht(en)")}</span>
                <form action={setClientStatus} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={c.id} />
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLE[c.status]}`}>{STATUS_LABEL[c.status]}</span>
                  <select name="status" defaultValue={c.status} className="text-xs border border-ink-100 rounded-lg px-2 py-1.5 bg-white" aria-label={l("Changer le statut", "Status wijzigen")}>
                    <option value="prospect">{STATUS_LABEL.prospect}</option>
                    <option value="actif">{STATUS_LABEL.actif}</option>
                    <option value="inactif">{STATUS_LABEL.inactif}</option>
                  </select>
                  <button className="text-xs font-medium text-brand hover:underline">{l("OK", "OK")}</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
