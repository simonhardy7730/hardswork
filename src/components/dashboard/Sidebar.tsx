"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Briefcase, Users, Settings, LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Organization } from "@/lib/supabase/types";
import { HardSworkLogo } from "@/components/ui/HardieIcon";

const NAV_ITEMS = [
  { href: "/dashboard",          icon: LayoutDashboard, label: "Tableau de bord", exact: true },
  { href: "/dashboard/offres",   icon: Briefcase,       label: "Offres d'emploi",  exact: false },
  { href: "/dashboard/candidats",icon: Users,           label: "Candidats",        exact: false },
  { href: "/dashboard/settings", icon: Settings,        label: "Paramètres",       exact: false },
];

export default function DashboardSidebar({ org }: { org: Organization }) {
  const pathname = usePathname();
  const router   = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="w-[220px] bg-[#0F0E0D] border-r border-white/[0.07] flex flex-col shrink-0">

      {/* Logo */}
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <Link href="/dashboard">
          <HardSworkLogo size="sm" dark />
        </Link>
      </div>

      {/* Organisation */}
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-white/[0.05]">
          <div className="w-7 h-7 rounded-lg bg-brand/20 flex items-center justify-center shrink-0">
            <span className="text-brand text-xs font-black font-display">
              {org?.name?.[0]?.toUpperCase() ?? "O"}
            </span>
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-[12px] font-semibold text-white truncate">{org?.name ?? "Organisation"}</p>
            <p className="text-[10px] text-white/30 capitalize">
              {org?.type === "agency" ? "Agence" : "Entreprise"}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {NAV_ITEMS.map(({ href, icon: Icon, label, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                isActive
                  ? "bg-brand text-white"
                  : "text-white/40 hover:text-white hover:bg-white/[0.06]"
              }`}>
              <Icon size={16} className={isActive ? "text-white" : "text-white/30"} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Déconnexion */}
      <div className="p-3 border-t border-white/[0.06]">
        <button onClick={handleSignOut}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all w-full">
          <LogOut size={16} />
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}
