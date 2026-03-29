"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AnalyzeButtonProps {
  projectId: string;
  hasInputs: boolean;
  isStale: boolean;
  onAnalyzingChange?: (isAnalyzing: boolean) => void;
}

export function AnalyzeButton({ projectId, hasInputs, isStale, onAnalyzingChange }: AnalyzeButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const label = loading ? "Analyzing…" : isStale ? "Re-analyze" : "Analyze";

  async function handleClick() {
    setLoading(true);
    onAnalyzingChange?.(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/analyze`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        setError(body?.error?.message ?? "Analysis failed. Please try again.");
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      onAnalyzingChange?.(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="relative">
        <Button
          size="sm"
          disabled={!hasInputs || loading}
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
      {error && (
        <p className="text-[11px] text-[var(--color-error)]">{error}</p>
      )}
    </div>
  );
}
