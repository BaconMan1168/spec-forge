"use client";

import { useState } from "react";
import Link from "next/link";
import React from "react";

interface PlanLimitTooltipProps {
  allowed: boolean;
  reason: string;
  children: React.ReactNode;
}

export function PlanLimitTooltip({ allowed, reason, children }: PlanLimitTooltipProps) {
  const [visible, setVisible] = useState(false);

  if (allowed) return <>{children}</>;

  const disabledChild = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as React.ReactElement<{ disabled?: boolean; className?: string }>, {
        disabled: true,
        className: [
          (child.props as { className?: string }).className ?? "",
          "cursor-not-allowed opacity-50",
        ]
          .join(" ")
          .trim(),
      });
    }
    return child;
  });

  const hasUpgradeLink = reason.includes("→");
  const reasonText = hasUpgradeLink ? reason.replace("→", "").trim() : reason;

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {disabledChild}
      {/* Reason text is always in the DOM (sr-only when not hovered) so tests can find it */}
      <div
        role="tooltip"
        className={
          visible
            ? "absolute bottom-[calc(100%+8px)] right-0 z-50 w-[220px] rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] px-3.5 py-2.5 shadow-[var(--shadow-2)]"
            : "sr-only"
        }
      >
        <p className="mb-1 text-[12px] font-semibold text-[var(--color-text-primary)]">
          {reasonText}
        </p>
        {hasUpgradeLink && (
          <Link
            href="/pricing"
            className="text-[12px] font-semibold text-[var(--color-accent-primary)] hover:underline"
          >
            Upgrade to Pro →
          </Link>
        )}
      </div>
    </div>
  );
}
