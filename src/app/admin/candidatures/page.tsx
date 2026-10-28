import { adminClient } from "@/lib/billing/lifecycle";
import { findPoolCvs } from "@/lib/candidate/pool-cv";

export const dynamic = "force-dynamic";

type App = { id: string; job_offer_id: string; candidate_id: string | null; applicant_name: string; applicant_phone: string; applicant_email: string | null; cover_message: string | null; applied_at: string; status: string; notes: string | null; updated_at: string | null };

const fmt = (iso: string) => new Intl.DateTimeFormat("fr-BE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Brussels" }).format(new Date(iso));

/** Candidatures des clients (hors compte Wolko) : nom, contact, message et CV. */
export default async function AdminCandidaturesPage() {
  const db = adminClient();
  const { data: orgs } = await db.from("organizations").select("id, name").neq("name", "Wolko");
  const orgName = new Map((orgs ?? []).map((o: { id: string; name: string }) => [o.id, o.name]));
  const { data: offers } = await db.from("job_offers").select("id, title, organization_id").in("organization_id", [...orgName.keys()]);
  const offerById = new Map((offers ?? []).map((o: { id: string; title: string; organization_id: string }) => [o.id, o]));
  const { data: apps } = await db.from("applications").select("id, job_offer_id, candidate_id, applicant_name, applicant_phone, applicant_email, cover_message, applied_at, status, notes, updated_at")
    .in("job_offer_id", [...offerById.keys()]).order("applied_at", { ascending: false }).limit(200);
  const list = (apps ?? []) as App[];
  const candIds = list.map((a) => a.candidate_id).filter(Boolean) as string[];
  const cvs = await findPoolCvs(candIds).catch(() => new Map());

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-[#101F43]">Candidatures des clients</h1>
        <p className="text-sm text-gray-600">{list.length} candidature(s) sur les offres des sociétés et agences clientes (hors compte Wolko).</p>
      </div>
      <div className="space-y-3">
        {list.map((a) => {
          const offer = offerById.get(a.job_offer_id);
          const cv = a.candidate_id ? cvs.get(a.candidate_id) : null;
          return (
            <div key={a.id} className="bg-white border border-gray-200 rounded-xl p-4 text-sm space-y-1">
              <div className="font-bold text-[#101F43]">{a.applicant_name} <span className="font-normal text-gray-500">· {fmt(a.applied_at)} · {a.status}</span></div>
              <div className="text-gray-700">{offer?.title} — {offer ? orgName.get(offer.organization_id) : ""}</div>
              <div className="text-gray-700">{a.applicant_phone} · {a.applicant_email ?? "pas d'e-mail"}</div>
              {a.cover_message ? <div className="text-gray-600 italic">« {a.cover_message} »</div> : null}
              {a.notes?.trim() ? <div className="text-gray-800"><strong>Note du recruteur :</strong> {a.notes} <span className="text-gray-500">(modifiée le {a.updated_at ? fmt(a.updated_at) : "?"})</span></div> : null}
              <div>
                {cv?.kind === "file" ? <a className="font-bold text-[#101F43] underline" href={`/admin/candidatures/cv/${a.id}`} target="_blank" rel="noopener noreferrer">Voir le CV ({cv.name})</a>
                  : cv?.kind === "built" ? <span className="text-gray-600">CV créé sur Wolko (dans la candidathèque)</span>
                  : <span className="text-gray-500">Aucun CV trouvé</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
