"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useL } from "@/lib/i18n/context";
import { publishFlashCredit } from "@/app/(dashboard)/dashboard/flash/actions";

export default function PublishCreditForm({ creditId, drafts }: { creditId: string; drafts: { id: string; title: string }[] }) {
  const l = useL();
  const router = useRouter();
  const [offer, setOffer] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (drafts.length === 0) {
    return <p className="text-xs text-ink-500">{l("Créez d'abord un brouillon d'annonce, puis revenez la publier ici.", "Maak eerst een concept aan en publiceer het hier.")}</p>;
  }
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <select value={offer} onChange={(e) => setOffer(e.target.value)} className="flex-1 px-3 py-2 text-sm border border-ink-100 rounded-xl bg-white">
        <option value="">{l("Choisir le brouillon à publier", "Kies het concept om te publiceren")}</option>
        {drafts.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
      </select>
      <button
        disabled={!offer || pending}
        onClick={() => { setMsg(null); start(async () => { const r = await publishFlashCredit(creditId, offer); if (r.ok) router.refresh(); else setMsg(r.error); }); }}
        className="bg-brand hover:bg-brand-dark text-[#101F43] font-bold text-sm px-4 py-2 rounded-xl disabled:opacity-50"
      >{pending ? "…" : l("Publier (30 jours)", "Publiceren (30 dagen)")}</button>
      {msg && <p role="alert" className="text-xs text-red-600 sm:basis-full">{msg}</p>}
    </div>
  );
}
