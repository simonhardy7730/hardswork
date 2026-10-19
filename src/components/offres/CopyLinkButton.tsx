"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export default function CopyLinkButton({ url }: { url: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      aria-label="Copier le lien"
      onClick={async () => {
        try { await navigator.clipboard.writeText(url); setDone(true); setTimeout(() => setDone(false), 2000); } catch { /* copie impossible : le lien reste affiché */ }
      }}
      className="shrink-0 w-9 h-9 border border-ink-100 rounded-lg flex items-center justify-center text-ink-500 hover:bg-surface-2 transition"
    >
      {done ? <Check size={15} /> : <Copy size={15} />}
    </button>
  );
}
