import NouvelleOffreForm from "@/components/offres/NouvelleOffreForm";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function NouvelleOfrePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single();
  if (!profile) redirect("/onboarding");

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#0F0E0D]">
          Créer une offre d&apos;emploi
        </h1>
        <p className="text-sm text-ink-500 mt-0.5">
          Remplissez les 3 étapes pour publier votre offre.
        </p>
      </div>
      <NouvelleOffreForm
        organizationId={profile.organization_id}
        userId={user.id}
      />
    </div>
  );
}
