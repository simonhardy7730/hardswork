import { getOrgAccess } from "@/lib/billing/access";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import KanbanBoard from "@/components/kanban/KanbanBoard";
import { getLang } from "@/lib/i18n/server";
import { purgeRefused } from "@/lib/purge-refused";
import RetentionSelect from "@/components/kanban/RetentionSelect";
import type { Application } from "@/lib/supabase/types";

export default async function CandidaturesGlobalPage(props: {
  searchParams: Promise<{ offre?: string }>;
}) {
  const { offre } = await props.searchParams;
  const lang = await getLang();
  const l = (fr: string, nl: string) => (lang === "nl" ? nl : fr);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("organization_id").eq("id", user.id).single();
  if (!profile) redirect("/onboarding");

  // Candidatures refusées depuis plus de 30 jours : supprimées (échec toléré)
  const retentionDays = await purgeRefused(profile.organization_id).catch(() => 7);

  const { hasAccess } = await getOrgAccess(supabase, profile.organization_id);

  const { data: offers } = await supabase
    .from("job_offers")
    .select("id, title")
    .eq("organization_id", profile.organization_id)
    .order("created_at", { ascending: false });
  const titles = new Map((offers ?? []).map((o) => [o.id as string, o.title as string]));
  const selected = offre && titles.has(offre) ? offre : "";

  let q = supabase.from("applications").select("*").order("applied_at", { ascending: false });
  q = selected ? q.eq("job_offer_id", selected) : q.in("job_offer_id", Array.from(titles.keys()));
  const { data: applications } = titles.size > 0 ? await q : { data: [] as Application[] };

  const apps = ((applications ?? []) as Application[]).map((a) => {
    const withTitle = { ...a, job_title: titles.get(a.job_offer_id) };
    return hasAccess ? withTitle : { ...withTitle, applicant_email: null, applicant_phone: "" };
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 flex-wrap">
        <Link href="/dashboard/candidatures"
          className={`text-xs font-bold px-3 py-1.5 rounded-full border transition ${!selected ? "bg-ink text-white border-ink" : "border-ink-100 text-ink-500 hover:border-ink-300"}`}>
          {l("Toutes les offres", "Alle vacatures")}
        </Link>
        {(offers ?? []).map((o) => (
          <Link key={o.id} href={`/dashboard/candidatures?offre=${o.id}`}
            className={`text-xs font-bold px-3 py-1.5 rounded-full border transition ${selected === o.id ? "bg-ink text-white border-ink" : "border-ink-100 text-ink-500 hover:border-ink-300"}`}>
            {o.title}
          </Link>
        ))}
      </div>

      <RetentionSelect days={retentionDays} />

      {titles.size === 0 ? (
        <p className="text-sm text-ink-500">{l("Publiez une offre pour recevoir des candidatures.", "Publiceer een vacature om sollicitaties te ontvangen.")}</p>
      ) : (
        <KanbanBoard key={selected} applications={apps} jobOfferId={selected} candidatureUrl="" hasSubscription={hasAccess} />
      )}
    </div>
  );
}
