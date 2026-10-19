import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sanitizePreferences } from "@/lib/candidate/preferences";

const supabaseAdmin = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      auth_user_id,
      first_name,
      last_name,
      phone,
      email,
      city,
      postal_code,
      availability,
      licenses,
      has_caces,
      caces_types,
      experience_years,
      sectors,
      cv_url,
      preferences,
    } = body;

    if (!auth_user_id || !first_name || !phone || !email) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    const admin = supabaseAdmin();

    // Vérifier que cet auth_user_id n'a pas déjà un profil
    const { data: existing } = await admin
      .from("candidates")
      .select("id")
      .eq("auth_user_id", auth_user_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Profil déjà existant" }, { status: 409 });
    }

    const row = {
      auth_user_id,
      first_name,
      last_name: last_name || "-",
      phone,
      email,
      city: city || null,
      availability: availability || "immediate",
      licenses: licenses || [],
      has_caces: has_caces || false,
      caces_types: caces_types || [],
      experience_years: experience_years ? parseInt(experience_years) : null,
      sectors: sectors || [],
      notes: cv_url || null,
      status: "actif",
      organization_id: null,
    };

    // postal_code : colonne ajoutée par la migration 004 ; tant qu'elle n'est pas appliquée,
    // on enregistre le profil sans (aucune inscription ne doit échouer à cause de ça).
    // Préférences (migration 008) : même principe, l'inscription ne doit jamais échouer à cause d'elles.
    const prefs = sanitizePreferences(preferences);
    let { data, error } = await admin
      .from("candidates")
      .insert({ ...row, postal_code: postal_code || null, ...prefs })
      .select()
      .single();
    if (error && /job_types|is_student|student_profile|flexi_|eligibility/.test(error.message ?? "")) {
      ({ data, error } = await admin
        .from("candidates")
        .insert({ ...row, postal_code: postal_code || null })
        .select()
        .single());
    }
    if (error && /postal_code/.test(error.message ?? "")) {
      ({ data, error } = await admin.from("candidates").insert(row).select().single());
    }

    if (error) {
      console.error("Candidate insert error:", error);
      return NextResponse.json({ error: "Erreur lors de la création du profil" }, { status: 500 });
    }

    return NextResponse.json({ success: true, candidateId: data.id });
  } catch (err) {
    console.error("Signup candidat API error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
