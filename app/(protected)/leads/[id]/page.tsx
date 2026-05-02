import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  DollarSign,
  Mail,
  Phone,
  User,
  FileText,
  Activity,
  Flame,
  Pencil,
} from "lucide-react";
import {
  LeadActivityType,
  LeadScoreLabel,
  Stage,
  PrismaClient,
} from "@prisma/client";

import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

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

const activityLabels: Record<LeadActivityType, string> = {
  Created: "Created",
  MovedToContacted: "Moved to Contacted",
  MovedToQualified: "Moved to Qualified",
  MovedToProposal: "Moved to Proposal",
  MovedToNegotiation: "Moved to Negotiation",
  MovedToWon: "Moved to Won",
  MovedToLost: "Moved to Lost",
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

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

type LeadDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  const lead = await prisma.lead.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      scores: {
        orderBy: {
          createdAt: "desc",
        },
      },
      activities: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!lead) {
    notFound();
  }

  const latestScore = lead.scores[0];

  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <Link
            href="/leads"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to leads
          </Link>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {lead.name}
            </h1>

            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                stageStyles[lead.stage]
              }`}
            >
              {lead.stage}
            </span>

            {latestScore && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  scoreStyles[latestScore.label]
                }`}
              >
                {latestScore.label} · {latestScore.score}/100
              </span>
            )}
          </div>

          <p className="mt-2 text-sm text-slate-600">
            Full lead profile, contact details, pipeline information, score, and
            activity history.
          </p>
        </div>

        <Link
          href={`/leads/${lead.id}/edit`}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <Pencil className="h-4 w-4" />
          Edit Lead
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Estimated Value"
          value={formatCurrency(lead.estimatedValue)}
          description="Potential deal value"
          icon={DollarSign}
        />

        <SummaryCard
          title="Pipeline Stage"
          value={lead.stage}
          description="Current sales stage"
          icon={Activity}
        />

        <SummaryCard
          title="Lead Source"
          value={lead.source}
          description="Where this lead came from"
          icon={User}
        />

        <SummaryCard
          title="Last Contacted"
          value={
            lead.lastContactedAt ? formatDate(lead.lastContactedAt) : "Never"
          }
          description="Most recent contact date"
          icon={CalendarDays}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-slate-100 p-3">
                <Building2 className="h-5 w-5 text-slate-700" />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Lead Information
                </h2>
                <p className="text-sm text-slate-500">
                  Core information about this opportunity.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <InfoItem label="Name" value={lead.name} />
              <InfoItem label="Company" value={lead.company ?? "No company"} />
              <InfoItem label="Email" value={lead.email} />
              <InfoItem label="Phone" value={lead.phone ?? "No phone"} />
              <InfoItem label="Source" value={lead.source} />
              <InfoItem
                label="Created"
                value={formatDateTime(lead.createdAt)}
              />
              <InfoItem
                label="Updated"
                value={formatDateTime(lead.updatedAt)}
              />
              <InfoItem
                label="Last Contacted"
                value={
                  lead.lastContactedAt
                    ? formatDateTime(lead.lastContactedAt)
                    : "Not contacted yet"
                }
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-slate-100 p-3">
                <FileText className="h-5 w-5 text-slate-700" />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Description
                </h2>
                <p className="text-sm text-slate-500">
                  Notes and context about this lead.
                </p>
              </div>
            </div>

            {lead.description ? (
              <p className="whitespace-pre-line rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                {lead.description}
              </p>
            ) : (
              <EmptyState message="No description has been added for this lead yet." />
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-slate-100 p-3">
                <Activity className="h-5 w-5 text-slate-700" />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Activity History
                </h2>
                <p className="text-sm text-slate-500">
                  Timeline of updates and pipeline changes.
                </p>
              </div>
            </div>

            {lead.activities.length === 0 ? (
              <EmptyState message="No activity has been recorded for this lead yet." />
            ) : (
              <div className="space-y-4">
                {lead.activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="relative rounded-xl border border-slate-100 p-4"
                  >
                    <div className="flex flex-col justify-between gap-2 md:flex-row md:items-start">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {activityLabels[activity.type]}
                        </p>

                        <p className="mt-1 text-sm text-slate-600">
                          {activity.description}
                        </p>
                      </div>

                      <p className="whitespace-nowrap text-xs text-slate-400">
                        {formatDateTime(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-slate-100 p-3">
                <Flame className="h-5 w-5 text-slate-700" />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Lead Score
                </h2>
                <p className="text-sm text-slate-500">Latest scoring result.</p>
              </div>
            </div>

            {latestScore ? (
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      scoreStyles[latestScore.label]
                    }`}
                  >
                    {latestScore.label}
                  </span>

                  <span className="text-2xl font-bold text-slate-900">
                    {latestScore.score}/100
                  </span>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-slate-900"
                    style={{
                      width: `${latestScore.score}%`,
                    }}
                  />
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-600">
                  {latestScore.reason}
                </p>

                <p className="mt-4 text-xs text-slate-400">
                  Scored on {formatDateTime(latestScore.createdAt)}
                </p>
              </div>
            ) : (
              <EmptyState message="No score has been calculated for this lead yet." />
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Contact</h2>

            <div className="mt-5 space-y-4">
              <ContactItem icon={Mail} label="Email" value={lead.email} />
              <ContactItem
                icon={Phone}
                label="Phone"
                value={lead.phone ?? "No phone"}
              />
              <ContactItem
                icon={Building2}
                label="Company"
                value={lead.company ?? "No company"}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Quick Actions
            </h2>

            <div className="mt-5 space-y-3">
              <Link
                href={`/leads/${lead.id}/edit`}
                className="block rounded-lg border border-slate-200 px-4 py-2.5 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Edit lead
              </Link>

              <Link
                href="/kanban"
                className="block rounded-lg border border-slate-200 px-4 py-2.5 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                View in Kanban
              </Link>

              <Link
                href="/leads"
                className="block rounded-lg border border-slate-200 px-4 py-2.5 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Back to leads
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function SummaryCard({
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
      <div className="rounded-xl bg-slate-100 p-3 w-fit">
        <Icon className="h-5 w-5 text-slate-700" />
      </div>

      <div className="mt-5">
        <p className="text-sm font-medium text-slate-500">{title}</p>

        <p className="mt-2 truncate text-2xl font-bold tracking-tight text-slate-900">
          {value}
        </p>

        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-medium text-slate-800">
        {value}
      </p>
    </div>
  );
}

function ContactItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-lg bg-slate-100 p-2">
        <Icon className="h-4 w-4 text-slate-600" />
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-medium text-slate-800">
          {value}
        </p>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}
