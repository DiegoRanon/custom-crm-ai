// Types
export const STAGES = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal",
  "Negotiation",
  "Won",
  "Lost",
] as const;

export type Stage = (typeof STAGES)[number];

export type LeadActivityType =
  | "Created"
  | "Moved to Contacted"
  | "Moved to Qualified"
  | "Moved to Proposal"
  | "Moved to Negotiation"
  | "Moved to Won"
  | "Moved to Lost";

export type LeadScoreLabel = "Hot" | "Warm" | "Cold";

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

export interface Lead {
  id: string;
  userId: string; // foreign key to User.id of the user that created the new lead
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source: string;
  stage: Stage;
  estimatedValue: number;
  description?: string; // description of the lead
  lastContactedAt?: Date; // last date the lead was contacted
  createdAt: Date;
  updatedAt: Date;
}

export interface PipelineStage {
  id: string;
  name: Stage;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeadActivity {
  id: string;
  leadId: string; // foreign key to Lead.id of the lead that the activity belongs to
  type: LeadActivityType; // type of the activity
  description: string; // description of the activity
  createdAt: Date;
  updatedAt: Date;
}

export interface LeadScore {
  id: string;
  leadId: string; // foreign key to Lead.id of the lead that the score belongs to
  score: number; // score of the lead
  label: LeadScoreLabel; // label of the lead
  reason: string; // reason of the lead
  createdAt: Date;
  updatedAt: Date;
}
