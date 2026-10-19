import Link from "next/link";
import { getL } from "@/lib/i18n/server";
import type { Access } from "@/lib/billing/pricing";

/** Bandeau d'essai / d'abonnement du tableau de bord (rendu côté serveur, date du serveur). */
export default async function TrialBanner({ access }: { access: Access }) {
  const l = await getL();
  if (access.state === "active" || access.state === "cancelled_running") return null;

  const end = access.trialEndsAt
    ? access.trialEndsAt.toLocaleDateString(l("fr-BE", "nl-BE"), { day: "numeric", month: "long", year: "numeric" })
    : null;
  const expired = access.state !== "trial";

  return (
    <div
      className={`px-6 py-3 text-sm flex flex-wrap items-center justify-between gap-3 border-b ${
        expired ? "bg-red-50 border-red-200 text-red-800" : "bg-[#FFF7DD] border-[#FFE29A] text-[#6B4A00]"
      }`}
      data-testid="trial-banner"
    >
      <p className="font-medium">
        {expired
          ? l(
              "Votre essai gratuit est terminé. Vos données sont conservées. Choisissez un abonnement pour continuer à publier et à contacter les candidats.",
              "Je gratis proefperiode is afgelopen. Je gegevens blijven bewaard. Kies een abonnement om te blijven publiceren en kandidaten te contacteren."
            )
          : l(
              `Essai gratuit : ${access.trialDaysLeft} jour${access.trialDaysLeft > 1 ? "s" : ""} restant${access.trialDaysLeft > 1 ? "s" : ""}${end ? ` (fin le ${end})` : ""}.`,
              `Gratis proef: nog ${access.trialDaysLeft} ${access.trialDaysLeft > 1 ? "dagen" : "dag"}${end ? ` (einde op ${end})` : ""}.`
            )}
      </p>
      <Link
        href="/dashboard/settings"
        className="shrink-0 bg-brand hover:bg-brand-dark text-[#101F43] font-bold px-4 py-1.5 rounded-lg text-xs transition"
      >
        {l("Choisir mon abonnement", "Mijn abonnement kiezen")}
      </Link>
    </div>
  );
}
