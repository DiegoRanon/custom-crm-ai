import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import {
  LeadActivityType,
  LeadScoreLabel,
  Stage,
  PrismaClient,
} from "@prisma/client";

import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

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

function calculateLeadScore({
  source,
  stage,
  estimatedValue,
  description,
}: {
  source: string;
  stage: Stage;
  estimatedValue: number;
  description?: string | null;
}) {
  let score = 30;

  if (estimatedValue >= 10000) {
    score += 30;
  } else if (estimatedValue >= 5000) {
    score += 20;
  } else if (estimatedValue >= 1000) {
    score += 10;
  }

  if (source === "Referral" || source === "Website Form") {
    score += 15;
  }

  if (
    stage === Stage.Qualified ||
    stage === Stage.Proposal ||
    stage === Stage.Negotiation
  ) {
    score += 20;
  }

  if (stage === Stage.Won) {
    score += 25;
  }

  if (description && description.trim().length > 20) {
    score += 5;
  }

  const finalScore = Math.min(score, 100);

  const label: LeadScoreLabel =
    finalScore >= 75
      ? LeadScoreLabel.Hot
      : finalScore >= 50
        ? LeadScoreLabel.Warm
        : LeadScoreLabel.Cold;

  const reason =
    label === LeadScoreLabel.Hot
      ? "This lead has strong potential based on value, source, and pipeline stage."
      : label === LeadScoreLabel.Warm
        ? "This lead shows moderate potential and may need more follow-up."
        : "This lead is early or low value and may require qualification.";

  return {
    score: finalScore,
    label,
    reason,
  };
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

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

    const scoreResult = calculateLeadScore({
      source,
      stage,
      estimatedValue: numericEstimatedValue,
      description,
    });

    const lead = await prisma.lead.create({
      data: {
        userId: session.user.id,
        name,
        email,
        phone,
        company,
        source,
        stage,
        estimatedValue: numericEstimatedValue,
        description,
        lastContactedAt: lastContactedAt ? new Date(lastContactedAt) : null,

        activities: {
          create: {
            type: getActivityTypeForStage(stage),
            description:
              stage === Stage.New
                ? "Lead created."
                : `Lead created in ${stage} stage.`,
          },
        },

        scores: {
          create: {
            score: scoreResult.score,
            label: scoreResult.label,
            reason: scoreResult.reason,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Lead created successfully.",
        lead,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Something went wrong while creating the lead." },
      { status: 500 },
    );
  }
}
