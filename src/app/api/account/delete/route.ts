import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/security/account";
import { allow } from "@/lib/security/abuse";

/**
 * Droit à l'effacement (RGPD art. 17) pour un compte CANDIDAT.
 * Les comptes d'entreprise / agence sont rattachés à une organisation : suppression via hello@wolko.be.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  let body: { confirm?: string } = {};
  try { body = await req.json(); } catch { /* corps vide */ }
  if (body.confirm !== "SUPPRIMER") return NextResponse.json({ error: "Confirmation manquante" }, { status: 400 });

  const admin = adminClient();
  if (!(await allow(admin, `delete:${user.id}:1d`, 86400, 3))) {
    return NextResponse.json({ error: "Trop de tentatives." }, { status: 429 });
  }

  const { data: member } = await admin.from("users").select("id").eq("id", user.id).maybeSingle();
  if (member) {
    return NextResponse.json(
      { error: "Ce compte est rattaché à une organisation. Écrivez à hello@wolko.be pour le supprimer." },
      { status: 403 }
    );
  }

  const email = (user.email ?? "").toLowerCase();
  const { data: cands } = await admin.from("candidates").select("id").eq("auth_user_id", user.id);
  const candidateIds = (cands ?? []).map((c) => c.id as string);

  // 1. Fichiers (CV, diplômes) du bucket privé
  const { data: files } = await admin.storage.from("candidate-documents").list(user.id, { limit: 1000 });
  if (files && files.length) {
    await admin.storage.from("candidate-documents").remove(files.map((f) => `${user.id}/${f.name}`));
  }

  // 2. Candidatures déjà transmises : anonymisées (les recruteurs gardent l'historique chiffré, sans identité)
  const anon = { applicant_name: "Candidat supprimé", applicant_phone: "", applicant_email: null, cover_message: null };
  if (email) await admin.from("applications").update(anon).eq("applicant_email", email);
  if (candidateIds.length) await admin.from("applications").update(anon).in("candidate_id", candidateIds);
  await admin.from("applications").update({ ...anon, account_user_id: null }).eq("account_user_id", user.id);

  // 3. Profil, disponibilités (cascade), puis compte d'authentification
  if (candidateIds.length) await admin.from("candidates").delete().in("id", candidateIds);
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ error: "Suppression impossible, contactez hello@wolko.be" }, { status: 500 });

  await supabase.auth.signOut();
  return NextResponse.json({ success: true });
}
