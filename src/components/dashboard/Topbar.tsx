"use client";

import { Bell } from "lucide-react";
import type { User } from "@/lib/supabase/types";

export default function DashboardTopbar({ user }: { user: User }) {
  const initials = user.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?";

  return (
    <header className="h-[60px] bg-[#0F0E0D]/80 backdrop-blur-sm border-b border-white/[0.06] flex items-center justify-between px-6 shrink-0">
      <div />

      <div className="flex items-center gap-2.5">
        {/* Notifications */}
        <button className="w-8 h-8 rounded-xl flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.06] transition relative">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-brand rounded-full" />
        </button>

        {/* Avatar + nom */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold font-display">{initials}</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-[12px] font-semibold text-white leading-tight">{user.full_name}</p>
            <p className="text-[10px] text-white/30 capitalize">
              {user.role === "admin" ? "Administrateur" : user.role === "recruiter" ? "Recruteur" : "Lecteur"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
