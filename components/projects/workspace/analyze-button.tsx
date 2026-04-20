"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlanLimitTooltip } from "@/components/billing/plan-limit-tooltip";
import type { LimitResult } from "@/lib/billing/limits";

interface AnalyzeButtonProps {
  projectId: string;
  hasInputs: boolean;
  isStale: boolean;
  hasResults?: boolean;
  canRerun?: LimitResult;
  onAnalyzingChange?: (isAnalyzing: boolean) => void;
}

export function AnalyzeButton({
  projectId,
  hasInputs,
  isStale,
  hasResults = false,
  canRerun = { allowed: true, reason: "" },
  onAnalyzingChange,
}: AnalyzeButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRerun = hasResults;
  const label = loading ? "Analyzing…" : isStale ? "Re-analyze" : "Analyze";

  // Re-run is blocked for free users when results already exist
  const effectivelyDisabled = !hasInputs || loading || (isRerun && !canRerun.allowed);

  async function handleClick() {
    if (effectivelyDisabled) return;
    setLoading(true);
    onAnalyzingChange?.(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/analyze`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        setError(body?.error?.message ?? "Analysis failed. Please try again.");
        onAnalyzingChange?.(false);
        return;
      }
      // Keep isAnalyzing=true until WorkspaceShell detects that router.refresh()
      // has delivered fresh server props — clears via lastAnalyzedAt change.
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      onAnalyzingChange?.(false);
    } finally {
      // Only clear button spinner; skeleton stays until fresh data arrives.
      setLoading(false);
    }
  }

  const button = (
    <div className="relative">
      <Button
        size="sm"
        disabled={effectivelyDisabled}
        onClick={handleClick}
        title={!hasInputs ? "Add at least one labeled input" : undefined}
      >
        {loading ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          <Zap size={13} />
        )}
        {label}
      </Button>
      {isStale && !loading && (
        <span
          aria-hidden="true"
          className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-[1.5px] border-[var(--color-bg-0)] bg-[var(--color-accent-primary)]"
        />
      )}
    </div>
  );

  if (isRerun && !canRerun.allowed) {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <PlanLimitTooltip allowed={false} reason={canRerun.reason}>
          {button}
        </PlanLimitTooltip>
        {error && (
          <p className="text-[11px] text-[var(--color-error)]">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      {button}
      {error && (
        <p className="text-[11px] text-[var(--color-error)]">{error}</p>
      )}
    </div>
  );
}
