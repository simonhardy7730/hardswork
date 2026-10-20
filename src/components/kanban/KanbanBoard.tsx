"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import KanbanColumn from "./KanbanColumn";
import KanbanCard from "./KanbanCard";
import ProfileModal from "./ProfileModal";
import { deleteRefusedApplication, updateApplicationStatus } from "@/app/(dashboard)/dashboard/candidatures/actions";
import { Lock } from "lucide-react";
import type { Application, ApplicationStatus } from "@/lib/supabase/types";
import { useL } from "@/lib/i18n/context";
import { DAYS, SLOTS } from "@/lib/candidate/availability";

interface Props {
  applications: Application[];
  jobOfferId: string;
  candidatureUrl: string;
  hasSubscription: boolean;
  /** Offres dont les contacts/CV sont débloqués par un crédit WOLKO Flash (sans abonnement) */
  unlockedOfferIds?: string[];
}

/* ─── Colonnes pipeline ──────────────────────────────── */
export const COLUMNS: {
  id: ApplicationStatus;
  label: string;
  nl: string;
  color: string;
  accent: string;
}[] = [
  {
    id: "nouveau",
    label: "Nouveaux", nl: "Nieuw",
    color: "bg-[#FFFBF2] border-ink-100",
    accent: "#3B82F6",
  },
  {
    id: "contacte",
    label: "En révision", nl: "In behandeling",
    color: "bg-amber-50 border-amber-100",
    accent: "#D97706",
  },
  {
    id: "entretien",
    label: "Entretien", nl: "Gesprek",
    color: "bg-purple-50 border-purple-100",
    accent: "#7C3AED",
  },
  {
    id: "place",
    label: "Recruté", nl: "Aangenomen",
    color: "bg-emerald-50 border-emerald-100",
    accent: "#059669",
  },
  {
    id: "refuse",
    label: "Refusé", nl: "Afgewezen",
    color: "bg-red-50 border-red-100",
    accent: "#DC2626",
  },
];

