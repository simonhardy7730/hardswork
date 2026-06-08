"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// ── Organisation ────────────────────────────────────────
export async function updateOrganization(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { error: "Seul un administrateur peut modifier ces informations." };
  }

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Le nom de l'organisation est requis." };

  const updates = {
    name,
    address: (formData.get("address") as string) || null,
    city: (formData.get("city") as string) || null,
    region: (formData.get("region") as string) || null,
    phone: (formData.get("phone") as string) || null,
    email: (formData.get("email") as string) || null,
    website: (formData.get("website") as string) || null,
  };

  const { error } = await supabase
    .from("organizations")
    .update(updates)
    .eq("id", profile.organization_id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  return { success: true };
}

// ── Personnalisation ────────────────────────────────────
export async function updateCustomization(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { error: "Seul un administrateur peut modifier ces informations." };
  }

  const updates = {
    logo_url: (formData.get("logo_url") as string) || null,
    primary_color: (formData.get("primary_color") as string) || null,
  };

  const { error } = await supabase
    .from("organizations")
    .update(updates)
    .eq("id", profile.organization_id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  return { success: true };
}

// ── Équipe ──────────────────────────────────────────────
export async function updateMemberRole(memberId: string, role: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { error: "Seul un administrateur peut modifier les rôles." };
  }

  if (memberId === user.id) {
    return { error: "Vous ne pouvez pas modifier votre propre rôle." };
  }

  const { error } = await supabase
    .from("users")
    .update({ role })
    .eq("id", memberId)
    .eq("organization_id", profile.organization_id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function removeMember(memberId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { error: "Seul un administrateur peut retirer des membres." };
  }

  if (memberId === user.id) {
    return { error: "Vous ne pouvez pas vous retirer vous-même." };
  }

  const { error } = await supabase
    .from("users")
    .delete()
    .eq("id", memberId)
    .eq("organization_id", profile.organization_id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function updateCurrentUserName(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const full_name = (formData.get("full_name") as string)?.trim();
  if (!full_name) return { error: "Le nom complet est requis." };

  const { error } = await supabase
    .from("users")
    .update({ full_name })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  return { success: true };
}
