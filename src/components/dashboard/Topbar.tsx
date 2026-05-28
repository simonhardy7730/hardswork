"use client";

import { Bell } from "lucide-react";
import type { User } from "@/lib/supabase/types";

export default function DashboardTopbar({ user }: { user: User }) {
  const initials = user.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="h-14 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-6 shrink-0">
      <div />

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-[#64748B] hover:bg-[#F1F5F9] transition relative">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#F59E0B] rounded-full" />
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#1E40AF] flex items-center justify-center">
            <span className="text-white text-xs font-bold">{initials}</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-[#1E293B]">
              {user.full_name}
            </p>
            <p className="text-[10px] text-[#94A3B8] capitalize">
              {user.role === "admin"
                ? "Administrateur"
                : user.role === "recruiter"
                  ? "Recruteur"
                  : "Lecteur"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
