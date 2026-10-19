import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resend, FROM_EMAIL, FROM_NAME } from "@/lib/resend";
import { render } from "@react-email/render";
import CandidatureConfirmationEmail from "@/emails/CandidatureConfirmation";
import NouvelleCandiatureRecruteurEmail from "@/emails/NouvelleCandiatureRecruteur";
import { allow, clientKey, verifyTurnstile } from "@/lib/security/abuse";

export async function POST(req: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  try {
    const body = await req.json();

    // Anti-bot (Cloudflare Turnstile) : actif dès que TURNSTILE_SECRET_KEY est défini.
    if (!(await verifyTurnstile(body?.turnstile_token, req))) {
      return NextResponse.json({ error: "Vérification anti-robot échouée. Rechargez la page." }, { status: 400 });
    }

    // Limitation de débit : 5 candidatures / 10 min et 20 / jour par visiteur.
    const who = clientKey(req);
    if (!(await allow(supabaseAdmin, `apply:${who}:10m`, 600, 5)) || !(await allow(supabaseAdmin, `apply:${who}:1d`, 86400, 20))) {
      return NextResponse.json({ error: "Trop de tentatives. Réessayez plus tard." }, { status: 429 });
    }

    // Validation stricte côté serveur : rien de ce qui vient du navigateur n'est de confiance.
    const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
    const list = (v: unknown, max: number) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.length <= 20).slice(0, max) : []);
    const job_offer_id = str(body?.job_offer_id, 40);
    const applicant_name = str(body?.applicant_name, 120);
    const applicant_phone = str(body?.applicant_phone, 25);
    const applicant_email = str(body?.applicant_email, 254).toLowerCase();
    const availability = ["immediate", "1_semaine", "1_mois"].includes(body?.availability) ? body.availability : "immediate";
    const licenses = list(body?.licenses, 10);
    const has_caces = body?.has_caces === true;
    const caces_types = list(body?.caces_types, 10);
    const cover_message = str(body?.cover_message, 300);
    const quick_apply = body?.quick_apply === true;

    const DAY_OK = ["mon", "tue", "wed", "thu", "fri", "sat", "sun", "holiday"];
    const SLOT_OK = ["morning", "afternoon", "evening", "night"];
    const slotsClean: string[] = Array.from(new Set(list(body?.availability_slots, 40).filter((s) => {
      const [d, t] = s.split(":");
      return DAY_OK.includes(d) && SLOT_OK.includes(t);
    })));

    if (
      !/^[0-9a-f-]{36}$/i.test(job_offer_id) ||
      applicant_name.length < 2 ||
      !/^[+\d][\d\s().\-/]{6,24}$/.test(applicant_phone) ||
      (applicant_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(applicant_email))
    ) {
      return NextResponse.json({ error: "Champs requis manquants ou invalides" }, { status: 400 });
    }

    // Fetch job offer + org email
    const { data: jobData, error: jobError } = await supabaseAdmin
      .from("job_offers")
      .select("*, organizations(name, email)")
      .eq("id", job_offer_id)
      .eq("status", "active")
      .single();

    if (jobError || !jobData) {
      return NextResponse.json({ error: "Offre introuvable" }, { status: 404 });
    }

    // Déjà candidaté à cette offre (même téléphone ou même e-mail) : refus automatique, rien n'est créé ni envoyé.
    const { data: dupPhone } = await supabaseAdmin
      .from("applications").select("id").eq("job_offer_id", job_offer_id).eq("applicant_phone", applicant_phone).limit(1);
    const dupEmail = applicant_email
      ? (await supabaseAdmin.from("applications").select("id").eq("job_offer_id", job_offer_id).ilike("applicant_email", applicant_email).limit(1)).data
      : null;
    if ((dupPhone && dupPhone.length > 0) || (dupEmail && dupEmail.length > 0)) {
      return NextResponse.json({ error: "already_applied" }, { status: 409 });
    }

    // Insert application
    const baseRow = {
        job_offer_id,
        applicant_name,
        applicant_phone,
        applicant_email: applicant_email || null,
        availability: availability || "immediate",
        licenses: licenses || [],
        has_caces: has_caces || false,
        caces_types: caces_types || [],
        cover_message: cover_message || null,
        status: "nouveau",
    };
    let { data: application, error: insertError } = await supabaseAdmin
      .from("applications")
      .insert((quick_apply ? { ...baseRow, availability_slots: slotsClean, interest_confirmed: true, quick_apply: true } : baseRow) as typeof baseRow)
      .select()
      .single();
    // Migration 011 pas encore appliquée : on enregistre sans les nouveaux champs.
    if (insertError && quick_apply && /availability_slots|interest_confirmed|quick_apply/.test(insertError.message ?? "")) {
      ({ data: application, error: insertError } = await supabaseAdmin.from("applications").insert(baseRow).select().single());
    }

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json(
        { error: "Erreur lors de la candidature" },
        { status: 500 }
      );
    }

    const orgRaw = jobData.organizations;
    const org = Array.isArray(orgRaw) ? orgRaw[0] : orgRaw;
    const orgName: string = org?.name ?? "Wolko";
    const orgEmail: string | undefined = org?.email;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://wolko.be";
    const dashboardUrl = `${appUrl}/dashboard/offres/${job_offer_id}/candidatures`;

    // Les emails ne doivent jamais faire perdre une candidature : elle est déjà enregistrée.
    // On les attend (pour qu'ils partent réellement sur Vercel) mais on tolère leur échec.
    const sends: Promise<unknown>[] = [];

    if (orgEmail) {
      sends.push(resend.emails
        .send({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to: orgEmail,
          subject: `🔔 Nouvelle candidature — ${applicant_name} pour ${jobData.title}`,
          html: await render(
            NouvelleCandiatureRecruteurEmail({
              candidateName: applicant_name,
              candidatePhone: applicant_phone,
              candidateEmail: applicant_email,
              jobTitle: jobData.title,
              jobCity: jobData.city,
              availability: availability || "immediate",
              licenses: licenses || [],
              hasCaces: has_caces || false,
              cacesTypes: caces_types || [],
              coverMessage: cover_message,
              orgName,
              dashboardUrl,
            })
          ),
        })
        .catch((err: unknown) => console.error("Recruiter email error:", err)));
    }

    // Send candidate confirmation if email provided
    if (applicant_email) {
      sends.push(resend.emails
        .send({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to: applicant_email,
          subject: `✅ Candidature reçue — ${jobData.title} chez ${orgName}`,
          html: await render(
            CandidatureConfirmationEmail({
              candidateName: applicant_name,
              jobTitle: jobData.title,
              jobCity: jobData.city,
              orgName,
              availability: availability || "immediate",
            })
          ),
        })
        .catch((err: unknown) => console.error("Candidate email error:", err)));
    }

    await Promise.allSettled(sends);

    return NextResponse.json({ success: true, applicationId: application.id });
  } catch (err) {
    console.error("Postuler API error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
