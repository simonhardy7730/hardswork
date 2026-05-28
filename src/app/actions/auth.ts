"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Email ou mot de passe incorrect." };
  }

  redirect("/dashboard");
}

export async function signInWithMagicLink(formData: FormData) {
  const email = formData.get("email") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: "Impossible d'envoyer le lien. Réessayez." };
  }

  return { success: "Lien envoyé ! Vérifiez votre boîte mail." };
}

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;
  const orgType = formData.get("org_type") as "agency" | "company";
  const orgName = formData.get("org_name") as string;

  const supabase = await createClient();

  // Créer le compte auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (authError || !authData.user) {
    return { error: authError?.message ?? "Erreur lors de l'inscription." };
  }

  // Créer l'organisation
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({ name: orgName, type: orgType })
    .select()
    .single();

  if (orgError || !org) {
    return { error: "Erreur lors de la création de l'organisation." };
  }

  // Créer le profil utilisateur
  const { error: userError } = await supabase.from("users").insert({
    id: authData.user.id,
    organization_id: org.id,
    email,
    full_name: fullName,
    role: "admin",
  });

  if (userError) {
    return { error: "Erreur lors de la création du profil." };
  }

  // Créer l'abonnement trial
  await supabase.from("subscriptions").insert({
    organization_id: org.id,
    plan: orgType === "agency" ? "agency" : "starter",
    status: "trial",
    trial_ends_at: new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toISOString(),
  });

  redirect("/onboarding");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
