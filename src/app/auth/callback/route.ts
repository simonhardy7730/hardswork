import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // If a specific `next` was provided, honour it
      if (next) return NextResponse.redirect(`${origin}${next}`);

      // Otherwise route by user_type stored in metadata
      const userType = data.user?.user_metadata?.user_type;
      const destination = userType === "candidate" ? "/candidat/dashboard" : "/dashboard";
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
