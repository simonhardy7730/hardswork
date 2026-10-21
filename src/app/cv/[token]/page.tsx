import Link from "next/link";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { readCvToken } from "@/lib/candidate/cv-link";
import { getLang } from "@/lib/i18n/server";
import { SiteNav } from "@/components/layout/SiteNav";
import CvDrop from "@/components/candidature/CvDrop";

export const metadata = { title: "Ajouter mon CV — Wolko", robots: { index: false, follow: false } };

export default async function CvLinkPage(props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params;
  const lang = await getLang();
  const l = (fr: string, nl: string) => (lang === "nl" ? nl : fr);
  const appId = readCvToken(decodeURIComponent(token));
  let first = "", title = "", hidden = false, hasCv = false;
  if (appId) {
    const db = createAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const [{ data: app }, { data: req }] = await Promise.all([
      db.from("applications").select("applicant_name, job_offers(title)").eq("id", appId).maybeSingle(),
      db.from("cv_requests").select("status").eq("application_id", appId).maybeSingle(),
    ]);
    if (!app) hidden = true;
    first = String(app?.applicant_name ?? "").trim().split(/\s+/)[0] ?? "";
    const j = Array.isArray(app?.job_offers) ? app?.job_offers[0] : app?.job_offers;
    title = (j as { title?: string } | null)?.title ?? "";
    hasCv = req?.status === "fulfilled";
  }
  return (
    <div className="min-h-screen bg-[#FFFBF2]">
      <SiteNav />
      <div className="pt-[84px] px-4 pb-16 max-w-md mx-auto space-y-5">
        {!appId || hidden ? (
          <div className="bg-white border border-ink-100 rounded-2xl p-6 text-center space-y-3">
            <p className="font-bold text-ink">{l("Ce lien a expiré.", "Deze link is verlopen.")}</p>
            <Link href="/signup/candidat" className="btn-brand inline-flex">{l("Créer mon profil gratuit", "Gratis profiel maken")}</Link>
          </div>
        ) : (
          <>
            <div>
              <h1 className="font-display font-black text-ink uppercase text-2xl leading-tight">{first ? `${l("Salut", "Hallo")} ${first} 👋` : l("Salut 👋", "Hallo 👋")}</h1>
              <p className="text-sm text-ink-500 mt-1">
                {title ? l(`Ajoute ton CV à ta candidature « ${title} ».`, `Voeg je cv toe aan je sollicitatie « ${title} ».`) : l("Ajoute ton CV à ta candidature.", "Voeg je cv toe aan je sollicitatie.")}
                {hasCv && ` ${l("(Tu en as déjà envoyé un : le nouveau le remplacera.)", "(Je stuurde er al een: het nieuwe vervangt het.)")}`}
              </p>
            </div>
            <CvDrop token={decodeURIComponent(token)} compact />
            <p className="text-xs text-ink-500">{l("Pas de CV ? Crée-le gratuitement en 3 minutes :", "Geen cv? Maak het gratis in 3 minuten:")} <Link href="/signup/candidat" className="underline font-bold">{l("créer mon profil Wolko", "mijn Wolko-profiel maken")}</Link>.</p>
          </>
        )}
      </div>
    </div>
  );
}
