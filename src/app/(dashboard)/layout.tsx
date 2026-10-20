import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardSidebar from "@/components/dashboard/Sidebar";
import DashboardTopbar from "@/components/dashboard/Topbar";
import { getSpace } from "@/lib/auth/space";
import { getOrgAccess } from "@/lib/billing/access";
import { poolEnabled } from "@/lib/candidate/pool";
import TrialBanner from "@/components/dashboard/TrialBanner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("*, organizations(*)")
    .eq("id", user.id)
    .single();

  if (!profile) redirect((await getSpace()) === "candidate" ? "/candidat/dashboard" : "/onboarding");

  // Droit d'accès + cloche en parallèle (RLS : uniquement les candidatures de l'organisation)
  const [access, { data: newApps, count: newCount }] = await Promise.all([
    getOrgAccess(supabase, profile.organization_id),
    supabase
    .from("applications")
    .select("id, applicant_name, applied_at, job_offer_id, job_offers(title)", { count: "exact" })
    .eq("status", "nouveau")
    .order("applied_at", { ascending: false })
    .limit(5),
  ]);
  const notifications = (newApps ?? []).map((a) => {
    const j = a.job_offers as unknown as { title?: string } | { title?: string }[] | null;
    return {
      id: a.id as string,
      name: a.applicant_name as string,
      job: (Array.isArray(j) ? j[0]?.title : j?.title) ?? "",
      offerId: a.job_offer_id as string,
      at: a.applied_at as string,
    };
  });

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      <DashboardSidebar org={profile.organizations as never} showPool={poolEnabled()} />
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <DashboardTopbar user={profile} notifications={notifications} total={newCount ?? notifications.length} />
        <TrialBanner access={access} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
