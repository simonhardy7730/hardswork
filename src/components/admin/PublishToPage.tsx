"use client";
import { useState, useTransition } from "react";
import { publishToPage } from "@/app/admin/partage/actions";

export default function PublishToPage({ jobId, posted, enabled }: { jobId: string; posted: boolean; enabled: boolean }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  if (posted) return <span className="shrink-0 text-xs font-bold text-green-700">✓ Sur la page</span>;
  if (!enabled) return <span className="shrink-0 text-[11px] text-[#101F43]/50 max-w-[9rem] text-right">Page Facebook pas encore reliée</span>;
  return (
    <div className="shrink-0 flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => { if (!confirm("Publier cette offre sur la page Facebook Wolko ?")) return; start(async () => { const r = await publishToPage(jobId); setMsg(r.ok ? "Publié ✓" : r.error ?? "Erreur"); }); }}
        className="rounded-lg bg-[#101F43] px-3 py-2 text-xs font-black uppercase tracking-wide text-white hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Publication…" : "Publier sur la page"}
      </button>
      {msg && <span className="text-[11px] text-[#101F43]/70 max-w-[12rem] text-right">{msg}</span>}
    </div>
  );
}
