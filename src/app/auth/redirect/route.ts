import { NextResponse } from "next/server";
import { getSpace, SPACE_HOME } from "@/lib/auth/space";

/** Redirige l'utilisateur connecté vers son espace (candidat / entreprise / agence). */
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const space = await getSpace();
  return NextResponse.redirect(`${origin}${SPACE_HOME[space]}`);
}
