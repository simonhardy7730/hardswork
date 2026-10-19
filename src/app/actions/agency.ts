"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAgency } from "@/lib/auth/agency";
import { getL } from "@/lib/i18n/server";

const CLIENT_STATUS = ["prospect", "actif", "inactif"];
const MISSION_STATUS = ["ouverte", "en_cours", "pourvue", "annulee"];

function s(fd: FormData, k: string) {
  const v = (fd.get(k) as string | null)?.trim();
  return v ? v : null;
}

export async function createAgencyClient(fd: FormData) {
  const l = await getL();
  const { supabase, orgId, userId } = await requireAgency();
  const name = s(fd, "name");
  if (!name) redirect(`/dashboard/clients?error=${encodeURIComponent(l("Le nom est requis.", "De naam is verplicht."))}`);
  const status = CLIENT_STATUS.includes(fd.get("status") as string) ? (fd.get("status") as string) : "prospect";
  const { error } = await supabase.from("agency_clients").insert({
    organization_id: orgId, created_by: userId, name, status,
    contact_name: s(fd, "contact_name"), contact_email: s(fd, "contact_email"),
    contact_phone: s(fd, "contact_phone"), city: s(fd, "city"), notes: s(fd, "notes"),
  });
  if (error) redirect(`/dashboard/clients?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/dashboard/clients");
  redirect("/dashboard/clients");
}

export async function setClientStatus(fd: FormData) {
  const { supabase } = await requireAgency();
  const id = fd.get("id") as string;
  const status = fd.get("status") as string;
  if (!CLIENT_STATUS.includes(status)) return;
  await supabase.from("agency_clients").update({ status }).eq("id", id);
  revalidatePath("/dashboard/clients");
}

export async function createMission(fd: FormData) {
  const l = await getL();
  const { supabase, orgId, userId } = await requireAgency();
  const title = s(fd, "title");
  const client_id = s(fd, "client_id");
  if (!title || !client_id) redirect(`/dashboard/missions?error=${encodeURIComponent(l("Client et intitulé requis.", "Klant en titel zijn verplicht."))}`);
  const positions = Math.max(1, parseInt((fd.get("positions") as string) || "1", 10) || 1);
  const { error } = await supabase.from("agency_missions").insert({
    organization_id: orgId, created_by: userId, client_id, title, positions,
    start_date: s(fd, "start_date"), notes: s(fd, "notes"),
  });
  if (error) redirect(`/dashboard/missions?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/dashboard/missions");
  redirect("/dashboard/missions");
}

export async function setMissionStatus(fd: FormData) {
  const { supabase } = await requireAgency();
  const id = fd.get("id") as string;
  const status = fd.get("status") as string;
  if (!MISSION_STATUS.includes(status)) return;
  await supabase.from("agency_missions").update({ status }).eq("id", id);
  revalidatePath("/dashboard/missions");
}
