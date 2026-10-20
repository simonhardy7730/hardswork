import NouvelleOffreForm from "@/components/offres/NouvelleOffreForm";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { getL } from "@/lib/i18n/server";

export default async function ModifierOffrePage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const l = await getL();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("users").select("organization_id").eq("id", user.id).single();
  if (!profile) redirect("/onboarding");

  // L'offre doit appartenir à l'organisation de l'utilisateur.
  const { data: offer } = await supabase
    .from("job_offers").select("*").eq("id", id).eq("organization_id", profile.organization_id).single();
  if (!offer) notFound();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#101F43]">{l("Modifier l'annonce", "Vacature bewerken")}</h1>
        <p className="text-sm text-ink-500 mt-0.5">
          {l("Les changements s'appliquent tout de suite. Les candidatures déjà reçues sont conservées.", "Wijzigingen gelden meteen. Reeds ontvangen sollicitaties blijven bewaard.")}
        </p>
      </div>
      <NouvelleOffreForm organizationId={profile.organization_id} userId={user.id} offer={offer} />
    </div>
  );
}
