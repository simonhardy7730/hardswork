import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { HardSworkLogo } from "@/components/ui/HardieIcon";
import { LayoutDashboard, Search, Bell, User, LogOut } from "lucide-react";

export default async function CandidatLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const initials = (user.user_metadata?.full_name as string ?? user.email ?? "?")
    .split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  const NAV = [
    { href: "/candidat/dashboard", label: "Mon profil",      icon: LayoutDashboard },
    { href: "/jobs",               label: "Offres d'emploi", icon: Search           },
    { href: "/candidat/alertes",   label: "Mes alertes",     icon: Bell             },
    { href: "/candidat/compte",    label: "Mon compte",      icon: User             },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF8] font-body flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-[#0F0E0D] flex flex-col hidden md:flex">
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
              {(user.user_metadata?.full_name as string) || "Candidat"}
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
        <div className="px-3 pb-5 border-t border-white/[0.07] pt-3">
          <form action="/auth/signout" method="POST">
            <button type="submit"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-white/30 hover:text-brand hover:bg-brand/10 transition-all text-sm font-medium w-full">
              <LogOut size={15} className="shrink-0" />
              Se déconnecter
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar mobile */}
        <header className="md:hidden bg-[#0F0E0D] h-14 flex items-center justify-between px-4 border-b border-white/[0.07]">
          <Link href="/"><HardSworkLogo size="sm" dark /></Link>
          <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center">
            <span className="font-display font-black text-white text-xs">{initials}</span>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
