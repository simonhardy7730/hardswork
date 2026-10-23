import Link from "next/link";
import { Bell } from "lucide-react";

/** Encart « alertes emploi » : mène vers l'activation (le candidat doit être connecté, rien n'est activé sans son clic). */
export default function AlertPromo({ loggedIn = true, className = "" }: { loggedIn?: boolean; className?: string }) {
  // Visiteur non connecté : on le mène à l'inscription candidat (gratuite), pas à une page qui demande la connexion.
  const href = loggedIn ? "/candidat/alertes" : "/signup/candidat";
  return (
    <div className={`flex items-start gap-3 bg-[#FFF6DE] border border-[#EADFC4] rounded-2xl p-5 ${className}`}>
      <Bell className="text-brand mt-0.5 shrink-0" size={20} />
      <div className="flex-1">
        <p className="font-display font-black uppercase text-[#101F43] text-base leading-tight">Reçois les nouvelles offres par e-mail</p>
        <p className="text-sm text-[#101F43]/70 mt-1">Une fois par semaine, seulement s&apos;il y a du nouveau qui correspond à ton profil. Gratuit, désinscription en un clic.{!loggedIn && " Il suffit de créer un compte candidat, puis d'activer l'alerte."}</p>
        <Link href={href} className="inline-block mt-3 bg-[#FFB900] text-[#101F43] font-bold text-sm rounded-xl px-4 py-2.5 min-h-11">{loggedIn ? "Activer mes alertes" : "Créer mon compte gratuit"}</Link>
      </div>
    </div>
  );
}
