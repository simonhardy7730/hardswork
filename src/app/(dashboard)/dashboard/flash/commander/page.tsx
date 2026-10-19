import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getL } from "@/lib/i18n/server";
import FlashOrderForm from "@/components/flash/FlashOrderForm";

export default async function CommanderFlashPage({ searchParams }: { searchParams: Promise<{ offre?: string; qty?: string }> }) {
  const { offre, qty } = await searchParams;
  const l = await getL();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/flash/commander");
  const { data: profile } = await supabase.from("users").select("organization_id, role, email, full_name").eq("id", user.id).single();
  if (!profile) redirect("/onboarding");

  const [{ data: org }, { data: drafts }, { data: live }] = await Promise.all([
    supabase.from("organizations").select("name, vat_number, address, city, email").eq("id", profile.organization_id).single(),
    supabase.from("job_offers").select("id, title, city").eq("organization_id", profile.organization_id).eq("status", "draft").order("created_at", { ascending: false }),
    supabase.from("flash_credits").select("job_offer_id").eq("organization_id", profile.organization_id).in("status", ["pending", "available", "active", "suspended"]).not("job_offer_id", "is", null),
  ]);
  const taken = new Set((live ?? []).map((c) => c.job_offer_id as string));
  const free = (drafts ?? []).filter((d) => !taken.has(d.id as string)).map((d) => ({ id: d.id as string, title: d.title as string, city: (d.city as string) ?? "" }));

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[#101F43]">{l("Commander WOLKO Flash", "WOLKO Flash bestellen")}</h1>
        <p className="text-sm text-ink-500 mt-0.5">{l("Publiez une annonce pendant 30 jours, sans abonnement. 149 € HTVA, paiement unique sur facture.", "Publiceer een advertentie gedurende 30 dagen, zonder abonnement. 149 € excl. btw, eenmalige betaling op factuur.")}</p>
      </div>
      {profile.role === "viewer" ? (
        <p className="text-sm text-ink-500">{l("Seuls les recruteurs et administrateurs peuvent commander.", "Enkel recruiters en beheerders kunnen bestellen.")}</p>
      ) : (
        <FlashOrderForm
          drafts={free}
          preselectOfferId={offre}
          initialQty={Math.min(50, Math.max(1, parseInt(qty ?? "1", 10) || 1))}
          defaults={{
            company_name: (org?.name as string) ?? "", vat_number: (org?.vat_number as string) ?? "", address: (org?.address as string) ?? "",
            city: (org?.city as string) ?? "", email: (org?.email as string) ?? (profile.email as string) ?? "",
            contact: (profile.full_name as string) ?? "",
          }}
        />
      )}
    </div>
  );
}
