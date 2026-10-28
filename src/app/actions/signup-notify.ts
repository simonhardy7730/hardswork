"use server";

import { adminClient } from "@/lib/billing/lifecycle";
import { sendSignupNotify } from "@/lib/email/signup-notify";

/**
 * Appelée juste après l'inscription d'une société ou d'une agence. N'envoie rien si l'organisation n'existe pas
 * en base, a plus de 15 minutes, ou a déjà été signalée : impossible de s'en servir pour spammer l'équipe.
 */
export async function notifyNewSignup(orgName: string): Promise<void> {
  try {
    const name = (orgName ?? "").trim().slice(0, 200);
    if (!name) return;
    const db = adminClient();
    const since = new Date(Date.now() - 15 * 60_000).toISOString();
    const { data: org } = await db.from("organizations").select("id, name, type, vat_number, city").eq("name", name).gte("created_at", since).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!org) return;
    const { data: seen } = await db.from("subscription_events").select("id").eq("organization_id", org.id).eq("event_type", "signup_notified").limit(1).maybeSingle();
    if (seen) return;
    await db.from("subscription_events").insert({ organization_id: org.id, event_type: "signup_notified", details: {} });
    await sendSignupNotify({ name: org.name as string, type: org.type as string, vat: (org.vat_number as string | null) ?? null, city: (org.city as string | null) ?? null });
  } catch (e) {
    console.error("notifyNewSignup", e);
  }
}
