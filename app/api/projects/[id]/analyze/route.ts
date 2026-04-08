import { createClient } from "@/lib/supabase/server";
import { synthesize } from "@/lib/ai/synthesize";
import { generateProposals } from "@/lib/ai/generate-proposals";
import {
  persistAnalysisResults,
  countRecentRunsByUser,
} from "@/app/actions/analysis";
import { canAnalyzeProject } from "@/lib/billing/limits";

export const maxDuration = 60;

const RATE_LIMIT = 5; // max runs per hour per user

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = await createClient();

  // 1. Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  // 2. Ownership check
  const { data: project } = await supabase
    .from("projects")
    .select("id, user_id")
    .eq("id", projectId)
    .single();

  if (!project || project.user_id !== user.id) {
    return Response.json(
      { error: { code: "FORBIDDEN", message: "Project not found" } },
      { status: 403 }
    );
  }

  // 3. Billing check — covers both first-time analysis and re-runs.
  //    Accounts for deleted-and-recreated projects to prevent slot abuse.
  const analysisLimit = await canAnalyzeProject(user.id, projectId);
  if (!analysisLimit.allowed) {
    return Response.json(
      { error: { code: "PLAN_LIMIT", message: analysisLimit.reason } },
      { status: 403 }
    );
  }

  // 4. Rate limit check
  const recentRuns = await countRecentRunsByUser(user.id);
  if (recentRuns >= RATE_LIMIT) {
    return Response.json(
      { error: { code: "RATE_LIMITED", message: "Too many analysis runs. Try again later." } },
      { status: 429, headers: { "Retry-After": "3600" } }
    );
  }

  // 5. Fetch feedback files
  const { data: files, error: filesError } = await supabase
    .from("feedback_files")
    .select("*")
    .eq("project_id", projectId);

  if (filesError || !files || files.length === 0) {
    return Response.json(
      { error: { code: "NO_INPUTS", message: "No feedback files found" } },
      { status: 400 }
    );
  }

  try {
    // Stage 1: Synthesize themes
    const { themes } = await synthesize(files);

    // Insufficient signal — persist empty results and return early
    if (themes.length === 0) {
      await persistAnalysisResults({
        projectId,
        userId: user.id,
        themes: [],
        proposals: [],
        inputCount: files.length,
      });
      return Response.json({ signal: "insufficient", insightCount: 0, proposalCount: 0 });
    }

    // Stage 2: Generate proposals (up to 5, one per theme)
    const proposals = await generateProposals(themes.slice(0, 5));

    // Persist results (overwrites previous)
    await persistAnalysisResults({
      projectId,
      userId: user.id,
      themes,
      proposals,
      inputCount: files.length,
    });

    return Response.json({
      signal: "ok",
      insightCount: themes.length,
      proposalCount: proposals.length,
    });
  } catch {
    return Response.json(
      { error: { code: "MODEL_ERROR", message: "Analysis failed. Please try again." } },
      { status: 500 }
    );
  }
}
