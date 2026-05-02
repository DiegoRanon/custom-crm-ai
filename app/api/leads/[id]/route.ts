import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Stage, PrismaClient } from "@prisma/client";
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

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const body = await request.json();

    const {
      name,
      email,
      phone,
      company,
      source,
      stage,
      estimatedValue,
      description,
      lastContactedAt,
    } = body;

    if (!name || !email || !source || !stage) {
      return NextResponse.json(
        { message: "Name, email, source, and stage are required." },
        { status: 400 },
      );
    }

    if (!isValidStage(stage)) {
      return NextResponse.json(
        { message: "Invalid pipeline stage." },
        { status: 400 },
      );
    }

    const numericEstimatedValue = Number(estimatedValue);

    if (Number.isNaN(numericEstimatedValue) || numericEstimatedValue < 0) {
      return NextResponse.json(
        { message: "Estimated value must be a valid positive number." },
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

    const updatedLead = await prisma.lead.update({
      where: {
        id: existingLead.id,
      },
      data: {
        name,
        email,
        phone,
        company,
        source,
        stage,
        estimatedValue: numericEstimatedValue,
        description,
        lastContactedAt: lastContactedAt ? new Date(lastContactedAt) : null,
      },
    });

    if (existingLead.stage !== stage) {
      await prisma.leadActivity.create({
        data: {
          leadId: existingLead.id,
          type: getActivityTypeForStage(stage),
          description: `Lead moved from ${existingLead.stage} to ${stage}.`,
        },
      });
    }

    return NextResponse.json({
      message: "Lead updated successfully.",
      lead: updatedLead,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Something went wrong while updating the lead." },
      { status: 500 },
    );
  }
}

function getActivityTypeForStage(stage: Stage) {
  switch (stage) {
    case Stage.Contacted:
      return "MovedToContacted";
    case Stage.Qualified:
      return "MovedToQualified";
    case Stage.Proposal:
      return "MovedToProposal";
    case Stage.Negotiation:
      return "MovedToNegotiation";
    case Stage.Won:
      return "MovedToWon";
    case Stage.Lost:
      return "MovedToLost";
    case Stage.New:
    default:
      return "Created";
  }
}
