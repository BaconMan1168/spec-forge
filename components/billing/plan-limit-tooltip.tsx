"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import React from "react";
import { AnimatePresence, motion } from "motion/react";

interface PlanLimitTooltipProps {
  allowed: boolean;
  reason: string;
  children: React.ReactNode;
}

const TOOLTIP_TRANSITION = {
  type: "tween" as const,
  duration: 0.18,
  ease: [0.22, 1, 0.36, 1] as const,
};

export function PlanLimitTooltip({ allowed, reason, children }: PlanLimitTooltipProps) {
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

  const hasUpgradeLink = reason.includes("→");
  const reasonText = hasUpgradeLink ? reason.replace("→", "").trim() : reason;

  return (
    <div
      className="relative inline-block"
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {disabledChild}

      {/* Always-in-DOM version for screen readers and tests */}
      <div role="tooltip" className="sr-only">
        <p>{reasonText}</p>
        {hasUpgradeLink && <span>Upgrade to Pro</span>}
      </div>

      {/* Animated tooltip — renders below the button to avoid navbar clipping */}
      <AnimatePresence>
        {visible && (
          <motion.div
            aria-hidden="true"
            onMouseEnter={show}
            onMouseLeave={hide}
            className="absolute left-0 top-[calc(100%+8px)] z-50 w-[220px] rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] px-3.5 py-2.5 shadow-[var(--shadow-2)]"
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={TOOLTIP_TRANSITION}
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
