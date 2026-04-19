// lib/types/database.ts

export type InputMethod = "upload" | "paste";

export type Project = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type FeedbackFile = {
  id: string;
  project_id: string;
  file_name: string;
  source_type: string;
  content: string;
  storage_url: string | null;
  mime_type: string | null;
  input_method: InputMethod;
  word_count: number | null;
  created_at: string;
};

export type InsightQuote = {
  quote: string;
  sourceLabel: string;
};

export type Insight = {
  id: string;
  project_id: string;
  theme_name: string;
  frequency: string;
  quotes: InsightQuote[];
  signal_strength: "high" | "medium" | "low" | null;
  has_conflict: boolean;
  created_at: string;
};

export type ProposalEvidence = {
  quote: string;
  sourceLabel: string;
};

export type Proposal = {
  id: string;
  project_id: string;
  feature_name: string;
  problem_statement: string;
  evidence: ProposalEvidence[];
  ui_changes: string[];
  data_model_changes: string[];
  workflow_changes: string[];
  engineering_tasks: string[];
  is_conflict_proposal: boolean;
  created_at: string;
};
