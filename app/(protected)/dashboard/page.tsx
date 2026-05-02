import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import {
  BarChart3,
  DollarSign,
  Flame,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { Stage, PrismaClient } from "@prisma/client";

import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

const stages: Stage[] = [
  Stage.New,
  Stage.Contacted,
  Stage.Qualified,
  Stage.Proposal,
  Stage.Negotiation,
  Stage.Won,
  Stage.Lost,
];

const stageLabels: Record<Stage, string> = {
  New: "New",
  Contacted: "Contacted",
  Qualified: "Qualified",
  Proposal: "Proposal",
  Negotiation: "Negotiation",
  Won: "Won",
  Lost: "Lost",
};

type DashboardSort = "estimatedValue-desc" | "createdAt-asc" | "stage-desc";

const sortLabels: Record<DashboardSort, string> = {
  "estimatedValue-desc": "Value: high to low",
  "createdAt-asc": "Creation date: oldest first",
  "stage-desc": "Stage: descending",
};

function getTopOpportunitiesOrderBy(sort: DashboardSort) {
  switch (sort) {
    case "createdAt-asc":
      return {
        createdAt: "asc" as const,
      };

    case "stage-desc":
      return {
        stage: "desc" as const,
      };

    case "estimatedValue-desc":
    default:
      return {
        estimatedValue: "desc" as const,
      };
  }
}

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

type DashboardPageProps = {
  searchParams?: Promise<{
    sort?: string;
  }>;
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const resolvedSearchParams = await searchParams;
  const sortParam = resolvedSearchParams?.sort;

  const selectedSort: DashboardSort =
    sortParam === "createdAt-asc" || sortParam === "stage-desc"
      ? sortParam
      : "estimatedValue-desc";

  const userId = session.user.id;

  const [
    totalLeads,
    pipelineValueResult,
    wonValueResult,
    hotLeads,
    wonLeads,
    lostLeads,
    leadsByStage,
    recentActivities,
    topOpportunities,
  ] = await Promise.all([
    prisma.lead.count({
      where: {
        userId,
      },
    }),

    prisma.lead.aggregate({
      where: {
        userId,
        stage: {
          notIn: [Stage.Won, Stage.Lost],
        },
      },
      _sum: {
        estimatedValue: true,
      },
    }),

    prisma.lead.aggregate({
      where: {
        userId,
        stage: Stage.Won,
      },
      _sum: {
        estimatedValue: true,
      },
    }),

    prisma.lead.count({
      where: {
        userId,
        scores: {
          some: {
            label: "Hot",
          },
        },
      },
    }),

    prisma.lead.count({
      where: {
        userId,
        stage: Stage.Won,
      },
    }),

    prisma.lead.count({
      where: {
        userId,
        stage: Stage.Lost,
      },
    }),

    prisma.lead.groupBy({
      by: ["stage"],
      where: {
        userId,
      },
      _count: {
        stage: true,
      },
      _sum: {
        estimatedValue: true,
      },
    }),

    prisma.leadActivity.findMany({
      where: {
        lead: {
          userId,
        },
      },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            company: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    }),

    prisma.lead.findMany({
      where: {
        userId,
        stage: {
          notIn: [Stage.Won, Stage.Lost],
        },
      },
      include: {
        scores: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: getTopOpportunitiesOrderBy(selectedSort),
      take: 5,
    }),
  ]);

  const pipelineValue = pipelineValueResult._sum.estimatedValue ?? 0;
  const wonValue = wonValueResult._sum.estimatedValue ?? 0;

  const closedLeads = wonLeads + lostLeads;
  const conversionRate =
    closedLeads > 0 ? Math.round((wonLeads / closedLeads) * 100) : 0;

  const stageMap = new Map(
    leadsByStage.map((item) => [
      item.stage,
      {
        count: item._count.stage,
        value: item._sum.estimatedValue ?? 0,
      },
    ]),
  );

  const maxStageCount = Math.max(
    ...stages.map((stage) => stageMap.get(stage)?.count ?? 0),
    1,
  );

  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm font-medium text-slate-500">CRM Overview</p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Dashboard
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Welcome back, {session.user.name}. Here is your sales pipeline
            overview.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          Total pipeline value:{" "}
          <span className="font-semibold text-slate-900">
            {formatCurrency(pipelineValue)}
          </span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total Leads"
          value={totalLeads.toString()}
          description="All leads in your CRM"
          icon={Users}
        />

        <MetricCard
          title="Pipeline Value"
          value={formatCurrency(pipelineValue)}
          description="Open opportunities"
          icon={DollarSign}
        />

        <MetricCard
          title="Won Revenue"
          value={formatCurrency(wonValue)}
          description="Closed won value"
          icon={TrendingUp}
        />

        <MetricCard
          title="Hot Leads"
          value={hotLeads.toString()}
          description="Leads with Hot score"
          icon={Flame}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Pipeline by Stage
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Lead count and estimated value by sales stage.
              </p>
            </div>

            <BarChart3 className="h-5 w-5 text-slate-400" />
          </div>

          <div className="space-y-4">
            {stages.map((stage) => {
              const stageData = stageMap.get(stage);
              const count = stageData?.count ?? 0;
              const value = stageData?.value ?? 0;
              const percentage = (count / maxStageCount) * 100;

              return (
                <div key={stage} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="font-medium text-slate-700">
                      {stageLabels[stage]}
                    </div>

                    <div className="text-slate-500">
                      {count} leads · {formatCurrency(value)}
                    </div>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-slate-900"
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Conversion
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Won deals compared to closed deals.
              </p>
            </div>

            <Target className="h-5 w-5 text-slate-400" />
          </div>

          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-32 w-32 items-center justify-center rounded-full border-8 border-slate-900 bg-slate-50">
              <span className="text-3xl font-bold text-slate-900">
                {conversionRate}%
              </span>
            </div>

            <p className="mt-5 text-sm text-slate-600">
              {wonLeads} won · {lostLeads} lost
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Conversion is calculated from Won and Lost leads only.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Top Opportunities
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Open leads sorted by {sortLabels[selectedSort].toLowerCase()}.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <SortLink
                href="/dashboard?sort=estimatedValue-desc"
                active={selectedSort === "estimatedValue-desc"}
              >
                Value
              </SortLink>

              <SortLink
                href="/dashboard?sort=createdAt-asc"
                active={selectedSort === "createdAt-asc"}
              >
                Created ↑
              </SortLink>

              <SortLink
                href="/dashboard?sort=stage-desc"
                active={selectedSort === "stage-desc"}
              >
                Stage ↓
              </SortLink>
            </div>
          </div>

          <div className="space-y-4">
            {topOpportunities.length === 0 ? (
              <EmptyState message="No open opportunities yet." />
            ) : (
              topOpportunities.map((lead) => {
                const latestScore = lead.scores[0];

                return (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 p-4"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{lead.name}</p>

                      <p className="mt-1 text-sm text-slate-500">
                        {lead.company ?? "No company"} · {lead.stage}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold text-slate-900">
                        {formatCurrency(lead.estimatedValue)}
                      </p>

                      {latestScore && (
                        <p className="mt-1 text-xs text-slate-500">
                          {latestScore.label} · {latestScore.score}/100
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Recent Activity
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Latest updates across your leads.
            </p>
          </div>

          <div className="space-y-4">
            {recentActivities.length === 0 ? (
              <EmptyState message="No recent activity yet." />
            ) : (
              recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="rounded-xl border border-slate-100 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {activity.description}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {activity.lead.name}
                        {activity.lead.company
                          ? ` · ${activity.lead.company}`
                          : ""}
                      </p>
                    </div>

                    <p className="whitespace-nowrap text-xs text-slate-400">
                      {formatDate(activity.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="rounded-xl bg-slate-100 p-3">
          <Icon className="h-5 w-5 text-slate-700" />
        </div>
      </div>

      <div className="mt-5">
        <p className="text-sm font-medium text-slate-500">{title}</p>

        <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          {value}
        </p>

        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function SortLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? "bg-slate-900 text-white"
          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      {children}
    </Link>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}
