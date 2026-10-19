import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Sonde de santé : interroge réellement la base (garde le projet Supabase actif)
// et ne renvoie aucune donnée sensible.
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.json({ ok: false, error: "config" }, { status: 503 });
  }
  try {
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { error } = await supabase.from("job_offers").select("id", { head: true, count: "exact" }).limit(1);
    if (error) return NextResponse.json({ ok: false, error: "db" }, { status: 503 });
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, error: "db" }, { status: 503 });
  }
}
