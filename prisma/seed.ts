import {
  PrismaClient,
  Stage,
  LeadActivityType,
  LeadScoreLabel,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Clean existing data first
  await prisma.leadScore.deleteMany();
  await prisma.leadActivity.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.pipelineStage.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      name: "Demo User",
      email: "demo@leadops.com",
      passwordHash: passwordHash,
    },
  });

  // Create pipeline stages
  await prisma.pipelineStage.createMany({
    data: [
      { name: Stage.New, order: 1 },
      { name: Stage.Contacted, order: 2 },
      { name: Stage.Qualified, order: 3 },
      { name: Stage.Proposal, order: 4 },
      { name: Stage.Negotiation, order: 5 },
      { name: Stage.Won, order: 6 },
      { name: Stage.Lost, order: 7 },
    ],
  });

  // Create leads
  const lead1 = await prisma.lead.create({
    data: {
      userId: user.id,
      name: "Sarah Johnson",
      email: "sarah.johnson@example.com",
      phone: "514-555-0191",
      company: "ABC Fitness",
      source: "Website Form",
      stage: Stage.Qualified,
      estimatedValue: 4500,
      description: "Interested in CRM automation for a small fitness business.",
      lastContactedAt: new Date(),
    },
  });

  const lead2 = await prisma.lead.create({
    data: {
      userId: user.id,
      name: "Michael Chen",
      email: "michael.chen@example.com",
      phone: "514-555-0222",
      company: "Northstar Consulting",
      source: "Referral",
      stage: Stage.Proposal,
      estimatedValue: 8500,
      description: "Needs a custom dashboard for tracking consulting clients.",
      lastContactedAt: new Date(),
    },
  });

  const lead3 = await prisma.lead.create({
    data: {
      userId: user.id,
      name: "Emma Rodriguez",
      email: "emma.rodriguez@example.com",
      company: "Local Bakery Co.",
      source: "Social Media",
      stage: Stage.New,
      estimatedValue: 1200,
      description: "Asked about pricing through Instagram.",
    },
  });

  const lead4 = await prisma.lead.create({
    data: {
      userId: user.id,
      name: "David Miller",
      email: "david.miller@example.com",
      phone: "514-555-0888",
      company: "Miller Real Estate",
      source: "Email Campaign",
      stage: Stage.Negotiation,
      estimatedValue: 12000,
      description: "Interested in lead tracking for real estate agents.",
      lastContactedAt: new Date(),
    },
  });

  const lead5 = await prisma.lead.create({
    data: {
      userId: user.id,
      name: "Aisha Khan",
      email: "aisha.khan@example.com",
      company: "Startup Labs",
      source: "Phone Call",
      stage: Stage.Contacted,
      estimatedValue: 3000,
      description: "Called to ask about CRM setup and automation.",
      lastContactedAt: new Date(),
    },
  });

  // Create activities
  await prisma.leadActivity.createMany({
    data: [
      {
        leadId: lead1.id,
        type: LeadActivityType.Created,
        description: "Lead created from website form.",
      },
      {
        leadId: lead1.id,
        type: LeadActivityType.MovedToQualified,
        description: "Lead moved to Qualified after discovery call.",
      },
      {
        leadId: lead2.id,
        type: LeadActivityType.Created,
        description: "Lead created from referral.",
      },
      {
        leadId: lead2.id,
        type: LeadActivityType.MovedToProposal,
        description: "Proposal sent to client.",
      },
      {
        leadId: lead3.id,
        type: LeadActivityType.Created,
        description: "Lead created from social media message.",
      },
      {
        leadId: lead4.id,
        type: LeadActivityType.Created,
        description: "Lead created from email campaign.",
      },
      {
        leadId: lead4.id,
        type: LeadActivityType.MovedToNegotiation,
        description: "Client requested changes to the proposal.",
      },
      {
        leadId: lead5.id,
        type: LeadActivityType.Created,
        description: "Lead created after phone call.",
      },
      {
        leadId: lead5.id,
        type: LeadActivityType.MovedToContacted,
        description: "Follow-up email sent.",
      },
    ],
  });

  // Create lead scores
  await prisma.leadScore.createMany({
    data: [
      {
        leadId: lead1.id,
        score: 78,
        label: LeadScoreLabel.Hot,
        reason: "Strong business need and medium-high estimated value.",
      },
      {
        leadId: lead2.id,
        score: 88,
        label: LeadScoreLabel.Hot,
        reason:
          "High estimated value and referral source indicates strong trust.",
      },
      {
        leadId: lead3.id,
        score: 42,
        label: LeadScoreLabel.Cold,
        reason: "Low estimated value and early-stage interest.",
      },
      {
        leadId: lead4.id,
        score: 91,
        label: LeadScoreLabel.Hot,
        reason: "High estimated value and already in negotiation stage.",
      },
      {
        leadId: lead5.id,
        score: 63,
        label: LeadScoreLabel.Warm,
        reason: "Moderate value and already contacted.",
      },
    ],
  });

  console.log("Database has been seeded successfully.");
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
