import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/security/account";
import { allow, clientKey } from "@/lib/security/abuse";

/** Droit d'accès / portabilité (RGPD art. 15 et 20) : exporte les données du candidat connecté, uniquement les siennes. */
export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const admin = adminClient();
  if (!(await allow(admin, `export:${user.id}:1h`, 3600, 5)) || !(await allow(admin, `export-ip:${clientKey(req)}:1h`, 3600, 20))) {
    return NextResponse.json({ error: "Trop de demandes. Réessayez plus tard." }, { status: 429 });
  }

  const email = (user.email ?? "").toLowerCase();
  const { data: candidates } = await admin.from("candidates").select("*").eq("auth_user_id", user.id);
  const candidateIds = (candidates ?? []).map((c) => c.id as string);

  const [availabilities, documents, applications] = await Promise.all([
    candidateIds.length
      ? admin.from("candidate_availabilities").select("*").in("candidate_id", candidateIds)
      : Promise.resolve({ data: [] }),
    admin.from("candidate_documents").select("doc_type,label,file_name,created_at").eq("auth_user_id", user.id),
    // Candidatures envoyées avec le même email de compte (sans les notes internes des recruteurs)
    admin
      .from("applications")
      .select("job_offer_id,applicant_name,applicant_phone,applicant_email,cover_message,availability,licenses,has_caces,caces_types,applied_at,status")
      .eq("applicant_email", email),
  ]);

  const payload = {
    exported_at: new Date().toISOString(),
    account: { id: user.id, email: user.email, created_at: user.created_at, metadata: user.user_metadata },
    profile: candidates ?? [],
    availabilities: availabilities.data ?? [],
    documents: documents.data ?? [],
    applications: applications.data ?? [],
    note: "Les fichiers déposés (CV, diplômes) ne sont pas inclus dans cet export : seule leur liste l'est. Écrivez à hello@wolko.be pour les recevoir.",
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="wolko-mes-donnees.json"',
      "Cache-Control": "no-store",
    },
  });
}