export default function KanbanBoard({
  applications: initialApps,
  jobOfferId,
  hasSubscription,
  unlockedOfferIds = [],
}: Props) {
  const router   = useRouter();
  const l = useL();
  const [apps, setApps]     = useState<Application[]>(initialApps);
  const unlockedSet = new Set(unlockedOfferIds);
  const isUnlocked = (a: Application) => hasSubscription || unlockedSet.has(a.job_offer_id);
  const allUnlocked = hasSubscription || (apps.length > 0 && apps.every(isUnlocked));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const activeApp = apps.find(a => a.id === activeId);

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string);
  }

  async function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over) return;
    const appId = active.id as string;
    // Déposé sur une colonne → son id ; déposé sur une carte → le statut de la colonne de cette carte.
    const overId = over.id as string;
    const column = COLUMNS.find(c => c.id === overId);
    const newStatus = (column ? column.id : apps.find(a => a.id === overId)?.status) as ApplicationStatus | undefined;
    if (!newStatus) return;
    const app = apps.find(a => a.id === appId);
    if (!app || app.status === newStatus) return;

    setApps(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));

    const { ok } = await updateApplicationStatus(appId, newStatus);

    if (!ok) {
      setApps(prev => prev.map(a => a.id === appId ? { ...a, status: app.status } : a));
    } else {
      router.refresh();
    }
  }

  async function updateStatus(appId: string, newStatus: ApplicationStatus) {
    const app = apps.find(a => a.id === appId);
    if (!app) return;
    setApps(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
    const { ok } = await updateApplicationStatus(appId, newStatus);
    if (!ok) setApps(prev => prev.map(a => a.id === appId ? { ...a, status: app.status } : a));
    router.refresh();
  }

  async function updateNotes(appId: string, notes: string) {
    setApps(prev => prev.map(a => a.id === appId ? { ...a, notes } : a));
    const supabase = createClient();
    await supabase.from("applications").update({ notes }).eq("id", appId);
  }

  async function deleteApp(appId: string) {
    if (!window.confirm(l("Supprimer définitivement cette candidature ? Cette action est irréversible.", "Deze sollicitatie definitief verwijderen? Dit kan niet ongedaan worden gemaakt."))) return;
    const res = await deleteRefusedApplication(appId);
    if (res.ok) {
      setApps(prev => prev.filter(a => a.id !== appId));
      setOpenId(null);
      router.refresh();
    } else {
      window.alert(l("Suppression impossible. Réessayez.", "Verwijderen mislukt. Probeer opnieuw."));
    }
  }

  const totalApps = apps.length;

  // Filtres recruteur : jour / plage horaire / candidature rapide (uniquement si des créneaux existent)
  const [fDay, setFDay] = useState("");
  const [fSlot, setFSlot] = useState("");
  const [fQuick, setFQuick] = useState(false);
  const hasSlots = apps.some(a => (a.availability_slots?.length ?? 0) > 0);
  const visible = apps.filter(a => {
    const s = a.availability_slots ?? [];
    if (fQuick && !a.quick_apply) return false;
    if (fDay && !s.some(x => x.startsWith(`${fDay}:`))) return false;
    if (fSlot && !s.some(x => x.endsWith(`:${fSlot}`))) return false;
    return true;
  });
  const sel = "text-xs border border-ink-100 rounded-lg px-2.5 py-1.5 bg-white text-ink";

  return (
    <div>
      {/* ── Bandeau Pipeline ─────────────────────────── */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="font-display font-black text-ink uppercase tracking-tight text-lg leading-tight">
            {l("Gestion des candidatures", "Beheer van sollicitaties")} —{" "}
            <span className="text-brand">{l("Pipeline B2B", "B2B-pipeline")}</span>
          </h2>
          <p className="text-xs text-ink-500 mt-0.5">
            {totalApps} {totalApps !== 1 ? l("candidatures", "sollicitaties") : l("candidature", "sollicitatie")} {l("au total · Glissez-déposez pour changer le statut", "in totaal · Sleep om de status te wijzigen")}
          </p>
        </div>

        {/* Bouton DÉBLOQUER TOUT si non abonné */}
        {!allUnlocked && (
          <Link href="/#tarifs"
            className="flex items-center gap-2 font-display font-black uppercase tracking-wide text-white bg-brand hover:bg-brand-dark transition rounded-xl px-4 py-2.5 text-[13px] shadow-md shadow-brand/20">
            <Lock size={13} />
            {l("Débloquer tout", "Alles ontgrendelen")}
          </Link>
        )}

        {allUnlocked && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {l("Contacts débloqués", "Contacten ontgrendeld")}
          </span>
        )}
      </div>

      {hasSlots && (
        <div className="flex items-center gap-2 flex-wrap mb-4" aria-label={l("Filtrer par disponibilités", "Filteren op beschikbaarheid")}>
          <select className={sel} value={fDay} onChange={e => setFDay(e.target.value)} aria-label={l("Jour", "Dag")}>
            <option value="">{l("Tous les jours", "Alle dagen")}</option>
            {DAYS.map(d => <option key={d.key} value={d.key}>{l(d.frLong, d.nlLong)}</option>)}
          </select>
          <select className={sel} value={fSlot} onChange={e => setFSlot(e.target.value)} aria-label={l("Plage horaire", "Uurrooster")}>
            <option value="">{l("Toutes les plages", "Alle uren")}</option>
            {SLOTS.map(s => <option key={s.key} value={s.key}>{l(s.fr, s.nl)}</option>)}
          </select>
          <label className="flex items-center gap-1.5 text-xs text-ink-500 cursor-pointer">
            <input type="checkbox" checked={fQuick} onChange={e => setFQuick(e.target.checked)} className="accent-brand" />
            {l("Candidatures rapides", "Snelle sollicitaties")}
          </label>
          {(fDay || fSlot || fQuick) && (
            <span className="text-xs text-ink-300">{visible.length}/{totalApps}</span>
          )}
        </div>
      )}

      {/* ── Kanban ───────────────────────────────────── */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory sm:snap-none -mx-3 px-3 sm:mx-0 sm:px-0">
          {COLUMNS.map(col => {
            const colApps = visible.filter(a => a.status === col.id);
            return (
              <KanbanColumn key={col.id} column={col} count={colApps.length}>
                <SortableContext
                  items={colApps.map(a => a.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {colApps.map(app => (
                    <KanbanCard
                      key={app.id}
                      application={app}
                      onStatusChange={updateStatus}
                      onNotesChange={updateNotes}
                      jobOfferId={jobOfferId}
                      hasSubscription={isUnlocked(app)}
                      onOpen={(a) => setOpenId(a.id)}
                      onDelete={deleteApp}
                    />
                  ))}
                </SortableContext>
              </KanbanColumn>
            );
          })}
        </div>

        <DragOverlay>
          {activeApp && (
            <KanbanCard
              application={activeApp}
              onStatusChange={async () => {}}
              onNotesChange={async () => {}}
              jobOfferId={jobOfferId}
              hasSubscription={isUnlocked(activeApp)}
              isDragging
            />
          )}
        </DragOverlay>
      </DndContext>

      {openId && apps.find(a => a.id === openId) && (
        <ProfileModal
          application={apps.find(a => a.id === openId)!}
          hasSubscription={isUnlocked(apps.find(a => a.id === openId)!)}
          onClose={() => setOpenId(null)}
          onNotesChange={updateNotes}
          onDelete={deleteApp}
        />
      )}
    </div>
  );
}
