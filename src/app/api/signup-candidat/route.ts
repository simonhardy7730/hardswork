import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sanitizePreferences } from "@/lib/candidate/preferences";
import { allow, clientKey } from "@/lib/security/abuse";
import { VISIBILITY_CONSENT_VERSION } from "@/lib/candidate/visibility";
import { ageFromBirthDate, MIN_AGE, ADULT_AGE } from "@/lib/candidate/age";

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
      preferences,
      visible_to_recruiters,
      birth_date,
    } = body;

    // Validation stricte (tout vient du navigateur, donc rien n'est de confiance).
    const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
    const cleanEmail = str(email, 254).toLowerCase();
    const cleanPhone = str(phone, 25);
    const cleanFirst = str(first_name, 80);
    if (
      typeof auth_user_id !== "string" || !/^[0-9a-f-]{36}$/i.test(auth_user_id) ||
      !cleanFirst || !/^[+\d][\d\s().\-/]{6,24}$/.test(cleanPhone) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      return NextResponse.json({ error: "Champs requis manquants ou invalides" }, { status: 400 });
    }

    // Date de naissance obligatoire : 15 ans minimum (le profil mineur n'est jamais dans la candidathèque).
    const birth = typeof birth_date === "string" ? birth_date : "";
    const age = ageFromBirthDate(birth);
    if (age === null || age < MIN_AGE) {
      return NextResponse.json({ error: "age", min: MIN_AGE }, { status: 400 });
    }

    // L'identifiant doit correspondre à un compte candidat tout juste créé avec CET e-mail :
    // on ne peut pas créer ou usurper le profil d'un autre compte.
    const admin = supabaseAdmin();
    if (!(await allow(admin, `signup-cand:${clientKey(req)}:1h`, 3600, 10))) {
      return NextResponse.json({ error: "Trop de tentatives. Réessayez plus tard." }, { status: 429 });
    }
    const { data: au, error: auErr } = await admin.auth.admin.getUserById(auth_user_id);
    const authUser = au?.user;
    const fresh = authUser ? Date.now() - new Date(authUser.created_at).getTime() < 30 * 60 * 1000 : false;
    if (
      auErr || !authUser || !fresh ||
      (authUser.email ?? "").toLowerCase() !== cleanEmail ||
      authUser.user_metadata?.user_type !== "candidate"
    ) {
      return NextResponse.json({ error: "Requête refusée" }, { status: 403 });
    }

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
      first_name: cleanFirst,
      last_name: str(last_name, 80) || "-",
      phone: cleanPhone,
      email: cleanEmail,
      city: str(city, 80) || null,
      availability: ["immediate", "1_semaine", "1_mois"].includes(availability) ? availability : "immediate",
      licenses: Array.isArray(licenses) ? licenses.filter((x: unknown) => typeof x === "string").slice(0, 10) : [],
      has_caces: has_caces || false,
      caces_types: Array.isArray(caces_types) ? caces_types.filter((x: unknown) => typeof x === "string").slice(0, 10) : [],
      experience_years: experience_years ? parseInt(experience_years) : null,
      sectors: Array.isArray(sectors) ? sectors.filter((x: unknown) => typeof x === "string").slice(0, 12) : [],
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

    // Date de naissance (migration 016) : enregistrée à part ; l'inscription ne doit pas échouer si la colonne manque encore.
    const { error: bErr } = await admin.from("candidates").update({ birth_date: birth }).eq("id", data.id);
    if (bErr) console.error("birth_date not stored (migration 016 ?):", bErr.message);

    // Accord de visibilité (migration 016) : case facultative, décochée par défaut ; l'inscription ne dépend jamais de lui.
    if (visible_to_recruiters === true && age >= ADULT_AGE) {
      const { error: vErr } = await admin
        .from("candidates")
        .update({ visible_to_recruiters: true, visibility_consent_at: new Date().toISOString(), visibility_consent_version: VISIBILITY_CONSENT_VERSION })
        .eq("id", data.id);
      if (vErr) console.error("visibility consent not stored (migration 016 ?):", vErr.message);
    }

    return NextResponse.json({ success: true, candidateId: data.id });
  } catch (err) {
    console.error("Signup candidat API error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
