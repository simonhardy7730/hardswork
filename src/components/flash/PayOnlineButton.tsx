"use client";

import { useState, useTransition } from "react";
import { startFlashCheckout } from "@/app/(dashboard)/dashboard/flash/actions";

export default function PayOnlineButton({ orderId, label }: { orderId: string; label: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div>
      <button
        type="button" disabled={pending}
        onClick={() => start(async () => {
          setError(null);
          const r = await startFlashCheckout(orderId);
          if (r.ok) window.location.href = r.url; else setError(r.error);
        })}
        className="bg-brand hover:bg-brand-dark disabled:opacity-60 text-[#101F43] font-display font-black uppercase text-[11px] tracking-wide px-4 py-2 rounded-lg"
      >
        {pending ? "…" : label}
      </button>
      {error && <p className="text-xs text-red-600 mt-1" role="alert">{error}</p>}
    </div>
  );
}
