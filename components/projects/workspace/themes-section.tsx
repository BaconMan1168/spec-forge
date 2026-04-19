"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import type { Insight } from "@/lib/types/database";
import { QuotesModal } from "./quotes-modal";
import { MagicCard } from "@/components/ui/magic-card";

const FREQ_STYLES = [
  "bg-[hsl(200_55%_18%)] text-[var(--color-analog-1)] border border-[hsl(200_55%_28%)]",
  "bg-[hsl(200_55%_18%)] text-[var(--color-analog-1)] border border-[hsl(200_55%_28%)]",
  "bg-[hsl(220_55%_18%)] text-[var(--color-analog-2)] border border-[hsl(220_55%_28%)]",
  "bg-[hsl(220_55%_18%)] text-[var(--color-analog-2)] border border-[hsl(220_55%_28%)]",
  "bg-[hsl(240_55%_18%)] text-[var(--color-analog-3)] border border-[hsl(240_55%_28%)]",
];

interface ThemesSectionProps {
  insights: Insight[];
  isStale?: boolean;
}

export function ThemesSection({ insights, isStale }: ThemesSectionProps) {
  const [modalInsight, setModalInsight] = useState<Insight | null>(null);

  return (
    <>
      {isStale && (
        <div className="mb-4 flex items-center gap-2 rounded-[var(--radius-md)] border border-[hsl(40_40%_28%)] bg-[hsl(40_40%_12%)] px-4 py-2.5">
          <Info size={13} strokeWidth={1.8} className="shrink-0 text-[hsl(40_70%_55%)]" />
          <p className="text-[12px] text-[hsl(40_70%_65%)]">
            New inputs were added after the last analysis. Re-analyze to include them.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {insights.map((insight, i) => (
          <MagicCard
            key={insight.id}
            className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] p-5 shadow-[var(--shadow-2)] transition-[box-shadow,border-color] duration-[500ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-3)]"
            gradientColor="hsla(220,55%,55%,0.10)"
          >
            <div className="mb-3 flex items-center gap-3">
              <span className="flex-1 text-[14px] font-semibold text-[var(--color-text-primary)]">
                {insight.theme_name}
              </span>
              {insight.has_conflict && (
                <span className="rounded-[var(--radius-pill)] border border-[hsl(0_40%_28%)] bg-[hsl(0_40%_12%)] px-2.5 py-0.5 text-[11px] font-semibold text-[hsl(0_70%_65%)]">
                  Conflicting signals
                </span>
              )}
              {insight.signal_strength === "low" && !insight.has_conflict && (
                <span className="rounded-[var(--radius-pill)] border border-[hsl(40_40%_28%)] bg-[hsl(40_40%_12%)] px-2.5 py-0.5 text-[11px] font-semibold text-[hsl(40_70%_65%)]">
                  Low signal
                </span>
              )}
              <span
                className={`rounded-[var(--radius-pill)] px-2.5 py-0.5 text-[11px] font-semibold ${FREQ_STYLES[i] ?? FREQ_STYLES[4]}`}
              >
                {insight.frequency}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              {insight.quotes.slice(0, 2).map((q, qi) => (
                <div
                  key={qi}
                  className="rounded-r-[var(--radius-sm)] border-l-2 border-[var(--color-border-strong)] bg-[var(--color-bg-1)] px-3 py-2"
                >
                  <p className="text-[12px] italic leading-relaxed text-[var(--color-text-tertiary)]">
                    &ldquo;{q.quote}&rdquo;
                  </p>
                  <p className="mt-1 text-[11px] text-[var(--color-text-disabled)]">
                    — {q.sourceLabel}
                  </p>
                </div>
              ))}
            </div>

            {insight.quotes.length > 0 && (
              <button
                onClick={() => setModalInsight(insight)}
                className="mt-3 flex cursor-pointer items-center gap-1.5 text-[12px] text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-text-secondary)]"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                View all {insight.quotes.length} quotes
              </button>
            )}
          </MagicCard>
        ))}
      </div>

      {modalInsight && (
        <QuotesModal
          themeName={modalInsight.theme_name}
          quotes={modalInsight.quotes}
          isOpen
          onClose={() => setModalInsight(null)}
        />
      )}
    </>
  );
}
