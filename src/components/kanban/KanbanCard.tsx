"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Phone, Mail, Clock, Check, StickyNote,
  MoreHorizontal, Lock, ChevronRight, Trash2,
} from "lucide-react";
import { formatRelative } from "@/lib/utils";
import type { Application, ApplicationStatus } from "@/lib/supabase/types";
import { COLUMNS } from "./KanbanBoard";
import { DAYS, SLOTS } from "@/lib/candidate/availability";
import { ageFromBirthDate } from "@/lib/candidate/age";
import { useL, useLang } from "@/lib/i18n/context";
import { GradeChip } from "./GradeBadge";

interface Props {
  application: Application;
  onStatusChange: (id: string, status: ApplicationStatus) => Promise<void>;
  onNotesChange: (id: string, notes: string) => Promise<void>;
  jobOfferId: string;
  hasSubscription: boolean;
  isDragging?: boolean;
  onOpen?: (app: Application) => void;
  onDelete?: (id: string) => void;
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
  onOpen,
  onDelete,
}: Props) {
  const l = useL();
  const lang = useLang();
  const [showNotes, setShowNotes]     = useState(false);
  const [notes, setNotes]             = useState(app.notes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [showMenu, setShowMenu]       = useState(false);
  const [menuPos, setMenuPos]         = useState<{ left: number; top?: number; bottom?: number }>({ left: 0 });
  const menuBtn = useRef<HTMLButtonElement>(null);

  /* Menu affiché dans <body> (portail) : il n'est plus rogné par le tableau et s'ouvre vers le haut s'il manque de place. */
  function toggleMenu() {
    if (showMenu) return setShowMenu(false);
    const r = menuBtn.current?.getBoundingClientRect();
    if (r) {
      const MENU_W = 160, EST_H = 250;
      const left = Math.max(8, Math.min(r.right - MENU_W, window.innerWidth - MENU_W - 8));
      setMenuPos(r.bottom + EST_H > window.innerHeight
        ? { left, bottom: window.innerHeight - r.top + 4 }
        : { left, top: r.bottom + 4 });
    }
    setShowMenu(true);
  }
  useEffect(() => {
    if (!showMenu) return;
    const close = () => setShowMenu(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => { window.removeEventListener("scroll", close, true); window.removeEventListener("resize", close); };
  }, [showMenu]);

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
  const age = app.birth_date ? ageFromBirthDate(app.birth_date) : null;
  const tags: string[] = [
    ...(age !== null ? [`${age} ${l("ans", "jaar")}`] : []),
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
      onClick={() => onOpen?.(app)}
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
                {l("Candidat masqué", "Verborgen kandidaat")}
              </p>
              <p className="text-[9px] font-bold text-ink-100 uppercase tracking-widest">
                {l("(Verrouillé)", "(Vergrendeld)")}
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
              {isLocked ? l("— Profil masqué —", "— Verborgen profiel —") : (app.job_title ?? app.applicant_name)}
            </p>
          )}
        </div>

        {/* Menu "..." */}
        <div className="relative shrink-0" onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}>
          <button
            ref={menuBtn}
            onClick={toggleMenu}
            aria-haspopup="menu" aria-expanded={showMenu}
            className="w-6 h-6 rounded-md flex items-center justify-center text-ink-300 hover:text-ink hover:bg-surface-2 transition"
          >
            <MoreHorizontal size={13} />
          </button>
          {showMenu && createPortal(
            <>
            <div className="fixed inset-0 z-[90]" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} onPointerDown={(e) => e.stopPropagation()} />
            <div role="menu" style={menuPos} onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}
              className="fixed z-[100] w-40 bg-white rounded-xl border border-ink-100 shadow-xl py-1 overflow-hidden">
              {COLUMNS.filter(c => c.id !== app.status).map(col => (
                <button key={col.id}
                  onClick={() => { onStatusChange(app.id, col.id as ApplicationStatus); setShowMenu(false); }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-ink hover:bg-surface-2 transition">
                  <ChevronRight size={10} className="text-brand" /> {l(col.label, col.nl)}
                </button>
              ))}
              {app.status === "refuse" && onDelete && (
                <button
                  onClick={() => { setShowMenu(false); onDelete(app.id); }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 transition">
                  <Trash2 size={10} /> {l("Supprimer", "Verwijderen")}
                </button>
              )}
              <div className="border-t border-ink-100 mt-1 pt-1">
                <button
                  onClick={() => { setShowNotes(!showNotes); setShowMenu(false); }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-ink hover:bg-surface-2 transition">
                  <StickyNote size={10} className="text-amber-500" /> {l("Notes", "Notities")}
                </button>
              </div>
            </div>
            </>,
            document.body
          )}
        </div>
      </div>

      {!isLocked && app.match?.grade && <div className="mb-2"><GradeChip match={app.match} /></div>}

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

      {/* ── Créneaux de la candidature rapide ── */}
      {(app.availability_slots?.length ?? 0) > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {app.availability_slots!.slice(0, 4).map(k => {
            const [d, s] = k.split(":");
            const day = DAYS.find(x => x.key === d), slot = SLOTS.find(x => x.key === s);
            if (!day || !slot) return null;
            return (
              <span key={k} className="text-[9px] font-bold text-brand bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full">
                {l(day.fr, day.nl)} · {l(slot.fr, slot.nl)}
              </span>
            );
          })}
          {app.availability_slots!.length > 4 && (
            <span className="text-[9px] font-bold text-ink-300 px-1 py-0.5">+{app.availability_slots!.length - 4}</span>
          )}
        </div>
      )}

      {/* ── Aperçu de la note ── */}
      {!isLocked && app.notes && (
        <p className="mt-2 flex items-start gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-1.5 py-1">
          <StickyNote size={9} className="mt-0.5 shrink-0" />
          <span className="line-clamp-2">{app.notes}</span>
        </p>
      )}

      {/* ── Temps + disponibilité ── */}
      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-ink-100">
        <span className="flex items-center gap-1 text-[10px] text-ink-300">
          <Clock size={9} />
          {formatRelative(app.applied_at, lang)}
        </span>
        {app.availability === "immediate" && (
          <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full uppercase">
            {l("Dispo maintenant", "Nu beschikbaar")}
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
            placeholder={l("Notes sur ce candidat...", "Notities over deze kandidaat...")}
            className="w-full px-2 py-1.5 text-xs border border-ink-100 rounded-lg resize-none focus:outline-none focus:border-brand transition"
          />
          <button onClick={saveNotes} disabled={savingNotes}
            className="mt-1 flex items-center gap-1 text-[10px] text-white bg-brand px-2 py-1 rounded-lg hover:bg-brand-dark transition">
            {savingNotes ? "…" : <><Check size={9} /> {l("Sauvegarder", "Opslaan")}</>}
          </button>
        </div>
      )}
    </div>
  );
}
