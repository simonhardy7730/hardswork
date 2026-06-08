import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { User, Mail, Phone, Lock, LogOut } from "lucide-react";

export const metadata = { title: "Mon compte — HardSwork" };

export default async function ComptePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const fullName = (user.user_metadata?.full_name as string) ?? "";
  const initials = fullName
    .split(" ").map((n: string) => n[0] ?? "").join("").slice(0, 2).toUpperCase()
    || user.email?.[0]?.toUpperCase() || "?";

  return (
    <div className="space-y-6 max-w-xl">
      {/* Header */}
      <div>
        <h1
          className="font-display font-black text-ink uppercase leading-none"
          style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", letterSpacing: "-0.01em" }}
        >
          Mon <span className="text-brand">[compte].</span>
        </h1>
        <p className="text-ink-500 text-sm mt-1">Gérez vos informations personnelles.</p>
      </div>

      {/* Avatar + nom */}
      <div className="bg-white border border-ink-100 rounded-2xl p-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-brand flex items-center justify-center shrink-0">
          <span className="font-display font-black text-white text-xl">{initials}</span>
        </div>
        <div>
          <p className="font-display font-black text-ink text-lg uppercase leading-tight"
            style={{ letterSpacing: "-0.01em" }}>
            {fullName || "Candidat"}
          </p>
          <p className="text-ink-400 text-sm">{user.email}</p>
          <span className="inline-block mt-1 text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wide">
            ● Compte actif
          </span>
        </div>
      </div>

      {/* Informations */}
      <div className="bg-white border border-ink-100 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-ink-100">
          <p className="font-display font-black text-ink uppercase text-xs tracking-widest">
            Informations
          </p>
        </div>
        <div className="divide-y divide-ink-100">
          {[
            {
              icon: User,
              label: "Nom complet",
              value: fullName || "Non renseigné",
              hint: fullName ? "" : "À compléter",
            },
            {
              icon: Mail,
              label: "Adresse email",
              value: user.email ?? "—",
              hint: "",
            },
            {
              icon: Phone,
              label: "Téléphone",
              value: (user.user_metadata?.phone as string) || "Non renseigné",
              hint: !user.user_metadata?.phone ? "À compléter" : "",
            },
          ].map(({ icon: Icon, label, value, hint }) => (
            <div key={label} className="flex items-center gap-4 px-5 py-4">
              <div className="w-8 h-8 bg-surface rounded-lg flex items-center justify-center shrink-0">
                <Icon size={14} className="text-ink-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-ink-400 uppercase tracking-wide">{label}</p>
                <p className={`text-sm font-bold truncate ${value.includes("Non") ? "text-ink-300" : "text-ink"}`}>
                  {value}
                </p>
              </div>
              {hint && (
                <span className="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0">
                  {hint}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Edit notice */}
        <div className="px-5 py-4 border-t border-ink-100 bg-surface">
          <p className="text-xs text-ink-400 leading-relaxed">
            La modification du profil complet arrive prochainement.
            Pour toute urgence, contactez{" "}
            <a href="mailto:hello@hardswork.be" className="font-bold text-brand hover:text-brand-dark transition-colors">
              hello@hardswork.be
            </a>
          </p>
        </div>
      </div>

      {/* Sécurité */}
      <div className="bg-white border border-ink-100 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-ink-100">
          <p className="font-display font-black text-ink uppercase text-xs tracking-widest">
            Sécurité
          </p>
        </div>
        <div className="px-5 py-4 flex items-center gap-4">
          <div className="w-8 h-8 bg-surface rounded-lg flex items-center justify-center shrink-0">
            <Lock size={14} className="text-ink-400" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-medium text-ink-400 uppercase tracking-wide">Mot de passe</p>
            <p className="text-sm font-bold text-ink">••••••••••••</p>
          </div>
          <span className="text-[10px] font-black text-ink-300 uppercase tracking-wide">Bientôt</span>
        </div>
      </div>

      {/* Se déconnecter */}
      <div className="bg-white border border-red-100 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 flex items-center gap-4">
          <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
            <LogOut size={14} className="text-red-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-ink">Se déconnecter</p>
            <p className="text-[11px] text-ink-400">Fermer la session sur cet appareil</p>
          </div>
          <form action="/auth/signout" method="POST">
            <button
              type="submit"
              className="text-[11px] font-black text-red-500 hover:text-red-700 border border-red-200 hover:border-red-300 px-3 py-1.5 rounded-lg uppercase tracking-wide transition"
            >
              Déconnexion
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
