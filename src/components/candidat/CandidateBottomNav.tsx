"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Search, Bell, User, FileText } from "lucide-react";

const ICONS = { profil: LayoutDashboard, offres: Search, cv: FileText, alertes: Bell, compte: User } as const;
export type BottomItem = { href: string; label: string; icon: keyof typeof ICONS };

/** Barre d'onglets en bas de l'écran (téléphone) pour l'espace candidat. */
export default function CandidateBottomNav({ items }: { items: BottomItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-[#101F43] border-t border-white/[0.08] pb-[env(safe-area-inset-bottom)]" aria-label="Menu">
      <ul className="grid grid-cols-5">
        {items.map(({ href, label, icon }) => {
          const Icon = ICONS[icon];
          const on = pathname === href || (href !== "/jobs" && pathname.startsWith(href));
          return (
            <li key={href}>
              <Link href={href} className={`flex flex-col items-center justify-center gap-1 h-16 text-[10.5px] font-bold ${on ? "text-[#FFB900]" : "text-white/60"}`}>
                <Icon size={20} />
                <span className="truncate max-w-full px-1">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
