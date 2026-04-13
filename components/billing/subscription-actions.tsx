"use client";

import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

// Returns false during SSR, true on the client
const useIsClient = () =>
  useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

const CARD_TRANSITION = {
  type: "tween" as const,
  duration: 0.28,
  ease: [0.22, 1, 0.36, 1] as const,
};

const BACKDROP_TRANSITION = {
  type: "tween" as const,
  duration: 0.2,
  ease: "easeOut" as const,
};

interface SubscriptionActionsProps {
  plan: "free" | "pro" | "max";
  cancelAt: string | null; // ISO date string if pending cancellation
}

export function SubscriptionActions({ plan, cancelAt }: SubscriptionActionsProps) {
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isClient = useIsClient();

  async function handleUpgrade() {
    setError(null);
    setUpgradeLoading(true);
    try {
      const res = await fetch("/api/billing/upgrade", { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error?.message ?? "Failed to upgrade. Please try again.");
        return;
      }
      // Direct upgrade — reload to reflect the new plan from server
      window.location.href = "/dashboard?upgrade=success";
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setUpgradeLoading(false);
    }
  }

  async function handleCancel() {
    setError(null);
    setCancelLoading(true);
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error?.message ?? "Failed to cancel. Please try again.");
        setCancelConfirmOpen(false);
        return;
      }
      // Reload to reflect the new cancellation state from server
      window.location.reload();
    } catch {
      setError("Network error. Please try again.");
      setCancelConfirmOpen(false);
    } finally {
      setCancelLoading(false);
    }
  }

  if (plan === "free") {
    return (
      <Link
        href="/pricing"
        className="group relative block w-full overflow-hidden rounded-[var(--radius-pill)] bg-[var(--color-accent-primary)] px-8 py-[14px] text-center text-[15px] font-semibold text-[var(--color-bg-0)] transition-[background-color,box-shadow] duration-[180ms] hover:bg-[var(--color-accent-hover)] hover:shadow-[0_6px_20px_hsla(40,85%,58%,0.35)]"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 translate-y-full bg-black/25 transition-transform duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0"
        />
        <span className="relative">View Plans — from $9/mo</span>
      </Link>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {error && (
          <p className="text-[12px] text-[var(--color-error,#f87171)]">{error}</p>
        )}

        {plan === "pro" && (
          <button
            onClick={handleUpgrade}
            disabled={upgradeLoading}
            className="group relative w-full cursor-pointer overflow-hidden rounded-[var(--radius-pill)] bg-[var(--color-accent-primary)] px-8 py-[14px] text-[15px] font-semibold text-[var(--color-bg-0)] transition-[background-color,box-shadow] duration-[180ms] hover:bg-[var(--color-accent-hover)] hover:shadow-[0_6px_20px_hsla(40,85%,58%,0.35)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 translate-y-full bg-black/25 transition-transform duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0"
            />
            <span className="relative">
              {upgradeLoading ? "Upgrading…" : "Upgrade to Max — $19/mo"}
            </span>
          </button>
        )}

        {plan === "max" && (
          <div className="flex w-full items-center justify-center rounded-[var(--radius-pill)] border border-[var(--color-accent-primary)]/30 bg-[var(--color-accent-muted)] px-8 py-[14px] text-[14px] font-medium text-[var(--color-accent-primary)]">
            All features unlocked
          </div>
        )}

        {cancelAt ? (
          <p className="text-center text-[12px] text-[var(--color-text-tertiary)]">
            Cancels on{" "}
            <span className="font-medium text-[var(--color-text-secondary)]">
              {new Date(cancelAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </p>
        ) : (
          <button
            onClick={() => setCancelConfirmOpen(true)}
            disabled={cancelLoading}
            className="w-full cursor-pointer rounded-[var(--radius-pill)] border border-[var(--color-border-subtle)] bg-transparent px-8 py-[14px] text-[15px] font-medium text-[var(--color-text-secondary)] transition-[border-color,color] duration-[180ms] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLoading ? "Canceling…" : "Cancel Subscription"}
          </button>
        )}
      </div>

      {/* Cancel confirmation modal */}
      {isClient && createPortal(
        <AnimatePresence>
          {cancelConfirmOpen && (
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="cancel-modal-title"
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={BACKDROP_TRANSITION}
              onClick={() => !cancelLoading && setCancelConfirmOpen(false)}
            >
              <motion.div
                className="w-full max-w-[400px] rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] p-7 shadow-[var(--shadow-3)]"
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={CARD_TRANSITION}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-error)]/10">
                    <AlertTriangle size={16} className="text-[var(--color-error)]" />
                  </div>
                  <h2
                    id="cancel-modal-title"
                    className="text-[17px] font-semibold text-[var(--color-text-primary)]"
                  >
                    Cancel subscription?
                  </h2>
                </div>

                <p className="mb-2 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
                  You&apos;ll keep access to your current plan until the end of your billing period. After that, your account will revert to the free tier.
                </p>
                <p className="mb-7 text-[13px] text-[var(--color-text-tertiary)]">
                  You can resubscribe at any time.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setCancelConfirmOpen(false)}
                    disabled={cancelLoading}
                    className="flex-1 cursor-pointer rounded-[var(--radius-pill)] border border-[var(--color-border-subtle)] bg-transparent px-4 py-2.5 text-[14px] font-medium text-[var(--color-text-secondary)] transition-colors duration-[120ms] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Keep subscription
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={cancelLoading}
                    className="group relative flex-1 cursor-pointer overflow-hidden rounded-[var(--radius-pill)] bg-[var(--color-error)] px-4 py-2.5 text-[14px] font-semibold text-white transition-[background-color] duration-[120ms] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 translate-y-full bg-black/20 transition-transform duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0"
                    />
                    <span className="relative">
                      {cancelLoading ? "Canceling…" : "Yes, cancel"}
                    </span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
