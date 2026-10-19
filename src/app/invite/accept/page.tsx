import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getL } from "@/lib/i18n/server";

export const metadata = { title: "Invitation" };

/** Accepte une invitation d'équipe pour l'utilisateur connecté (vérifié côté base). */
export default async function AcceptInvitePage(props: { searchParams: Promise<{ token?: string }> }) {
  const searchParams = await props.searchParams;
  const l = await getL();
  const token = searchParams.token;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!token) redirect("/");
  if (!user) redirect(`/login?next=${encodeURIComponent(`/invite/accept?token=${token}`)}`);

  const { error } = await supabase.rpc("accept_team_invite", { p_token: token });
  if (!error) redirect("/auth/redirect");

  const msg = /email_mismatch/.test(error.message)
    ? l("Cette invitation est destinée à une autre adresse e-mail. Connectez-vous avec l'adresse invitée.", "Deze uitnodiging is voor een ander e-mailadres. Log in met het uitgenodigde adres.")
    : /already_member/.test(error.message)
      ? l("Votre compte appartient déjà à une organisation.", "Je account hoort al bij een organisatie.")
      : l("Invitation invalide, expirée ou déjà utilisée.", "Ongeldige, verlopen of reeds gebruikte uitnodiging.");

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#101F43] px-4">
      <div className="max-w-md w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8 text-white">
        <h1 className="text-2xl font-bold mb-2">{l("Invitation", "Uitnodiging")}</h1>
        <p className="text-white/70 text-sm mb-5">{msg}</p>
        <Link href="/auth/redirect" className="font-bold text-[#FFB900] hover:underline">{l("Aller à mon espace", "Naar mijn ruimte")}</Link>
      </div>
    </div>
  );
}
