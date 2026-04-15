"use client";

import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AlertTriangle, ArrowDownCircle } from "lucide-react";
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
  pendingDowngradePlan?: "pro" | null;
  periodEnd?: string | null;
}

export function SubscriptionActions({
  plan,
  cancelAt,
  pendingDowngradePlan = null,
  periodEnd = null,
}: SubscriptionActionsProps) {
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [downgradeLoading, setDowngradeLoading] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [upgradeConfirmOpen, setUpgradeConfirmOpen] = useState(false);
  const [downgradeConfirmOpen, setDowngradeConfirmOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewAmount, setPreviewAmount] = useState<{ amountDue: number; currency: string } | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isClient = useIsClient();

  const isDowngrading = pendingDowngradePlan !== null && !cancelAt;

  async function openUpgradeConfirm() {
    setUpgradeConfirmOpen(true);
    setPreviewLoading(true);
    setPreviewAmount(null);
    setPreviewFailed(false);
    try {
      const res = await fetch("/api/billing/upgrade/preview");
      const body = await res.json();
      if (!res.ok) {
        setPreviewFailed(true);
        return;
      }
      setPreviewAmount({ amountDue: body.amountDue, currency: body.currency });
    } catch {
      setPreviewFailed(true);
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleUpgrade() {
    setError(null);
    setUpgradeLoading(true);
    try {
      const res = await fetch("/api/billing/upgrade", { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error?.message ?? "Failed to upgrade. Please try again.");
        setUpgradeConfirmOpen(false);
        return;
      }
      window.location.href = "/dashboard?upgrade=success";
    } catch {
      setError("Network error. Please try again.");
      setUpgradeConfirmOpen(false);
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
      window.location.reload();
    } catch {
      setError("Network error. Please try again.");
      setCancelConfirmOpen(false);
    } finally {
      setCancelLoading(false);
    }
  }

  async function handleDowngrade() {
    setError(null);
    setDowngradeLoading(true);
    try {
      const res = await fetch("/api/billing/downgrade", { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error?.message ?? "Failed to schedule downgrade. Please try again.");
        setDowngradeConfirmOpen(false);
        return;
      }
      window.location.reload();
    } catch {
      setError("Network error. Please try again.");
      setDowngradeConfirmOpen(false);
    } finally {
      setDowngradeLoading(false);
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

  const periodEndFormatted = periodEnd
    ? new Date(periodEnd).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <>
      <div className="flex flex-col gap-3">
        {error && (
          <p className="text-[12px] text-[var(--color-error,#f87171)]">{error}</p>
        )}

        {plan === "pro" && (
          <button
            onClick={openUpgradeConfirm}
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

        {plan === "max" && !isDowngrading && (
          <div className="flex w-full items-center justify-center rounded-[var(--radius-pill)] border border-[var(--color-accent-primary)]/30 bg-[var(--color-accent-muted)] px-8 py-[14px] text-[14px] font-medium text-[var(--color-accent-primary)]">
            All features unlocked
          </div>
        )}

        {plan === "max" && isDowngrading && periodEndFormatted && (
          <div className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-pill)] border border-amber-500/30 bg-amber-500/10 px-8 py-[14px] text-[14px] font-medium text-amber-400">
            <ArrowDownCircle size={15} />
            Downgrading to Pro on {periodEndFormatted}
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
        ) : isDowngrading ? (
          <p className="text-center text-[12px] text-[var(--color-text-tertiary)]">
            You&apos;ll keep Max access until {periodEndFormatted ?? "your billing period ends"}.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {plan === "max" && (
              <button
                onClick={() => setDowngradeConfirmOpen(true)}
                disabled={downgradeLoading}
                className="w-full cursor-pointer rounded-[var(--radius-pill)] border border-[var(--color-border-subtle)] bg-transparent px-8 py-[14px] text-[15px] font-medium text-[var(--color-text-secondary)] transition-[border-color,color] duration-[180ms] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {downgradeLoading ? "Scheduling…" : "Downgrade to Pro — $9/mo"}
              </button>
            )}
            <button
              onClick={() => setCancelConfirmOpen(true)}
              disabled={cancelLoading}
              className="w-full cursor-pointer rounded-[var(--radius-pill)] border border-[var(--color-border-subtle)] bg-transparent px-8 py-[14px] text-[15px] font-medium text-[var(--color-text-secondary)] transition-[border-color,color] duration-[180ms] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cancelLoading ? "Canceling…" : "Cancel Subscription"}
            </button>
          </div>
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

      {/* Downgrade confirmation modal */}
      {isClient && createPortal(
        <AnimatePresence>
          {downgradeConfirmOpen && (
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="downgrade-modal-title"
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={BACKDROP_TRANSITION}
              onClick={() => !downgradeLoading && setDowngradeConfirmOpen(false)}
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
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/10">
                    <ArrowDownCircle size={16} className="text-amber-400" />
                  </div>
                  <h2
                    id="downgrade-modal-title"
                    className="text-[17px] font-semibold text-[var(--color-text-primary)]"
                  >
                    Downgrade to Pro?
                  </h2>
                </div>

                <p className="mb-2 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
                  You&apos;ll keep Max access until{" "}
                  <span className="font-medium text-[var(--color-text-primary)]">
                    {periodEndFormatted ?? "the end of your billing period"}
                  </span>
                  . After that, your plan switches to Pro at $9/mo.
                </p>
                <p className="mb-7 text-[13px] text-[var(--color-text-tertiary)]">
                  No refund is issued for the current period. You can upgrade back to Max at any time.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setDowngradeConfirmOpen(false)}
                    disabled={downgradeLoading}
                    className="flex-1 cursor-pointer rounded-[var(--radius-pill)] border border-[var(--color-border-subtle)] bg-transparent px-4 py-2.5 text-[14px] font-medium text-[var(--color-text-secondary)] transition-colors duration-[120ms] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Keep Max
                  </button>
                  <button
                    onClick={handleDowngrade}
                    disabled={downgradeLoading}
                    className="group relative flex-1 cursor-pointer overflow-hidden rounded-[var(--radius-pill)] bg-amber-500 px-4 py-2.5 text-[14px] font-semibold text-white transition-[background-color] duration-[120ms] hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 translate-y-full bg-black/20 transition-transform duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0"
                    />
                    <span className="relative">
                      {downgradeLoading ? "Scheduling…" : "Yes, downgrade"}
                    </span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Upgrade confirmation modal */}
      {isClient && createPortal(
        <AnimatePresence>
          {upgradeConfirmOpen && (
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="upgrade-modal-title"
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={BACKDROP_TRANSITION}
              onClick={() => !upgradeLoading && setUpgradeConfirmOpen(false)}
            >
              <motion.div
                className="w-full max-w-[400px] rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] p-7 shadow-[var(--shadow-3)]"
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={CARD_TRANSITION}
                onClick={(e) => e.stopPropagation()}
              >
                <h2
                  id="upgrade-modal-title"
                  className="mb-5 text-[17px] font-semibold text-[var(--color-text-primary)]"
                >
                  Upgrade to Max
                </h2>

                <p className="mb-2 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
                  Upgrade to Max — $19/mo. You&apos;ll be charged{" "}
                  {previewLoading ? (
                    <span className="inline-block h-[1em] w-12 animate-pulse rounded bg-[var(--color-border-subtle)] align-middle" />
                  ) : previewFailed || !previewAmount ? (
                    <span>a prorated amount</span>
                  ) : (
                    <strong>
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: previewAmount.currency.toUpperCase(),
                      }).format(previewAmount.amountDue / 100)}
                    </strong>
                  )}{" "}
                  now for the remainder of this billing period, then $19/mo going
                  forward.
                </p>

                {cancelAt && (
                  <p className="mb-2 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
                    Your scheduled cancellation will also be removed and your
                    subscription reactivated.
                  </p>
                )}

                <p className="mb-7 text-[13px] text-[var(--color-text-tertiary)]">
                  Your existing payment method will be charged automatically.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setUpgradeConfirmOpen(false)}
                    disabled={upgradeLoading}
                    className="flex-1 cursor-pointer rounded-[var(--radius-pill)] border border-[var(--color-border-subtle)] bg-transparent px-4 py-2.5 text-[14px] font-medium text-[var(--color-text-secondary)] transition-colors duration-[120ms] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpgrade}
                    disabled={upgradeLoading}
                    className="group relative flex-1 cursor-pointer overflow-hidden rounded-[var(--radius-pill)] bg-[var(--color-accent-primary)] px-4 py-2.5 text-[14px] font-semibold text-[var(--color-bg-0)] transition-[background-color,box-shadow] duration-[120ms] hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 translate-y-full bg-black/25 transition-transform duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0"
                    />
                    <span className="relative">
                      {upgradeLoading ? "Upgrading…" : "Upgrade — $19/mo"}
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
