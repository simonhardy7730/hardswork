import { redirect } from "next/navigation";

// Page « Qui sommes-nous » retirée volontairement : les anciens liens renvoient vers l'accueil.
export default function AProposPage() {
  redirect("/");
}
