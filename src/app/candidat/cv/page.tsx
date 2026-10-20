import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLang } from "@/lib/i18n/server";
import { asCv } from "@/lib/candidate/cv";
import { tradeLabel } from "@/lib/candidate/trades";
import { labels } from "@/lib/utils";
import CvBuilder from "@/components/candidat/CvBuilder";

export const metadata = { title: "Mon CV", robots: { index: false, follow: false } };

export default async function CvPage() {
  const lang = await getLang();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: c } = await supabase
    .from("candidates")
    .select("first_name, last_name, phone, email, city, postal_code, licenses, languages, has_caces, caces_types, experience_years, availability, sectors")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!c) redirect("/candidat/dashboard");
  // Colonnes de la migration 031 lues à part : la page reste utilisable si elle n'est pas encore appliquée.
  const { data: extra } = await supabase.from("candidates").select("trades, trade_other, cv_data").eq("auth_user_id", user.id).maybeSingle();
  const ex = (extra ?? {}) as { trades?: string[]; trade_other?: string | null; cv_data?: unknown };
  const LB = labels(lang);

  const base = {
    name: `${c.first_name ?? ""} ${c.last_name && c.last_name !== "-" ? c.last_name : ""}`.trim(),
    phone: (c.phone as string) ?? "",
    email: (c.email as string) ?? "",
    city: [c.postal_code, c.city].filter(Boolean).join(" "),
    trades: [...(ex.trades ?? []).map((k) => tradeLabel(k, lang)), ...(ex.trade_other ? [ex.trade_other] : [])],
    sectors: ((c.sectors as string[]) ?? []).map((k) => LB.sector[k] ?? k),
    licenses: (c.licenses as string[]) ?? [],
    caces: c.has_caces ? ((c.caces_types as string[]) ?? []) : [],
    languages: (c.languages as string[]) ?? [],
    experienceYears: (c.experience_years as number | null) ?? null,
    availability: LB.availability?.[c.availability as string] ?? "",
  };

  return <CvBuilder base={base} initial={asCv(ex.cv_data)} canSave={extra !== null} />;
}
