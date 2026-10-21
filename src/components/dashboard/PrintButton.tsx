"use client";

import { Printer } from "lucide-react";

export default function PrintButton({ label }: { label: string }) {
  return (
    <button type="button" onClick={() => window.print()}
      className="h-10 px-4 rounded-xl bg-brand text-[#101F43] text-xs font-black uppercase inline-flex items-center gap-2">
      <Printer size={14} /> {label}
    </button>
  );
}
