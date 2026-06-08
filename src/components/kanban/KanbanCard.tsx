"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Phone, Mail, Clock, Check, StickyNote,
  MoreHorizontal, Lock, ChevronRight,
} from "lucide-react";
import { formatRelative } from "@/lib/utils";
import type { Application, ApplicationStatus } from "@/lib/supabase/types";
import { COLUMNS } from "./KanbanBoard";

interface Props {
  application: Application;
  onStatusChange: (id: string, status: ApplicationStatus) => Promise<void>;
  onNotesChange: (id: string, notes: string) => Promise<void>;
  jobOfferId: string;
  hasSubscription: boolean;
  isDragging?: boolean;
}

/* Couleurs tags */
const TAG_COLORS: Record<string, string> = {
  B:   "bg-blue-100 text-blue-700",
  C:   "bg-purple-100 text-purple-700",
  CE:  "bg-indigo-100 text-indigo-700",
};

export default function KanbanCard({
  application: app,
  onStatusChange,
  onNotesChange,
  hasSubscription,
  isDragging,
}: Props) {
  const [showNotes, setShowNotes]     = useState(false);
  const [notes, setNotes]             = useState(app.notes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [showMenu, setShowMenu]       = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } =
    useSortable({ id: app.id });

  const style = { transform: CSS.Transform.toString(transform), transition };

  async function saveNotes() {
    setSavingNotes(true);
    await onNotesChange(app.id, notes);
    setSavingNotes(false);
    setShowNotes(false);
  }

  /* Initiales */
  const parts    = app.applicant_name?.split(" ") ?? ["?"];
  const initials = `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();

  /* Tags compétences */
  const tags: string[] = [
    ...(app.licenses ?? []),
    ...(app.caces_types ?? []).map(c => `CACES ${c}`),
  ].slice(0, 4);

  const isLocked = !hasSubscription;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-xl border border-ink-100 p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all select-none relative ${
        isSortableDragging || isDragging ? "opacity-50 shadow-lg rotate-1" : ""
      }`}
    >
      {/* ── HEADER : avatar + nom + menu ── */}
      <div className="flex items-start gap-2.5 mb-2">

        {/* Avatar / masque */}
        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-display font-black text-sm ${
          isLocked ? "bg-ink-100 text-ink-300" : "bg-brand text-white"
        }`}>
          {isLocked ? <Lock size={13} /> : initials}
        </div>

        <div className="flex-1 min-w-0">
          {isLocked ? (
            <>
              <p className="text-[11px] font-black text-ink-300 uppercase tracking-wide leading-tight">
                Candidat masqué
              </p>
              <p className="text-[9px] font-bold text-ink-100 uppercase tracking-widest">
                (Verrouillé)
              </p>
            </>
          ) : (
            <p className="text-[13px] font-display font-black text-ink uppercase tracking-tight leading-tight truncate">
              {parts[0]}{" "}
              {parts[1] && <span className="text-brand">[{parts.slice(1).join(" ").toUpperCase()}]</span>}
            </p>
          )}
          {/* Titre / métier */}
          {app.applicant_name && (
            <p className="text-[10px] text-ink-500 truncate mt-0.5">
              {isLocked ? "— Profil masqué —" : app.applicant_name}
            </p>
          )}
        </div>

        {/* Menu "..." */}
        <div className="relative shrink-0" onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-6 h-6 rounded-md flex items-center justify-center text-ink-300 hover:text-ink hover:bg-surface-2 transition"
          >
            <MoreHorizontal size={13} />
          </button>
          {showMenu && (
            <div className="absolute top-full right-0 mt-1 z-30 w-36 bg-white rounded-xl border border-ink-100 shadow-xl py-1 overflow-hidden">
              {COLUMNS.filter(c => c.id !== app.status).map(col => (
                <button key={col.id}
                  onClick={() => { onStatusChange(app.id, col.id as ApplicationStatus); setShowMenu(false); }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-ink hover:bg-surface-2 transition">
                  <ChevronRight size={10} className="text-brand" /> {col.label}
                </button>
              ))}
              <div className="border-t border-ink-100 mt-1 pt-1">
                <button
                  onClick={() => { setShowNotes(!showNotes); setShowMenu(false); }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-ink hover:bg-surface-2 transition">
                  <StickyNote size={10} className="text-amber-500" /> Notes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── CONTACT (si débloqué) ── */}
      {!isLocked && (
        <div className="flex items-center gap-2 mb-2" onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}>
          <a href={`tel:${app.applicant_phone}`}
            className="flex items-center gap-1.5 text-[11px] text-brand font-bold hover:underline">
            <Phone size={11} />
            {app.applicant_phone}
          </a>
          {app.applicant_email && (
            <a href={`mailto:${app.applicant_email}`}
              className="flex items-center gap-1 text-[11px] text-ink-300 hover:text-brand transition">
              <Mail size={11} />
            </a>
          )}
        </div>
      )}

      {/* ── TAGS compétences ── */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {tags.map((tag, i) => (
            <span key={i}
              className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wide ${
                TAG_COLORS[tag] ?? "bg-surface border border-ink-100 text-ink-500"
              }`}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* ── Temps + disponibilité ── */}
      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-ink-100">
        <span className="flex items-center gap-1 text-[10px] text-ink-300">
          <Clock size={9} />
          {formatRelative(app.applied_at)}
        </span>
        {app.availability === "immediate" && (
          <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full uppercase">
            Dispo maintenant
          </span>
        )}
      </div>

      {/* ── Zone notes ── */}
      {showNotes && (
        <div className="mt-2 pt-2 border-t border-ink-100" onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            placeholder="Notes sur ce candidat..."
            className="w-full px-2 py-1.5 text-xs border border-ink-100 rounded-lg resize-none focus:outline-none focus:border-brand transition"
          />
          <button onClick={saveNotes} disabled={savingNotes}
            className="mt-1 flex items-center gap-1 text-[10px] text-white bg-brand px-2 py-1 rounded-lg hover:bg-brand-dark transition">
            {savingNotes ? "…" : <><Check size={9} /> Sauvegarder</>}
          </button>
        </div>
      )}
    </div>
  );
}
