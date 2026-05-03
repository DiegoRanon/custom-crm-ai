"use client";

import Link from "next/link";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { LeadScoreLabel, Stage } from "@prisma/client";
import {
  Building2,
  CalendarDays,
  DollarSign,
  GripVertical,
  Mail,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type KanbanLead = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  source: string;
  stage: Stage;
  estimatedValue: number;
  description: string | null;
  lastContactedAt: string | null;
  createdAt: string;
  updatedAt: string;
  score: {
    id: string;
    score: number;
    label: LeadScoreLabel;
    reason: string;
  } | null;
};

type KanbanBoardProps = {
  initialLeads: KanbanLead[];
  stages: readonly Stage[];
};

const stageLabels: Record<Stage, string> = {
  New: "New",
  Contacted: "Contacted",
  Qualified: "Qualified",
  Proposal: "Proposal",
  Negotiation: "Negotiation",
  Won: "Won",
  Lost: "Lost",
};

const stageDescriptions: Record<Stage, string> = {
  New: "Fresh leads to review.",
  Contacted: "Initial outreach completed.",
  Qualified: "Good fit confirmed.",
  Proposal: "Proposal sent.",
  Negotiation: "Deal terms in progress.",
  Won: "Closed successfully.",
  Lost: "Not moving forward.",
};

const scoreStyles: Record<LeadScoreLabel, string> = {
  Hot: "bg-red-50 text-red-700",
  Warm: "bg-amber-50 text-amber-700",
  Cold: "bg-slate-100 text-slate-600",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function KanbanBoard({ initialLeads, stages }: KanbanBoardProps) {
  const [leads, setLeads] = useState<KanbanLead[]>(initialLeads);
  const [activeLead, setActiveLead] = useState<KanbanLead | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const leadsByStage = useMemo(() => {
    return stages.reduce(
      (acc, stage) => {
        acc[stage] = leads.filter((lead) => lead.stage === stage);
        return acc;
      },
      {} as Record<Stage, KanbanLead[]>,
    );
  }, [leads, stages]);

  function handleDragStart(event: DragStartEvent) {
    const lead = leads.find((item) => item.id === event.active.id);

    if (lead) {
      setActiveLead(lead);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    setActiveLead(null);

    if (!over) {
      return;
    }

    const leadId = String(active.id);
    const targetStage = over.id as Stage;

    if (!stages.includes(targetStage)) {
      return;
    }

    const currentLead = leads.find((lead) => lead.id === leadId);

    if (!currentLead) {
      return;
    }

    if (currentLead.stage === targetStage) {
      return;
    }

    const previousLeads = leads;

    setLeads((currentLeads) =>
      currentLeads.map((lead) =>
        lead.id === leadId
          ? {
              ...lead,
              stage: targetStage,
              updatedAt: new Date().toISOString(),
            }
          : lead,
      ),
    );

    setIsUpdating(true);

    try {
      const response = await fetch(`/api/leads/${leadId}/stage`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stage: targetStage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setLeads(previousLeads);
        toast.error(data.message || "Unable to update lead stage.");
        return;
      }

      toast.success(`Lead moved to ${stageLabels[targetStage]}.`);
    } catch (error) {
      setLeads(previousLeads);
      toast.error("Something went wrong while updating the lead.");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <section className="space-y-4">
      {isUpdating && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          Updating pipeline...
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid gap-4 overflow-x-auto pb-4 xl:grid-cols-7">
          {stages.map((stage) => (
            <KanbanColumn
              key={stage}
              stage={stage}
              leads={leadsByStage[stage]}
            />
          ))}
        </div>

        <DragOverlay>
          {activeLead ? <LeadCard lead={activeLead} isOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </section>
  );
}

function KanbanColumn({ stage, leads }: { stage: Stage; leads: KanbanLead[] }) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
  });

  const totalValue = leads.reduce(
    (total, lead) => total + lead.estimatedValue,
    0,
  );

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[500px] rounded-2xl border p-4 transition ${
        isOver
          ? "border-slate-900 bg-slate-100"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <div className="mb-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-900">
            {stageLabels[stage]}
          </h2>

          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 shadow-sm">
            {leads.length}
          </span>
        </div>

        <p className="mt-1 text-xs text-slate-500">
          {stageDescriptions[stage]}
        </p>

        <p className="mt-3 text-xs font-medium text-slate-500">
          Value:{" "}
          <span className="text-slate-800">{formatCurrency(totalValue)}</span>
        </p>
      </div>

      <div className="space-y-3">
        {leads.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-center text-xs text-slate-400">
            Drop leads here
          </div>
        ) : (
          leads.map((lead) => <DraggableLeadCard key={lead.id} lead={lead} />)
        )}
      </div>
    </div>
  );
}

function DraggableLeadCard({ lead }: { lead: KanbanLead }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: lead.id,
    });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? "opacity-40" : "opacity-100"}
    >
      <LeadCard
        lead={lead}
        dragAttributes={attributes}
        dragListeners={listeners}
      />
    </div>
  );
}

function LeadCard({
  lead,
  isOverlay,
  dragAttributes,
  dragListeners,
}: {
  lead: KanbanLead;
  isOverlay?: boolean;
  dragAttributes?: React.HTMLAttributes<HTMLButtonElement>;
  dragListeners?: React.HTMLAttributes<HTMLButtonElement>;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition ${
        isOverlay ? "rotate-2 shadow-lg" : "hover:shadow-md"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <Link href={`/leads/${lead.id}`} className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-slate-900">
            {lead.name}
          </h3>

          <p className="mt-1 truncate text-xs text-slate-500">
            {lead.company ?? "No company"}
          </p>
        </Link>

        <button
          type="button"
          className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          {...dragAttributes}
          {...dragListeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 space-y-2 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Mail className="h-3.5 w-3.5 text-slate-400" />
          <span className="truncate">{lead.email}</span>
        </div>

        <div className="flex items-center gap-2">
          <Building2 className="h-3.5 w-3.5 text-slate-400" />
          <span className="truncate">{lead.source}</span>
        </div>

        <div className="flex items-center gap-2">
          <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
          <span>Created {formatDate(lead.createdAt)}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
          <DollarSign className="h-4 w-4 text-slate-400" />
          {formatCurrency(lead.estimatedValue)}
        </div>

        {lead.score && (
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium ${
              scoreStyles[lead.score.label]
            }`}
          >
            {lead.score.label}
          </span>
        )}
      </div>
    </div>
  );
}
