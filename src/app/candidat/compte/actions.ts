"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sanitizePreferences } from "@/lib/candidate/preferences";

/** Enregistre les préférences du candidat connecté (jamais le statut d'éligibilité). */
export async function savePreferences(raw: unknown): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { error } = await supabase
    .from("candidates")
    .update(sanitizePreferences(raw))
    .eq("auth_user_id", user.id);

  if (error) {
    console.error("savePreferences:", error.message);
    return { ok: false };
  }
  revalidatePath("/candidat/compte");
  return { ok: true };
}

import { sanitizeAvailability, type AvailabilityState } from "@/lib/candidate/availability";

/** Remplace le calendrier de disponibilités du candidat connecté. */
export async function saveAvailability(raw: unknown): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { data: cand } = await supabase
    .from("candidates").select("id").eq("auth_user_id", user.id).maybeSingle();
  if (!cand) return { ok: false };

  const a: AvailabilityState = sanitizeAvailability(raw);
  const rows = [
    ...a.recurring.map((k) => {
      const [day_key, slot] = k.split(":");
      return { candidate_id: cand.id, kind: "recurring", day_key, slot };
    }),
    ...a.exceptions.map((e) => ({
      candidate_id: cand.id, kind: e.kind, date_from: e.date_from, date_to: e.date_to, note: e.note || null,
    })),
  ];

  const del = await supabase.from("candidate_availabilities").delete().eq("candidate_id", cand.id);
  if (del.error) { console.error("saveAvailability delete:", del.error.message); return { ok: false }; }
  if (rows.length) {
    const ins = await supabase.from("candidate_availabilities").insert(rows);
    if (ins.error) { console.error("saveAvailability insert:", ins.error.message); return { ok: false }; }
  }
  revalidatePath("/candidat/compte");
  return { ok: true };
}

import { VISIBILITY_CONSENT_VERSION } from "@/lib/candidate/visibility";

/** Accord (ou retrait) de visibilité auprès des recruteurs abonnés ; horodaté côté base. */
export async function setVisibility(visible: boolean): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  const { error } = await supabase.rpc("set_candidate_visibility", {
    p_visible: visible === true,
    p_version: VISIBILITY_CONSENT_VERSION,
  });
  if (error) { console.error("setVisibility:", error.message); return { ok: false }; }
  revalidatePath("/candidat/compte");
  return { ok: true };
}

import { ageFromBirthDate, MIN_AGE } from "@/lib/candidate/age";

/** Date de naissance (une seule fois, vérifiée aussi côté base) : sert à réserver la candidathèque aux majeurs. */
export async function saveBirthDate(value: string): Promise<{ ok: boolean }> {
  const age = ageFromBirthDate(value);
  if (age === null || age < MIN_AGE) return { ok: false };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  const { error } = await supabase.rpc("set_candidate_birth_date", { p_date: value });
  if (error) { console.error("saveBirthDate:", error.message); return { ok: false }; }
  revalidatePath("/candidat/compte");
  return { ok: true };
}

import { sanitizeTrades, sanitizeTradeOther } from "@/lib/candidate/trades";
import { sanitizeCv, type CvData } from "@/lib/candidate/cv";

/** Métiers précis du candidat connecté (max 3, clés connues uniquement). */
export async function saveTrades(raw: unknown, other?: unknown): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  const { error } = await supabase.from("candidates").update({ trades: sanitizeTrades(raw), trade_other: sanitizeTradeOther(other) }).eq("auth_user_id", user.id);
  if (error) { console.error("saveTrades:", error.message); return { ok: false }; }
  revalidatePath("/candidat/compte");
  return { ok: true };
}

/** Contenu du CV généré par Wolko (texte saisi par le candidat, aucune IA). */
export async function saveCv(raw: unknown): Promise<{ ok: boolean; cv?: CvData }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  const cv = sanitizeCv(raw);
  const { error } = await supabase.from("candidates").update({ cv_data: cv }).eq("auth_user_id", user.id);
  if (error) { console.error("saveCv:", error.message); return { ok: false }; }
  revalidatePath("/candidat/cv");
  return { ok: true, cv };
}
