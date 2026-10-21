import { redirect } from "next/navigation";

/** Ancienne page « Candidats » (fichier privé, toujours vide) : remplacée par la candidathèque. */
export default function CandidatsPage() {
  redirect("/dashboard/candidatheque");
}
