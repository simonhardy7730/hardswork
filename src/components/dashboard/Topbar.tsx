"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { formatRelative } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/lib/supabase/types";
import { useL, useLang } from "@/lib/i18n/context";

export interface Notif { id: string; name: string; job: string; offerId: string; at: string }

export default function DashboardTopbar({ user, notifications: initialNotifs = [], total: initialTotal = 0 }: { user: User; notifications?: Notif[]; total?: number }) {
  const l = useL();
  const lang = useLang();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notif[]>(initialNotifs);
  const [total, setTotal] = useState(initialTotal);

  /* Le menu du dashboard reste affiché quand on change de page : on rafraîchit la cloche
     toutes les 60 s, au retour sur l'onglet et à l'ouverture (sinon une candidature reçue entre-temps n'apparaît pas). */
  useEffect(() => {
    let alive = true;
    async function refresh() {
      const { data, count, error } = await createClient()
        .from("applications")
        .select("id, applicant_name, applied_at, job_offer_id, job_offers(title)", { count: "exact" })
        .eq("status", "nouveau")
        .order("applied_at", { ascending: false })
        .limit(5);
      if (!alive || error || !data) return;
      setNotifications(data.map((a) => {
        const j = a.job_offers as unknown as { title?: string } | { title?: string }[] | null;
        return { id: a.id as string, name: a.applicant_name as string, job: (Array.isArray(j) ? j[0]?.title : j?.title) ?? "", offerId: a.job_offer_id as string, at: a.applied_at as string };
      }));
      setTotal(count ?? data.length);
    }
    refresh();
    const timer = setInterval(refresh, 60_000);
    const onFocus = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);
    return () => { alive = false; clearInterval(timer); document.removeEventListener("visibilitychange", onFocus); window.removeEventListener("focus", onFocus); };
  }, []);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  const initials = user.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?";

  return (
    <header className="h-[60px] bg-[#101F43]/80 backdrop-blur-sm border-b border-white/[0.06] flex items-center justify-between px-6 shrink-0">
      <div />

      <div className="flex items-center gap-2.5">
        {/* Notifications */}
        <div className="relative" ref={ref}>
          <button onClick={() => setOpen(!open)} aria-label="Notifications" aria-expanded={open}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.06] transition relative">
            <Bell size={16} />
            {total > 0 && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-brand rounded-full" />}
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-2 w-80 max-w-[90vw] bg-white rounded-xl border border-ink-100 shadow-xl z-50 overflow-hidden">
              <p className="px-4 py-3 text-xs font-black uppercase tracking-widest text-ink border-b border-ink-100">
                {total > 0
                  ? l(`${total} nouvelle${total > 1 ? "s" : ""} candidature${total > 1 ? "s" : ""}`, `${total} nieuwe sollicitatie${total > 1 ? "s" : ""}`)
                  : l("Notifications", "Meldingen")}
              </p>
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-sm text-ink-500 text-center">{l("Rien de nouveau pour le moment.", "Voorlopig niets nieuws.")}</p>
              ) : (
                <>
                  {notifications.map((n) => (
                    <Link key={n.id} href={`/dashboard/offres/${n.offerId}/candidatures`} onClick={() => setOpen(false)}
                      className="block px-4 py-2.5 hover:bg-surface-2 transition border-b border-ink-100 last:border-0">
                      <p className="text-sm font-semibold text-ink truncate">{n.name}</p>
                      <p className="text-xs text-ink-500 truncate">{n.job} · {formatRelative(n.at, lang)}</p>
                    </Link>
                  ))}
                  <Link href="/dashboard/candidatures" onClick={() => setOpen(false)}
                    className="block px-4 py-2.5 text-center text-xs font-bold text-brand hover:bg-surface-2 transition">
                    {l("Voir toutes les candidatures", "Alle sollicitaties bekijken")}
                  </Link>
                </>
              )}
            </div>
          )}
        </div>

        {/* Avatar + nom */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold font-display">{initials}</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-[12px] font-semibold text-white leading-tight">{user.full_name}</p>
            <p className="text-[10px] text-white/30 capitalize">
              {user.role === "admin" ? l("Administrateur", "Beheerder") : user.role === "recruiter" ? l("Recruteur", "Recruiter") : l("Lecteur", "Lezer")}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
