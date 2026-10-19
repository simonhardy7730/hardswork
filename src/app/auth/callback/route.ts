import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // If a specific `next` was provided, honour it
      if (next && next.startsWith("/") && !next.startsWith("//")) return NextResponse.redirect(`${origin}${next}`);

      // Sinon : espace déterminé côté serveur à partir de la base
      return NextResponse.redirect(`${origin}/auth/redirect`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
