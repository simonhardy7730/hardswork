import { createClient } from "@supabase/supabase-js";
import { render } from "@react-email/render";
import { resend, FROM_EMAIL, FROM_NAME } from "@/lib/resend";
import WelcomeEmail from "@/emails/Welcome";
import { WELCOME, type WelcomeKind, type WelcomeLang } from "@/emails/welcome-content";

const admin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const firstWord = (s: unknown) => (typeof s === "string" ? s.trim().split(/\s+/)[0].slice(0, 40) : "");

/**
 * Envoie l'email de bienvenue d'un compte, UNE seule fois, si (et seulement si) son adresse est confirmée.
 * - La file `welcome_emails` est alimentée par la base à la confirmation (trigger, migration 014).
 * - `claim_welcome_email` est atomique : deux requêtes simultanées ne peuvent pas envoyer deux fois.
 * - Ne lève jamais d'erreur : ne doit jamais bloquer une connexion.
 */
export async function sendWelcomeIfPending(userId: string): Promise<"sent" | "skipped" | "failed"> {
  const db = admin();
  try {
    // Désactivé par défaut (22/10/2026) : la formule gratuite de Resend est limitée à 100 e-mails/jour et chaque
    // inscription en consomme déjà un (confirmation). Pour le réactiver : WELCOME_EMAIL_ENABLED=1 sur Vercel.
    // On clôt la ligne en file pour qu'un futur réactivation n'envoie pas d'e-mails de bienvenue à d'anciens comptes.
    if (process.env.WELCOME_EMAIL_ENABLED !== "1") {
      await db.from("welcome_emails").update({ status: "sent", last_error: "disabled_not_sent" }).eq("user_id", userId).in("status", ["pending", "failed"]);
      return "skipped";
    }
    const { data: claimed, error: claimErr } = await db.rpc("claim_welcome_email", { p_user: userId });
    if (claimErr || claimed !== true) return "skipped"; // pas en file, déjà envoyé, ou pris par une autre requête

    const fail = async (msg: string) => {
      const { data: row } = await db.from("welcome_emails").select("attempts").eq("user_id", userId).single();
      const attempts = (row?.attempts as number) ?? 1;
      await db.from("welcome_emails").update({
        status: "failed", last_error: msg.slice(0, 300),
        next_attempt_at: new Date(Date.now() + attempts * 15 * 60 * 1000).toISOString(),
      }).eq("user_id", userId);
      return "failed" as const;
    };

    // Identité et confirmation vérifiées côté serveur (jamais d'après le navigateur)
    const { data: au, error: auErr } = await db.auth.admin.getUserById(userId);
    const user = au?.user;
    if (auErr || !user?.email) return fail("user_not_found");
    if (!user.email_confirmed_at) return fail("email_not_confirmed");

    // Type de compte d'après la base
    let kind: WelcomeKind | null = null;
    let first = "";
    const { data: member } = await db.from("users").select("full_name, organizations(type)").eq("id", userId).maybeSingle();
    if (member) {
      const org = member.organizations as unknown as { type?: string } | { type?: string }[] | null;
      const type = Array.isArray(org) ? org[0]?.type : org?.type;
      kind = type === "agency" ? "agency" : "company";
      first = firstWord(member.full_name);
    } else {
      const { data: cand } = await db.from("candidates").select("first_name").eq("auth_user_id", userId).maybeSingle();
      if (cand || user.user_metadata?.user_type === "candidate") {
        kind = "candidate";
        first = firstWord(cand?.first_name) || firstWord(user.user_metadata?.full_name);
      }
    }
    if (!kind) return fail("role_unknown"); // profil pas encore créé : on réessaiera plus tard

    const lang: WelcomeLang = user.user_metadata?.lang === "nl" ? "nl" : "fr";
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://wolko.be";
    const element = WelcomeEmail({ kind, lang, firstName: first, baseUrl });
    const html = await render(element);
    const text = await render(element, { plainText: true });

    const { error: sendErr } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: user.email,
      subject: WELCOME[kind][lang].subject,
      html,
      text,
    });
    if (sendErr) return fail(`resend:${sendErr.message ?? "error"}`);

    await db.from("welcome_emails").update({ status: "sent", sent_at: new Date().toISOString(), last_error: null }).eq("user_id", userId);
    return "sent";
  } catch (e) {
    console.error("welcome email:", e instanceof Error ? e.message : e);
    return "failed";
  }
}
