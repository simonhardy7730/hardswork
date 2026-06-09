import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resend, FROM_EMAIL, FROM_NAME } from "@/lib/resend";
import { render } from "@react-email/render";
import CandidatureConfirmationEmail from "@/emails/CandidatureConfirmation";
import NouvelleCandiatureRecruteurEmail from "@/emails/NouvelleCandiatureRecruteur";

export async function POST(req: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  try {
    const body = await req.json();
    const {
      job_offer_id,
      applicant_name,
      applicant_phone,
      applicant_email,
      availability,
      licenses,
      has_caces,
      caces_types,
      cover_message,
    } = body;

    if (!job_offer_id || !applicant_name || !applicant_phone) {
      return NextResponse.json(
        { error: "Champs requis manquants" },
        { status: 400 }
      );
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

    // Insert application
    const { data: application, error: insertError } = await supabaseAdmin
      .from("applications")
      .insert({
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
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json(
        { error: "Erreur lors de la candidature" },
        { status: 500 }
      );
    }

    const orgRaw = jobData.organizations;
    const org = Array.isArray(orgRaw) ? orgRaw[0] : orgRaw;
    const orgName: string = org?.name ?? "HardSwork";
    const orgEmail: string | undefined = org?.email;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://hardswork.vercel.app";
    const dashboardUrl = `${appUrl}/dashboard/offres/${job_offer_id}/candidatures`;

    // Send recruiter notification (fire-and-forget, don't block response)
    if (orgEmail) {
      resend.emails
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
        .catch((err: unknown) => console.error("Recruiter email error:", err));
    }

    // Send candidate confirmation if email provided
    if (applicant_email) {
      resend.emails
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
        .catch((err: unknown) => console.error("Candidate email error:", err));
    }

    return NextResponse.json({ success: true, applicationId: application.id });
  } catch (err) {
    console.error("Postuler API error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
