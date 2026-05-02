import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { LeadActivityType, PrismaClient, Stage } from "@prisma/client";

import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function isValidStage(stage: string): stage is Stage {
  return Object.values(Stage).includes(stage as Stage);
}

function getActivityTypeForStage(stage: Stage): LeadActivityType {
  switch (stage) {
    case Stage.Contacted:
      return LeadActivityType.MovedToContacted;
    case Stage.Qualified:
      return LeadActivityType.MovedToQualified;
    case Stage.Proposal:
      return LeadActivityType.MovedToProposal;
    case Stage.Negotiation:
      return LeadActivityType.MovedToNegotiation;
    case Stage.Won:
      return LeadActivityType.MovedToWon;
    case Stage.Lost:
      return LeadActivityType.MovedToLost;
    case Stage.New:
    default:
      return LeadActivityType.Created;
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const body = await request.json();
    const { stage } = body;

    if (!stage || typeof stage !== "string") {
      return NextResponse.json(
        { message: "Stage is required." },
        { status: 400 },
      );
    }

    if (!isValidStage(stage)) {
      return NextResponse.json(
        { message: "Invalid pipeline stage." },
        { status: 400 },
      );
    }

    const existingLead = await prisma.lead.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      select: {
        id: true,
        stage: true,
      },
    });

    if (!existingLead) {
      return NextResponse.json({ message: "Lead not found." }, { status: 404 });
    }

    if (existingLead.stage === stage) {
      return NextResponse.json({
        message: "Lead is already in this stage.",
      });
    }

    const updatedLead = await prisma.lead.update({
      where: {
        id: existingLead.id,
      },
      data: {
        stage,
        activities: {
          create: {
            type: getActivityTypeForStage(stage),
            description: `Lead moved from ${existingLead.stage} to ${stage}.`,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Lead stage updated successfully.",
      lead: updatedLead,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Something went wrong while updating the lead stage." },
      { status: 500 },
    );
  }
}
