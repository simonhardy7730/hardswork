"use client";
import { useState } from "react";

export default function CopyPost({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setOk(true);
          setTimeout(() => setOk(false), 2000);
        } catch {
          /* ignore */
        }
      }}
      className="shrink-0 rounded-lg bg-[#FFB900] px-3 py-2 text-xs font-black uppercase tracking-wide text-[#101F43] hover:brightness-95"
    >
      {ok ? "Copié ✓" : "Copier le post"}
    </button>
  );
}
