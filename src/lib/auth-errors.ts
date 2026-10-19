// Traduit les erreurs Supabase Auth (en anglais) en messages clairs FR/NL.
export function friendlyAuthError(
  message: string | undefined,
  l: (fr: string, nl: string) => string
): string {
  const m = (message ?? "").toLowerCase();
  // Quota global d'envoi de mails (offre gratuite) ou envoi en échec : ce n'est pas la faute du visiteur.
  if (m.includes("email rate limit") || m.includes("error sending") || m.includes("sending confirmation") || m.includes("smtp")) {
    return l(
      "Beaucoup d'inscriptions en ce moment : l'email de confirmation n'a pas pu partir. Réessayez dans quelques minutes.",
      "Veel inschrijvingen op dit moment: de bevestigingsmail kon niet verstuurd worden. Probeer het over enkele minuten opnieuw."
    );
  }
  if (m.includes("for security purposes") || m.includes("rate limit") || m.includes("too many")) {
    const sec = /(\d+)\s*second/.exec(m)?.[1];
    return l(
      `Un email de confirmation vient d'être envoyé. Patiente ${sec ?? "une minute"}${sec ? " secondes" : ""} avant de réessayer, et vérifie ta boîte mail (et les spams).`,
      `Er is net een bevestigingsmail verstuurd. Wacht ${sec ?? "een minuut"}${sec ? " seconden" : ""} voor je opnieuw probeert en controleer je mailbox (en spam).`
    );
  }
  if (m.includes("already registered") || m.includes("already been registered")) {
    return l(
      "Cette adresse email a déjà un compte. Connecte-toi plutôt.",
      "Dit e-mailadres heeft al een account. Log in."
    );
  }
  if (m.includes("password") && (m.includes("at least") || m.includes("weak") || m.includes("short"))) {
    return l(
      "Mot de passe trop faible : utilise au moins 8 caractères.",
      "Wachtwoord te zwak: gebruik minstens 8 tekens."
    );
  }
  if (m.includes("invalid") && m.includes("email")) {
    return l("Adresse email invalide.", "Ongeldig e-mailadres.");
  }
  return l("Erreur lors de l'inscription. Réessaie dans un instant.", "Fout bij het registreren. Probeer zo opnieuw.");
}
