"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendInviteEmail } from "@/lib/email/invite";

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

  const logo = ((formData.get("logo_url") as string) || "").trim();
  const color = ((formData.get("primary_color") as string) || "").trim();
  if (logo && !/^https:\/\//i.test(logo)) return { error: "Le logo doit être une adresse https." };
  if (color && !/^#[0-9a-fA-F]{6}$/.test(color)) return { error: "Couleur invalide (format #RRGGBB)." };
  const updates = {
    logo_url: logo || null,
    primary_color: color || null,
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

  if (!["admin", "recruiter", "viewer"].includes(role)) return { error: "Rôle invalide." };
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

// ── Invitations d'équipe (jeton à usage unique, validé côté base) ─────────
export async function createInvite(email: string, role: "admin" | "recruiter" | "viewer") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const clean = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return { error: "Adresse e-mail invalide." };
  if (!["admin", "recruiter", "viewer"].includes(role)) return { error: "Rôle invalide." };

  const { data: token, error } = await supabase.rpc("create_team_invite", { p_email: clean, p_role: role });
  if (error || !token) {
    return { error: /forbidden/.test(error?.message ?? "") ? "Seul un administrateur peut inviter." : "Impossible de créer l'invitation (la migration 005 est-elle appliquée ?)." };
  }
  // Mail d'invitation (échec toléré : le lien reste affiché pour être copié)
  const { data: me } = await supabase.from("users").select("organizations(name)").eq("id", user.id).maybeSingle();
  const o = me?.organizations as unknown as { name?: string } | { name?: string }[] | null;
  const orgName = (Array.isArray(o) ? o[0]?.name : o?.name) ?? "votre équipe";
  const emailed = await sendInviteEmail({ to: clean, orgName, token: token as string, role });
  revalidatePath("/dashboard/settings");
  return { token: token as string, emailed };
}

export async function revokeInvite(inviteId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: me } = await supabase.from("users").select("organization_id, role").eq("id", user.id).single();
  if (!me || me.role !== "admin") return { error: "Seul un administrateur peut révoquer." };
  const { error } = await supabase.from("team_invites").delete().eq("id", inviteId).eq("organization_id", me.organization_id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/settings");
  return { success: true };
}
