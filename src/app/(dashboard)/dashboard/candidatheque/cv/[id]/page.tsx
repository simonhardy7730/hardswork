import { notFound, redirect } from "next/navigation";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getLang } from "@/lib/i18n/server";
import { poolEnabled } from "@/lib/candidate/pool";
import { asCv } from "@/lib/candidate/cv";
import { cvFilled, findPoolCvs, loadMiniDoc } from "@/lib/candidate/pool-cv";
import { tradeLabel } from "@/lib/candidate/trades";
import { labels } from "@/lib/utils";
import CvSheet, { CV_PRINT_CSS } from "@/components/candidat/CvSheet";
import PrintButton from "@/components/dashboard/PrintButton";

export const metadata = { title: "CV candidat", robots: { index: false, follow: false } };

/** CV créé sur Wolko, consulté par un recruteur abonné (accès vérifié et journalisé par reveal_candidate_contact). */
export default async function PoolCvPage(props: { params: Promise<{ id: string }> }) {
  if (!poolEnabled()) notFound();
  const { id } = await props.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const lang = await getLang();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { error } = await supabase.rpc("reveal_candidate_contact", { p_candidate_id: id });
  if (error) /no_access/.test(error.message ?? "") ? redirect("/dashboard/candidatheque") : notFound();

  const db = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: c } = await db.from("candidates")
    .select("first_name, last_name, phone, email, city, postal_code, licenses, languages, has_caces, caces_types, experience_years, availability, sectors, trades, trade_other, cv_data")
    .eq("id", id).maybeSingle();
  if (!c) notFound();
  const LB = labels(lang);
  const base = {
    name: `${c.first_name ?? ""} ${c.last_name && c.last_name !== "-" ? c.last_name : ""}`.trim(),
    phone: (c.phone as string) ?? "",
    email: (c.email as string) ?? "",
    city: [c.postal_code, c.city].filter(Boolean).join(" "),
    trades: [...((c.trades as string[]) ?? []).map((k) => tradeLabel(k, lang)), ...(c.trade_other ? [c.trade_other as string] : [])],
    sectors: ((c.sectors as string[]) ?? []).map((k) => LB.sector[k] ?? k),
    licenses: (c.licenses as string[]) ?? [],
    caces: c.has_caces ? ((c.caces_types as string[]) ?? []) : [],
    languages: (c.languages as string[]) ?? [],
    experienceYears: (c.experience_years as number | null) ?? null,
    availability: LB.availability?.[c.availability as string] ?? "",
  };
  let cv = asCv(c.cv_data);
  if (!cvFilled(cv)) {
    const found = (await findPoolCvs([id])).get(id);
    const doc = found?.kind === "file" ? await loadMiniDoc(found.path) : null;
    if (doc) cv = doc.cv;
  }
  return (
    <div className="max-w-3xl space-y-4">
      <style>{CV_PRINT_CSS}</style>
      <div className="flex items-center justify-between gap-3 print:hidden">
        <a href="/dashboard/candidatheque" className="text-sm font-semibold underline">← {lang === "nl" ? "Kandidatenbank" : "Candidathèque"}</a>
        <PrintButton label={lang === "nl" ? "Downloaden (pdf)" : "Télécharger (PDF)"} />
      </div>
      <p className="text-xs text-ink-500 print:hidden">{lang === "nl"
        ? "Cv gemaakt door Wolko met de gegevens die de kandidaat zelf invulde (geen AI, niets toegevoegd)."
        : "CV créé par Wolko avec les informations remplies par le candidat lui-même (sans IA, rien d'inventé)."}</p>
      <div className="overflow-x-auto"><CvSheet base={base} cv={cv} /></div>
    </div>
  );
}
