"use client";

import { useDroppable } from "@dnd-kit/core";

interface Column {
  id: string;
  label: string;
  color: string;
  accent: string;
}

interface Props {
  column: Column;
  count: number;
  children: React.ReactNode;
}

export default function KanbanColumn({ column, count, children }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      className={`flex flex-col w-64 shrink-0 rounded-xl border ${column.color} transition-all ${
        isOver ? "ring-2 ring-brand/40 scale-[1.01]" : ""
      }`}
    >
      {/* Header colonne — style bold uppercase */}
      <div className="px-3 py-3 border-b border-current/10">
        <div className="flex items-center justify-between">
          <span className="font-display font-black text-[13px] uppercase tracking-wider"
            style={{ color: column.accent }}>
            {column.label}
          </span>
          <span
            className="text-[11px] font-black w-6 h-6 rounded-full flex items-center justify-center text-white"
            style={{ background: column.accent }}
          >
            {count}
          </span>
        </div>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className="flex-1 p-2 space-y-2 min-h-[120px]"
      >
        {children}
        {count === 0 && (
          <div className="text-center py-8 text-[11px] text-ink-300 border-2 border-dashed border-current/20 rounded-lg">
            Déposez ici
          </div>
        )}
      </div>
    </div>
  );
}
