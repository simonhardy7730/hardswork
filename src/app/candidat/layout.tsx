import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { HardSworkLogo } from "@/components/ui/HardieIcon";
import { LayoutDashboard, Search, Bell, User, LogOut } from "lucide-react";
import { LangSwitch } from "@/components/layout/LangSwitch";
import { getL } from "@/lib/i18n/server";
import { getSpace, SPACE_HOME } from "@/lib/auth/space";

export default async function CandidatLayout({ children }: { children: React.ReactNode }) {
  const l = getL();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // Un compte entreprise/agence n'a pas accès à l'espace candidat.
  const space = await getSpace();
  if (space === "company" || space === "agency") redirect(SPACE_HOME[space]);

  const initials = (user.user_metadata?.full_name as string ?? user.email ?? "?")
    .split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  const NAV = [
    { href: "/candidat/dashboard", label: l("Mon profil", "Mijn profiel"),      icon: LayoutDashboard },
    { href: "/jobs",               label: l("Offres d'emploi", "Vacatures"), icon: Search           },
    { href: "/candidat/alertes",   label: l("Mes alertes", "Mijn alerts"),     icon: Bell             },
    { href: "/candidat/compte",    label: l("Mon compte", "Mijn account"),      icon: User             },
  ];

  return (
    <div className="min-h-screen bg-[#FFFBF2] font-body flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-[#101F43] flex flex-col hidden md:flex">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/[0.07]">
          <Link href="/"><HardSworkLogo size="sm" dark /></Link>
        </div>

        {/* Badge candidat */}
        <div className="px-4 py-3 mx-3 mt-3 rounded-xl bg-white/[0.05] border border-white/[0.07] flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center shrink-0">
            <span className="font-display font-black text-white text-xs">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-bold truncate">
              {(user.user_metadata?.full_name as string) || l("Candidat", "Kandidaat")}
            </p>
            <p className="text-white/30 text-[10px] truncate">{user.email}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-white/50 hover:text-white hover:bg-white/[0.06] transition-all text-sm font-medium group">
              <Icon size={15} className="shrink-0 group-hover:text-brand transition-colors" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Déconnexion */}
        <div className="px-3 pb-5 border-t border-white/[0.07] pt-3 space-y-3">
          <div className="px-3"><LangSwitch /></div>
          <form action="/auth/signout" method="POST">
            <button type="submit"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-white/30 hover:text-brand hover:bg-brand/10 transition-all text-sm font-medium w-full">
              <LogOut size={15} className="shrink-0" />
              {l("Se déconnecter", "Uitloggen")}
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar mobile */}
        <header className="md:hidden bg-[#101F43] h-14 flex items-center justify-between px-4 border-b border-white/[0.07]">
          <Link href="/"><HardSworkLogo size="sm" dark /></Link>
          <div className="flex items-center gap-3">
            <LangSwitch />
            <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center">
              <span className="font-display font-black text-white text-xs">{initials}</span>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
