import { NextResponse } from "next/server";
import { getSpace, SPACE_HOME } from "@/lib/auth/space";
import { createClient } from "@/lib/supabase/server";
import { sendWelcomeIfPending } from "@/lib/email/welcome";

/** Redirige l'utilisateur connecté vers son espace (candidat / entreprise / agence). */
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const space = await getSpace();
  // Rattrapage : envoi (ou nouvelle tentative contrôlée) de l'email de bienvenue si encore en attente.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) await sendWelcomeIfPending(user.id);
  return NextResponse.redirect(`${origin}${SPACE_HOME[space]}`);
}
