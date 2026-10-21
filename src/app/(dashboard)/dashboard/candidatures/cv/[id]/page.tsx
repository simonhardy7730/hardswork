import { notFound } from "next/navigation";
import { getLang } from "@/lib/i18n/server";
import { getMiniCv } from "@/app/(dashboard)/dashboard/candidatures/actions";
import CvSheet, { CV_PRINT_CSS } from "@/components/candidat/CvSheet";
import PrintButton from "@/components/dashboard/PrintButton";

export const metadata = { title: "CV du candidat", robots: { index: false, follow: false } };

/** CV créé par Wolko à partir des réponses du candidat (« je n'ai pas de CV »). */
export default async function ApplicationMiniCvPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const lang = await getLang();
  const doc = await getMiniCv(id);
  if (!doc) notFound();
  return (
    <div className="max-w-3xl space-y-4">
      <style>{CV_PRINT_CSS}</style>
      <div className="flex items-center justify-between gap-3 flex-wrap print:hidden">
        <a href="/dashboard/candidatures" className="text-sm font-semibold underline">← {lang === "nl" ? "Sollicitaties" : "Candidatures"}</a>
        <PrintButton label={lang === "nl" ? "Downloaden (pdf)" : "Télécharger (PDF)"} />
      </div>
      <p className="text-xs text-ink-500 print:hidden">{lang === "nl"
        ? "Deze kandidaat had geen cv: Wolko maakte het met zijn antwoorden (geen AI, niets toegevoegd)."
        : "Ce candidat n'avait pas de CV : Wolko l'a créé avec ses réponses (sans IA, rien d'inventé)."}</p>
      <div className="overflow-x-auto"><CvSheet base={doc.base} cv={doc.cv} /></div>
    </div>
  );
}
