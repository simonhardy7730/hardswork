import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/billing/lifecycle";
import { getDict } from "@/lib/i18n/server";
import AlertToggle from "@/components/candidat/AlertToggle";

export default async function AlertesPage() {
  const { lang } = await getDict();
  const l = (fr: string, nl: string) => (lang === "nl" ? nl : fr);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: row } = await adminClient().from("job_alerts").select("active").eq("user_id", user.id).maybeSingle();
  const { data: c } = await supabase.from("candidates").select("city, sectors").eq("auth_user_id", user.id).maybeSingle();
  const hasProfile = !!(c?.city || (c?.sectors as string[] | null)?.length);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display font-black text-ink uppercase leading-none" style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", letterSpacing: "-0.01em" }}>
          {l("Mes", "Mijn")} <span className="text-brand">[{l("alertes", "alerts")}].</span>
        </h1>
        <p className="text-ink-500 text-sm mt-1">{l("Reçois par e-mail les nouvelles offres qui correspondent à ton profil : tout de suite quand elles sont publiées près de chez toi, et un résumé chaque semaine.", "Ontvang per e-mail de nieuwe vacatures die bij je profiel passen: meteen bij publicatie in je buurt, en wekelijks een samenvatting.")}</p>
      </div>
      <div className="bg-white border border-ink-100 rounded-2xl p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 bg-surface rounded-xl flex items-center justify-center shrink-0"><Bell size={20} className="text-brand" /></div>
          <div>
            <h2 className="font-display font-black text-ink uppercase text-base">{l("Alertes emploi", "Jobalerts")}</h2>
            <p className="text-ink-500 text-sm leading-relaxed mt-1">
              {l("Les offres sont choisies avec ta ville, tes métiers et tes secteurs (alerte immédiate jusqu'à 30 km, résumé hebdomadaire jusqu'à 15 km), sans intelligence artificielle. Tu ne reçois un e-mail que s'il y a du nouveau, et tu peux te désinscrire en un clic.",
                "De vacatures worden gekozen op basis van je stad, beroepen en sectoren (directe alert tot 30 km, wekelijkse samenvatting tot 15 km), zonder AI. Je krijgt alleen een e-mail als er nieuws is, en je kunt je met één klik uitschrijven.")}
            </p>
          </div>
        </div>
        <AlertToggle initial={!!row?.active} email={user.email ?? ""} />
        {!hasProfile && (
          <p className="text-sm text-ink-500 mt-4">
            {l("Complète d'abord ta ville et tes secteurs pour recevoir des offres pertinentes : ", "Vul eerst je stad en sectoren aan om relevante vacatures te krijgen: ")}
            <Link href="/candidat/compte" className="underline text-ink">{l("mon profil", "mijn profiel")}</Link>
          </p>
        )}
      </div>
    </div>
  );
}
