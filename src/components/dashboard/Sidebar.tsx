"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Briefcase, Kanban, Users, Settings, LogOut, Building2, ClipboardList, Search, Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Organization } from "@/lib/supabase/types";
import { HardSworkLogo } from "@/components/ui/HardieIcon";
import { useL } from "@/lib/i18n/context";

const NAV_ITEMS = [
  { href: "/dashboard",          icon: LayoutDashboard, fr: "Tableau de bord", nl: "Dashboard",     exact: true },
  { href: "/dashboard/offres",   icon: Briefcase,       fr: "Offres d'emploi", nl: "Vacatures",     exact: false },
  { href: "/dashboard/candidatures", icon: Kanban,    fr: "Candidatures",    nl: "Sollicitaties", exact: false },
  { href: "/dashboard/flash",   icon: Zap,             fr: "WOLKO Flash",     nl: "WOLKO Flash",   exact: false },
  { href: "/dashboard/candidats",icon: Users,           fr: "Candidats",       nl: "Kandidaten",    exact: false },
  { href: "/dashboard/settings", icon: Settings,        fr: "Paramètres",      nl: "Instellingen",  exact: false },
];

/* Candidathèque : affichée uniquement quand CANDIDATE_POOL_ENABLED=true */
const POOL_ITEM = { href: "/dashboard/candidatheque", icon: Search, fr: "Candidathèque", nl: "Kandidatenbank", exact: false };

/* Entrées réservées aux agences (les pages vérifient aussi le type côté serveur) */
const AGENCY_ITEMS = [
  { href: "/dashboard/clients",  icon: Building2,       fr: "Clients",         nl: "Klanten",       exact: false },
  { href: "/dashboard/missions", icon: ClipboardList,   fr: "Missions",        nl: "Opdrachten",    exact: false },
];

export default function DashboardSidebar({ org, showPool = false }: { org: Organization; showPool?: boolean }) {
  const pathname = usePathname();
  const router   = useRouter();
  const l = useL();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="w-[220px] bg-[#101F43] border-r border-white/[0.07] flex flex-col shrink-0">

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
            <p className="text-[12px] font-semibold text-white truncate">{org?.name ?? l("Organisation", "Organisatie")}</p>
            <p className="text-[10px] text-white/30 capitalize">
              {org?.type === "agency" ? l("Agence", "Bureau") : l("Entreprise", "Bedrijf")}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {[
          ...NAV_ITEMS.slice(0, 5),
          ...(showPool ? [POOL_ITEM] : []),
          ...(org?.type === "agency" ? AGENCY_ITEMS : []),
          ...NAV_ITEMS.slice(5),
        ].map(({ href, icon: Icon, fr, nl, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                isActive
                  ? "bg-brand text-white"
                  : "text-white/40 hover:text-white hover:bg-white/[0.06]"
              }`}>
              <Icon size={16} className={isActive ? "text-white" : "text-white/30"} />
              {l(fr, nl)}
            </Link>
          );
        })}
      </nav>

      {/* Déconnexion */}
      <div className="p-3 border-t border-white/[0.06]">
        <button onClick={handleSignOut}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all w-full">
          <LogOut size={16} />
          {l("Se déconnecter", "Afmelden")}
        </button>
      </div>
    </aside>
  );
}
