"use client";
import { useState, useTransition } from "react";
import { useL } from "@/lib/i18n/context";
import { setJobAlerts } from "@/app/candidat/alertes/actions";

export default function AlertToggle({ initial, email }: { initial: boolean; email: string }) {
  const l = useL();
  const [on, setOn] = useState(initial);
  const [err, setErr] = useState(false);
  const [pending, start] = useTransition();
  const toggle = () => start(async () => {
    setErr(false);
    const r = await setJobAlerts(!on);
    if (r.ok) setOn(!on); else setErr(true);
  });
  return (
    <div>
      <button type="button" onClick={toggle} disabled={pending} aria-pressed={on}
        className={`inline-flex items-center gap-2 font-display font-black uppercase text-xs px-5 py-3 min-h-12 rounded-xl transition disabled:opacity-60 ${on ? "bg-ink text-white" : "bg-brand text-white hover:bg-brand-dark"}`}
        style={{ letterSpacing: "0.05em" }}>
        {on ? l("Alertes activées — désactiver", "Alerts actief — uitschakelen") : l("Activer les alertes", "Alerts activeren")}
      </button>
      {on && <p className="text-xs text-ink-500 mt-2">{l("Envoyées à", "Verstuurd naar")} {email}</p>}
      {err && <p className="text-xs text-red-600 mt-2">{l("Impossible de modifier pour le moment, réessaie.", "Wijzigen lukt nu niet, probeer opnieuw.")}</p>}
    </div>
  );
}
