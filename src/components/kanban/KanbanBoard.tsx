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
import { Lock } from "lucide-react";
import type { Application, ApplicationStatus } from "@/lib/supabase/types";

interface Props {
  applications: Application[];
  jobOfferId: string;
  candidatureUrl: string;
  hasSubscription: boolean;
}

/* ─── Colonnes pipeline ──────────────────────────────── */
export const COLUMNS: {
  id: ApplicationStatus;
  label: string;
  color: string;
  accent: string;
}[] = [
  {
    id: "nouveau",
    label: "Nouveaux",
    color: "bg-[#FAFAF8] border-ink-100",
    accent: "#3B82F6",
  },
  {
    id: "contacte",
    label: "En révision",
    color: "bg-amber-50 border-amber-100",
    accent: "#D97706",
  },
  {
    id: "entretien",
    label: "Entretien",
    color: "bg-purple-50 border-purple-100",
    accent: "#7C3AED",
  },
  {
    id: "place",
    label: "Recruté",
    color: "bg-emerald-50 border-emerald-100",
    accent: "#059669",
  },
  {
    id: "refuse",
    label: "Refusé",
    color: "bg-red-50 border-red-100",
    accent: "#DC2626",
  },
];

export default function KanbanBoard({
  applications: initialApps,
  jobOfferId,
  hasSubscription,
}: Props) {
  const router   = useRouter();
  const [apps, setApps]     = useState<Application[]>(initialApps);
  const [activeId, setActiveId] = useState<string | null>(null);

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
    const newStatus = over.id as ApplicationStatus;
    const app = apps.find(a => a.id === appId);
    if (!app || app.status === newStatus) return;

    setApps(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));

    const supabase = createClient();
    const { error } = await supabase
      .from("applications").update({ status: newStatus }).eq("id", appId);

    if (error) {
      setApps(prev => prev.map(a => a.id === appId ? { ...a, status: app.status } : a));
    } else {
      router.refresh();
    }
  }

  async function updateStatus(appId: string, newStatus: ApplicationStatus) {
    const app = apps.find(a => a.id === appId);
    if (!app) return;
    setApps(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
    const supabase = createClient();
    await supabase.from("applications").update({ status: newStatus }).eq("id", appId);
    router.refresh();
  }

  async function updateNotes(appId: string, notes: string) {
    setApps(prev => prev.map(a => a.id === appId ? { ...a, notes } : a));
    const supabase = createClient();
    await supabase.from("applications").update({ notes }).eq("id", appId);
  }

  const totalApps = apps.length;

  return (
    <div>
      {/* ── Bandeau Pipeline ─────────────────────────── */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="font-display font-black text-ink uppercase tracking-tight text-lg leading-tight">
            Gestion des candidatures —{" "}
            <span className="text-brand">Pipeline B2B</span>
          </h2>
          <p className="text-xs text-ink-500 mt-0.5">
            {totalApps} candidature{totalApps !== 1 ? "s" : ""} au total · Glissez-déposez pour changer le statut
          </p>
        </div>

        {/* Bouton DÉBLOQUER TOUT si non abonné */}
        {!hasSubscription && (
          <Link href="/#tarifs"
            className="flex items-center gap-2 font-display font-black uppercase tracking-wide text-white bg-brand hover:bg-brand-dark transition rounded-xl px-4 py-2.5 text-[13px] shadow-md shadow-brand/20">
            <Lock size={13} />
            Débloquer tout
          </Link>
        )}

        {hasSubscription && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Contacts débloqués
          </span>
        )}
      </div>

      {/* ── Kanban ───────────────────────────────────── */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-4">
          {COLUMNS.map(col => {
            const colApps = apps.filter(a => a.status === col.id);
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
                      hasSubscription={hasSubscription}
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
              hasSubscription={hasSubscription}
              isDragging
            />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
