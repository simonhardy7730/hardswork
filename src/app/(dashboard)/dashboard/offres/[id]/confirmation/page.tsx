import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Check, Copy, ArrowRight, Users } from "lucide-react";
import QRCodeDisplay from "@/components/offres/QRCodeDisplay";
import { labels } from "@/lib/utils";
import { getLang } from "@/lib/i18n/server";

export default async function ConfirmationPage(
  props: {
    params: Promise<{ id: string }>;
  }
) {
  const params = await props.params;
  const lang = await getLang();
  const l = (fr: string, nl: string) => (lang === "nl" ? nl : fr);
  const { contract: CONTRACT_LABELS, sector: SECTOR_LABELS } = labels(lang);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: offre } = await supabase
    .from("job_offers")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!offre) notFound();

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://wolko.be";
  const candidatureUrl = `${appUrl}/postuler/${offre.id}`;

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white rounded-xl border border-ink-100 overflow-hidden">
        {/* Header succès */}
        <div className="bg-gradient-to-r from-brand to-[#3B82F6] px-6 py-8 text-white text-center">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Check size={28} />
          </div>
          <h1 className="text-xl font-bold mb-1">
            {offre.status === "active"
              ? l("Offre publiée ! 🎉", "Vacature gepubliceerd! 🎉")
              : l("Brouillon enregistré", "Concept opgeslagen")}
          </h1>
          <p className="text-sm text-white/80">
            {offre.title} · {SECTOR_LABELS[offre.sector]} ·{" "}
            {CONTRACT_LABELS[offre.contract_type]} · {offre.city}
          </p>
        </div>

        <div className="p-6 space-y-5">
          {/* Lien de candidature */}
          <div>
            <p className="text-sm font-semibold text-[#101F43] mb-2">
              {"🔗 " + l("Lien de candidature", "Sollicitatielink")}
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2.5 bg-surface border border-ink-100 rounded-lg text-xs text-ink-500 font-mono truncate">
                {candidatureUrl}
              </div>
              <CopyButton url={candidatureUrl} />
            </div>
            <p className="text-xs text-ink-300 mt-1.5">
              {l("Partagez ce lien par email, WhatsApp, ou affichez-le sur un flyer.", "Deel deze link via e-mail, WhatsApp of toon hem op een flyer.")}
            </p>
          </div>

          {/* QR Code */}
          <div>
            <p className="text-sm font-semibold text-[#101F43] mb-3">
              {"📱 QR Code — " + l("à afficher en agence ou en usine", "om te tonen in het kantoor of de fabriek")}
            </p>
            <QRCodeDisplay url={candidatureUrl} title={offre.title} />
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-2 border-t border-ink-100">
            <Link
              href={`/dashboard/offres/${offre.id}/candidatures`}
              className="flex items-center justify-center gap-2 bg-brand text-white py-2.5 rounded-lg text-sm font-medium hover:bg-brand-dark transition"
            >
              <Users size={15} />
              {l("Voir les candidatures", "Sollicitaties bekijken")}
            </Link>
            <Link
              href="/dashboard/offres"
              className="flex items-center justify-center gap-2 border border-ink-100 text-ink-500 py-2.5 rounded-lg text-sm font-medium hover:bg-surface-2 transition"
            >
              {l("Retour aux offres", "Terug naar vacatures")}
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Composant client pour le bouton de copie
function CopyButton({ url }: { url: string }) {
  return (
    <button
      className="shrink-0 w-9 h-9 border border-ink-100 rounded-lg flex items-center justify-center text-ink-500 hover:bg-surface-2 transition"
      onClick={() => {}}
      data-url={url}
      id="copy-btn"
    >
      <Copy size={15} />
    </button>
  );
}
