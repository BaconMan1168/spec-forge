import type { Proposal } from "@/lib/types/database";

export function generateMarkdown(proposal: Proposal): string {
  const lines: string[] = [];
  lines.push(`# ${proposal.feature_name}`);
  lines.push("");
  lines.push(`## Problem Statement`);
  lines.push(proposal.problem_statement);
  lines.push("");
  if (proposal.evidence.length > 0) {
    lines.push(`## User Evidence`);
    for (const e of proposal.evidence) {
      lines.push(`- "${e.quote}" — ${e.sourceLabel}`);
    }
    lines.push("");
  }
  if (proposal.ui_changes.length > 0) {
    lines.push(`## Suggested UI Changes`);
    for (const item of proposal.ui_changes) lines.push(`- ${item}`);
    lines.push("");
  }
  if (proposal.data_model_changes.length > 0) {
    lines.push(`## Suggested Data Model Changes`);
    for (const item of proposal.data_model_changes) lines.push(`- ${item}`);
    lines.push("");
  }
  if (proposal.workflow_changes.length > 0) {
    lines.push(`## Suggested Workflow Changes`);
    for (const item of proposal.workflow_changes) lines.push(`- ${item}`);
    lines.push("");
  }
  if (proposal.engineering_tasks.length > 0) {
    lines.push(`## Engineering Tasks`);
    for (const item of proposal.engineering_tasks) lines.push(`- ${item}`);
    lines.push("");
  }
  return lines.join("\n");
}
