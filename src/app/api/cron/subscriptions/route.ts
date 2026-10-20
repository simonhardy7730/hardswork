import { NextResponse } from "next/server";
import { runApplicationReminders } from "@/lib/email/application-reminder";
import { runMatchingAlerts } from "@/lib/email/matching-alerts";
import { adminClient, runSubscriptionLifecycle, runFlashLifecycle } from "@/lib/billing/lifecycle";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Appelée chaque jour par Vercel Cron (en-tête Authorization: Bearer CRON_SECRET). Fermée si CRON_SECRET est absent. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const db = adminClient();
    const stats = await runSubscriptionLifecycle(db);
    const flash = await runFlashLifecycle(db).catch((e) => { console.error('flash lifecycle', e); return { errors: 1 }; });
    const reminders = await runApplicationReminders(db).catch((e) => { console.error('app reminders', e); return { errors: 1 }; });
    const matching = await runMatchingAlerts(db).catch((e) => { console.error('matching alerts', e); return { errors: 1 }; });
    return NextResponse.json({ ok: true, ...stats, flash, reminders, matching });
  } catch (e) {
    console.error("cron subscriptions:", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
