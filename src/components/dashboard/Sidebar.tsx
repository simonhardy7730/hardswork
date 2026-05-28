"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Organization } from "@/lib/supabase/types";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Tableau de bord",
    exact: true,
  },
  {
    href: "/dashboard/offres",
    icon: Briefcase,
    label: "Offres d'emploi",
    exact: false,
  },
  {
    href: "/dashboard/candidats",
    icon: Users,
    label: "Candidats",
    exact: false,
  },
  {
    href: "/dashboard/settings",
    icon: Settings,
    label: "Paramètres",
    exact: false,
  },
];

export default function DashboardSidebar({ org }: { org: Organization }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="w-60 bg-white border-r border-[#E2E8F0] flex flex-col shrink-0">
      {/* Logo */}
      <div className="p-5 border-b border-[#E2E8F0]">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#1E40AF] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">R</span>
          </div>
          <span className="font-bold text-[#1E293B] text-base">Rekruut</span>
        </Link>
      </div>

      {/* Org name */}
      <div className="px-4 py-3 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-[#F8FAFC]">
          <div className="w-7 h-7 rounded-md bg-[#1E40AF]/10 flex items-center justify-center shrink-0">
            <span className="text-[#1E40AF] text-xs font-bold">
              {org?.name?.[0]?.toUpperCase() ?? "O"}
            </span>
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-[#1E293B] truncate">
              {org?.name ?? "Organisation"}
            </p>
            <p className="text-[10px] text-[#94A3B8] capitalize">
              {org?.type === "agency" ? "Agence" : "Entreprise"}
            </p>
          </div>
          <ChevronRight size={14} className="text-[#94A3B8] ml-auto shrink-0" />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ href, icon: Icon, label, exact }) => {
          const isActive = exact
            ? pathname === href
            : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all group ${
                isActive
                  ? "bg-[#1E40AF] text-white"
                  : "text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#1E293B]"
              }`}
            >
              <Icon
                size={18}
                className={
                  isActive
                    ? "text-white"
                    : "text-[#94A3B8] group-hover:text-[#1E293B]"
                }
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="p-3 border-t border-[#E2E8F0]">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-[#64748B] hover:bg-red-50 hover:text-red-600 transition-all w-full"
        >
          <LogOut size={18} />
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}
