import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowLeft } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { EditLeadForm } from "./EditLeadForm";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type EditLeadPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditLeadPage({ params }: EditLeadPageProps) {
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
  });

  if (!lead) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <section>
        <Link
          href={`/leads/${lead.id}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to lead details
        </Link>

        <div className="mt-4">
          <p className="text-sm font-medium text-slate-500">Lead Management</p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Edit Lead
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Update contact details, deal value, stage, and lead notes.
          </p>
        </div>
      </section>

      <EditLeadForm
        lead={{
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
        }}
      />
    </div>
  );
}
