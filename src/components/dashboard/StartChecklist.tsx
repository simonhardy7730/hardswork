import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";

export type StartStep = { done: boolean; title: string; text: string; href: string; cta: string };

/** Premiers pas d'une entreprise : 4 étapes jusqu'au premier candidat contacté. Disparaît quand tout est fait. */
export default function StartChecklist({ steps, lang = "fr" }: { steps: StartStep[]; lang?: string }) {
  const l = (fr: string, nl: string) => (lang === "nl" ? nl : fr);
  const done = steps.filter((s) => s.done).length;
  if (done === steps.length) return null;
  const next = steps.findIndex((s) => !s.done);
  return (
    <div className="bg-white rounded-xl border border-ink-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-ink-100 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="font-bold text-[#101F43]">{l("Vos premiers pas sur Wolko", "Uw eerste stappen op Wolko")}</p>
          <p className="text-xs text-ink-500">{l("4 étapes pour recevoir et contacter votre premier candidat.", "4 stappen om uw eerste kandidaat te ontvangen en te contacteren.")}</p>
        </div>
        <div className="flex items-center gap-3 min-w-[160px]">
          <div className="flex-1 h-2 rounded-full bg-surface-2 overflow-hidden"><div className="h-full bg-brand rounded-full" style={{ width: `${(done / steps.length) * 100}%` }} /></div>
          <span className="text-xs font-bold text-ink-500 tabular-nums">{done}/{steps.length}</span>
        </div>
      </div>
      <ol className="divide-y divide-ink-100">
        {steps.map((s, i) => (
          <li key={s.title} className={`px-5 py-4 flex items-start gap-4 ${i === next ? "bg-[#FFFBF2]" : ""}`}>
            <span className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-black ${s.done ? "bg-green-500 text-white" : i === next ? "bg-brand text-[#101F43]" : "bg-surface-2 text-ink-400"}`}>
              {s.done ? <Check size={14} /> : i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold ${s.done ? "text-ink-400 line-through" : "text-[#101F43]"}`}>{s.title}</p>
              {!s.done && <p className="text-xs text-ink-500 mt-0.5">{s.text}</p>}
            </div>
            {!s.done && i === next && (
              <Link href={s.href} className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold bg-[#101F43] text-white px-3 py-2 rounded-lg">
                {s.cta} <ArrowRight size={12} />
              </Link>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
