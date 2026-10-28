"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isValidVat, normalizeVat } from "@/lib/vat";
import { getLang } from "@/lib/i18n/server";
import { friendlyAuthError } from "@/lib/auth-errors";
import { notifyNewSignup } from "@/app/actions/signup-notify";

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Email ou mot de passe incorrect." };
  }

  redirect("/auth/redirect");
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
  const vatRaw = ((formData.get("vat_number") as string) ?? "").trim();
  // Exception : les adresses internes de Wolko (variable INTERNAL_SIGNUP_EMAILS, séparées par des virgules) peuvent créer
  // leur propre compte sans numéro de TVA tant que la société n'existe pas. Le champ reste vide, jamais inventé.
  const internal = (process.env.INTERNAL_SIGNUP_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  const isInternal = vatRaw === "" && internal.includes((email ?? "").trim().toLowerCase());
  if (!isInternal && !isValidVat(vatRaw)) return { error: "Numéro de TVA invalide. Exemple : BE 0123.456.749" };
  const vatNumber = isInternal ? "" : normalizeVat(vatRaw);
  // Jeton Turnstile : transmis à Supabase, qui le vérifie si la protection CAPTCHA est activée (Authentication > Attack Protection).
  const captchaToken = ((formData.get("captcha_token") as string) ?? "") || undefined;

  const supabase = await createClient();

  // Créer le compte auth. L'organisation, le profil admin et l'essai gratuit sont créés
  // CÔTÉ BASE (trigger sécurisé, migration 012) à partir de ces métadonnées : jamais depuis le navigateur.
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, signup_kind: "organization", lang: await getLang(), org_name: orgName, org_type: orgType, vat_number: vatNumber },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      captchaToken,
    },
  });

  if (authError || !authData.user) {
    const nl = await getLang() === "nl";
    return { error: friendlyAuthError(authError?.message, (fr, n) => (nl ? n : fr)) };
  }

  await notifyNewSignup(orgName);

  // Sans session (confirmation e-mail activée) : on demande de confirmer l'adresse.
  if (!authData.session) {
    return { success: "Compte créé ! Vérifiez votre boîte mail et cliquez sur le lien pour confirmer votre adresse." };
  }
  redirect("/onboarding");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
