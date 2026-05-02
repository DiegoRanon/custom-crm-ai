import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import {
  Mail,
  Phone,
  Plus,
  Search,
  Building2,
  DollarSign,
  CalendarDays,
} from "lucide-react";
import { LeadScoreLabel, Stage, PrismaClient } from "@prisma/client";

import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

const stageLabels: Record<Stage, string> = {
  New: "New",
  Contacted: "Contacted",
  Qualified: "Qualified",
  Proposal: "Proposal",
  Negotiation: "Negotiation",
  Won: "Won",
  Lost: "Lost",
};

const stageStyles: Record<Stage, string> = {
  New: "bg-slate-100 text-slate-700",
  Contacted: "bg-blue-50 text-blue-700",
  Qualified: "bg-purple-50 text-purple-700",
  Proposal: "bg-amber-50 text-amber-700",
  Negotiation: "bg-orange-50 text-orange-700",
  Won: "bg-emerald-50 text-emerald-700",
  Lost: "bg-red-50 text-red-700",
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

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default async function LeadsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const leads = await prisma.lead.findMany({
    where: {
      userId,
    },
    include: {
      scores: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
      activities: {
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

  const totalPipelineValue = leads.reduce(
    (total, lead) => total + lead.estimatedValue,
    0,
  );

  const openLeads = leads.filter(
    (lead) => lead.stage !== Stage.Won && lead.stage !== Stage.Lost,
  ).length;

  const wonLeads = leads.filter((lead) => lead.stage === Stage.Won).length;

  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-medium text-slate-500">Lead Management</p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Leads
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Manage prospects, track follow-ups, and move opportunities through
            your CRM pipeline.
          </p>
        </div>

        <Link
          href="/leads/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" />
          New Lead
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          title="Total Leads"
          value={leads.length.toString()}
          description="All leads in your CRM"
        />

        <SummaryCard
          title="Open Leads"
          value={openLeads.toString()}
          description="Active opportunities"
        />

        <SummaryCard
          title="Pipeline Value"
          value={formatCurrency(totalPipelineValue)}
          description={`${wonLeads} won leads`}
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-6 md:flex-row md:items-center">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Lead Directory
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Review lead details, stage, score, and latest activity.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              placeholder="Search leads..."
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
            />
          </div>
        </div>

        {leads.length === 0 ? (
          <EmptyLeadsState />
        ) : (
          <div className="divide-y divide-slate-100">
            {leads.map((lead) => {
              const latestScore = lead.scores[0];
              const latestActivity = lead.activities[0];

              return (
                <Link
                  key={lead.id}
                  href={`/leads/${lead.id}`}
                  className="block p-6 transition hover:bg-slate-50"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-900">
                          {lead.name}
                        </h3>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            stageStyles[lead.stage]
                          }`}
                        >
                          {stageLabels[lead.stage]}
                        </span>

                        {latestScore && (
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              scoreStyles[latestScore.label]
                            }`}
                          >
                            {latestScore.label} · {latestScore.score}/100
                          </span>
                        )}
                      </div>

                      <div className="mt-3 grid gap-2 text-sm text-slate-500 md:grid-cols-2 xl:grid-cols-4">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-slate-400" />
                          <span className="truncate">{lead.email}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-slate-400" />
                          <span>{lead.phone ?? "No phone"}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-slate-400" />
                          <span className="truncate">
                            {lead.company ?? "No company"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-slate-400" />
                          <span>
                            {lead.lastContactedAt
                              ? formatDate(lead.lastContactedAt)
                              : "Not contacted"}
                          </span>
                        </div>
                      </div>

                      {latestActivity && (
                        <p className="mt-3 text-sm text-slate-500">
                          Latest activity:{" "}
                          <span className="font-medium text-slate-700">
                            {latestActivity.description}
                          </span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-6 lg:flex-col lg:items-end">
                      <div className="flex items-center gap-2 text-slate-900">
                        <DollarSign className="h-4 w-4 text-slate-400" />
                        <span className="text-lg font-bold">
                          {formatCurrency(lead.estimatedValue)}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400">
                        Created {formatDate(lead.createdAt)}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>

      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function EmptyLeadsState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
        <Building2 className="h-6 w-6 text-slate-500" />
      </div>

      <h3 className="text-base font-semibold text-slate-900">No leads yet</h3>

      <p className="mt-2 max-w-sm text-sm text-slate-500">
        Create your first lead to start tracking your sales pipeline,
        opportunities, and follow-up activity.
      </p>

      <Link
        href="/leads/new"
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        <Plus className="h-4 w-4" />
        Create Lead
      </Link>
    </div>
  );
}
