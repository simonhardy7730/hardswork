"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Briefcase, Kanban, Users, Settings, LogOut, Building2, ClipboardList, Search, Zap, X,
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
  { href: "/dashboard/settings", icon: Settings,        fr: "Paramètres",      nl: "Instellingen",  exact: false },
];

/* Candidathèque : affichée sauf si CANDIDATE_POOL_ENABLED="false" */
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

  const [mobileOpen, setMobileOpen] = useState(false);
  // Téléphone : le menu s'ouvre via le bouton ☰ de la barre du haut (événement « wolko:menu ») et se ferme à chaque changement de page.
  useEffect(() => {
    const toggle = () => setMobileOpen((o) => !o);
    window.addEventListener("wolko:menu", toggle);
    return () => window.removeEventListener("wolko:menu", toggle);
  }, []);
  useEffect(() => { setMobileOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const content = (mobile: boolean) => (
    <>

      {/* Logo */}
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <Link href="/dashboard">
          <HardSworkLogo size="sm" dark />
        </Link>
        {mobile && (
          <button type="button" onClick={() => setMobileOpen(false)} aria-label={l("Fermer le menu", "Menu sluiten")}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white/70 hover:bg-white/[0.08]">
            <X size={18} />
          </button>
        )}
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
      <nav className="flex-1 px-3 py-3 space-y-0.5" aria-label={l("Menu principal", "Hoofdmenu")}>
        {[
          ...NAV_ITEMS.slice(0, 5),
          ...(showPool ? [POOL_ITEM] : []),
          ...(org?.type === "agency" ? AGENCY_ITEMS : []),
          ...NAV_ITEMS.slice(5),
        ].map(({ href, icon: Icon, fr, nl, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-2.5 px-3 ${mobile ? "py-3 text-[15px]" : "py-2.5 text-[13px]"} rounded-xl font-semibold transition-all ${
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
    </>
  );

  return (
    <>
      <aside className="hidden md:flex w-[220px] bg-[#101F43] border-r border-white/[0.07] flex-col shrink-0">
        {content(false)}
      </aside>
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-[60]">
          <button type="button" aria-label={l("Fermer le menu", "Menu sluiten")} onClick={() => setMobileOpen(false)} className="absolute inset-0 bg-black/50" />
          <aside className="absolute left-0 top-0 bottom-0 w-[260px] max-w-[85vw] bg-[#101F43] flex flex-col overflow-y-auto shadow-2xl">
            {content(true)}
          </aside>
        </div>
      )}
    </>
  );
}
