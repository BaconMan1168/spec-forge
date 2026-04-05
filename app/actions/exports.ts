"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { canExport } from "@/lib/billing/limits";
import { generateMarkdown } from "@/lib/export/generate-markdown";
import type { Proposal } from "@/lib/types/database";

export async function exportProposal(projectId: string, proposalId: string): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthenticated");

  const limitResult = await canExport(user.id, projectId, proposalId);
  if (!limitResult.allowed) throw new Error(limitResult.reason);

  const { data: proposal, error } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", proposalId)
    .single();

  if (error || !proposal) throw new Error("Proposal not found");

  const serviceClient = createServiceClient();
  await serviceClient.from("exports").upsert(
    {
      user_id: user.id,
      project_id: projectId,
      proposal_id: proposalId,
    },
    { onConflict: "project_id,proposal_id", ignoreDuplicates: true }
  );

  return generateMarkdown(proposal as Proposal);
}
