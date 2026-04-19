"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import React from "react";
import { AnimatePresence, motion } from "motion/react";

interface PlanLimitTooltipProps {
  allowed: boolean;
  reason: string;
  /** Optional bold header shown above the reason, e.g. "Upload limit reached" */
  title?: string;
  children: React.ReactNode;
}

const TOOLTIP_TRANSITION = {
  type: "tween" as const,
  duration: 0.18,
  ease: [0.22, 1, 0.36, 1] as const,
};

export function PlanLimitTooltip({ allowed, reason, title, children }: PlanLimitTooltipProps) {
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (allowed) return <>{children}</>;

  function show() {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setVisible(true);
  }

  function hide() {
    // Delay hiding so the user can move their cursor into the tooltip
    hideTimer.current = setTimeout(() => setVisible(false), 300);
  }

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

  // Split "Free plan: 5 files per project — Upgrade to Pro for up to 10" into
  // planInfo = "Free plan: 5 files per project"
  // upgradeText = "Upgrade to Pro for up to 10"
  const dashIdx = reason.indexOf(" — ");
  const planInfo = dashIdx !== -1 ? reason.slice(0, dashIdx) : reason;
  const upgradeText = dashIdx !== -1 ? reason.slice(dashIdx + 3) : null;

  return (
    <div
      className="relative inline-block"
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {disabledChild}

      {/* Always-in-DOM version for screen readers and tests */}
      <div role="tooltip" className="sr-only">
        {title && <p>{title}</p>}
        <p>{planInfo}</p>
        {upgradeText && <span>{upgradeText}</span>}
      </div>

      {/* Animated tooltip — renders to the left of the trigger */}
      <AnimatePresence>
        {visible && (
          <motion.div
            aria-hidden="true"
            onMouseEnter={show}
            onMouseLeave={hide}
            className="absolute right-[calc(100%+8px)] top-1/2 -translate-y-1/2 z-50 w-[220px] rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] px-3.5 py-2.5 shadow-[var(--shadow-2)]"
            initial={{ opacity: 0, scale: 0.95, x: 4 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: 4 }}
            transition={TOOLTIP_TRANSITION}
          >
            {title && (
              <p className="mb-1 text-[12px] font-semibold text-[var(--color-text-primary)]">
                {title}
              </p>
            )}
            <p className={`text-[11px] text-[var(--color-text-secondary)] ${title ? "" : "mb-1 font-semibold text-[var(--color-text-primary)] text-[12px]"}`}>
              {planInfo}
            </p>
            {upgradeText && (
              <Link
                href="/pricing"
                className="mt-1.5 inline-block text-[11px] font-semibold text-[var(--color-accent-primary)] hover:underline"
              >
                {upgradeText}
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
