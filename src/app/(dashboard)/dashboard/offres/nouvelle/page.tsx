import NouvelleOffreForm from "@/components/offres/NouvelleOffreForm";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getL } from "@/lib/i18n/server";

export default async function NouvelleOfrePage() {
  const l = getL();
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
        <h1 className="text-xl font-bold text-[#101F43]">
          {l("Créer une offre d'emploi", "Een vacature aanmaken")}
        </h1>
        <p className="text-sm text-ink-500 mt-0.5">
          {l("Remplissez les 3 étapes pour publier votre offre.", "Vul de 3 stappen in om uw vacature te publiceren.")}
        </p>
      </div>
      <NouvelleOffreForm
        organizationId={profile.organization_id}
        userId={user.id}
      />
    </div>
  );
}
