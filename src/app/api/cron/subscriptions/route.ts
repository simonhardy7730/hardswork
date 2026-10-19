import { NextResponse } from "next/server";
import { adminClient, runSubscriptionLifecycle } from "@/lib/billing/lifecycle";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Appelée chaque jour par Vercel Cron (en-tête Authorization: Bearer CRON_SECRET). Fermée si CRON_SECRET est absent. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const stats = await runSubscriptionLifecycle(adminClient());
    return NextResponse.json({ ok: true, ...stats });
  } catch (e) {
    console.error("cron subscriptions:", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
