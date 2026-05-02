import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Stage, PrismaClient } from "@prisma/client";
import { STAGES } from "@/types/types";

import { authOptions } from "@/lib/auth";
import { KanbanBoard } from "./KanbanBoard";

const prisma = new PrismaClient();

export default async function KanbanPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const leads = await prisma.lead.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      scores: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const serializedLeads = leads.map((lead) => ({
    id: lead.id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    company: lead.company,
    source: lead.source,
    stage: lead.stage,
    estimatedValue: lead.estimatedValue,
    description: lead.description,
    lastContactedAt: lead.lastContactedAt?.toISOString() ?? null,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
    score: lead.scores[0]
      ? {
          id: lead.scores[0].id,
          score: lead.scores[0].score,
          label: lead.scores[0].label,
          reason: lead.scores[0].reason,
        }
      : null,
  }));

  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-medium text-slate-500">Sales Pipeline</p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Kanban Board
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Drag and drop leads between stages to manage your CRM pipeline.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          Total leads:{" "}
          <span className="font-semibold text-slate-900">{leads.length}</span>
        </div>
      </section>

      <KanbanBoard initialLeads={serializedLeads} stages={STAGES} />
    </div>
  );
}
