import { adminClient } from "@/lib/billing/lifecycle";
import CopyPost from "@/components/admin/CopyPost";
import PublishToPage from "@/components/admin/PublishToPage";
import { facebookPostText } from "@/lib/social/post-text";
import { facebookConfigured } from "@/lib/social/facebook";

export const dynamic = "force-dynamic";

export default async function PartagePage() {
  const db = adminClient();
  const { data } = await db
    .from("jobs")
    .select("id, title, city, contract_type, hide_company, organizations(name)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(30);
  const jobs = (data ?? []).map((j) => {
    const o = j.organizations as unknown as { name?: string } | { name?: string }[] | null;
    const org_name = Array.isArray(o) ? o[0]?.name ?? null : o?.name ?? null;
    return { id: j.id as string, title: j.title as string, city: (j.city as string) ?? null, contract_type: (j.contract_type as string) ?? null, hide_company: (j.hide_company as boolean) ?? null, org_name };
  });
  const { data: posts } = await db.from("social_posts").select("job_id").eq("status", "posted").in("job_id", jobs.map((j) => j.id));
  const posted = new Set((posts ?? []).map((p) => p.job_id as string));
  const enabled = facebookConfigured();
  return (
    <div>
      <h1 className="text-xl font-black text-[#101F43]">Partager sur Facebook</h1>
      <p className="text-sm text-[#101F43]/70 mt-1 mb-5">Copie le post, colle-le dans la page Wolko et les groupes d&apos;emploi de la région. Les annonces confidentielles restent anonymes.</p>
      <div className="space-y-3">
        {jobs.length === 0 && <p className="text-sm">Aucune offre active.</p>}
        {jobs.map((j) => {
          const text = facebookPostText(j);
          return (
            <div key={j.id} className="rounded-xl border border-[#101F43]/10 bg-white p-4 flex gap-4 items-start">
              <pre className="whitespace-pre-wrap text-sm text-[#101F43] font-sans flex-1">{text}</pre>
              <div className="shrink-0 flex flex-col items-end gap-2">
                <CopyPost text={text} />
                <PublishToPage jobId={j.id} posted={posted.has(j.id)} enabled={enabled} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
