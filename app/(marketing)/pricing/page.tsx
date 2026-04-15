"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";

const EASE = [0.22, 1, 0.36, 1] as const;
const VIEWPORT = { once: true, margin: "0px 0px -10px 0px" } as const;

const CARD_REVEAL = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: VIEWPORT,
  transition: { duration: 1.5, delay, ease: EASE },
});

function CheckIcon() {
  return (
    <svg
      className="flex-shrink-0 text-[var(--color-accent-primary)]"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

const FREE_FEATURES = [
  "2 projects per month",
  "Up to 5 files per project",
  "AI analysis and proposal generation",
  "Markdown export (up to 3 proposals per project)",
  "Projects expire after 7 days",
];

const PRO_FEATURES = [
  "Up to 20 projects per month",
  "Up to 10 files per project",
  "Full proposal export",
  "Indefinite session persistence",
  "Faster AI processing",
  "Re-run analysis after adding feedback",
];

const MAX_FEATURES = [
  "Unlimited projects",
  "Up to 20 files per project",
  "Full proposal export",
  "Indefinite session persistence",
  "Priority AI processing",
  "Re-run analysis after adding feedback",
  "Early access to new features",
];

const PLAN_RANK: Record<"free" | "pro" | "max", number> = { free: 0, pro: 1, max: 2 };

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

export default function PricingPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<"pro" | "max" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<"free" | "pro" | "max" | null>(null);
  const [cancelAt, setCancelAt] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [upgradeConfirmOpen, setUpgradeConfirmOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewAmount, setPreviewAmount] = useState<{ amountDue: number; currency: string } | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const autoCheckoutFired = useRef(false);

  useEffect(() => { setIsClient(true); }, []);

  // Fetch the current user's plan for plan-aware button states
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        setUserPlan(null);
        return;
      }
      supabase
        .from("profiles")
        .select("subscription_status, subscription_plan, subscription_cancel_at")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.subscription_status === "active") {
            setUserPlan(data.subscription_plan === "max" ? "max" : "pro");
            setCancelAt(data.subscription_cancel_at ?? null);
          } else {
            setUserPlan("free");
          }
        });
    });
  }, []);

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

  async function handleUpgrade(plan: "pro" | "max") {
    setError(null);
    setLoading(plan);

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = `/login?next=${encodeURIComponent(`/pricing?autoCheckout=${plan}`)}`;
        return;
      }

      // Pro users upgrading to Max use the upgrade endpoint (Stripe portal confirm flow).
      // New subscribers (free or unauthenticated) use the checkout endpoint.
      const isUpgrade = userPlan === "pro" && plan === "max";
      const endpoint = isUpgrade ? "/api/billing/upgrade" : "/api/billing/checkout";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const text = await res.text();
      let body: { url?: string; error?: { message?: string } } = {};
      try {
        body = JSON.parse(text);
      } catch {
        setError(`Unexpected server response (${res.status}). Please try again.`);
        return;
      }

      if (!res.ok) {
        setError(body.error?.message ?? `Something went wrong (${res.status}). Please try again.`);
        return;
      }

      if (body.url) {
        window.location.href = body.url;
      } else {
        // Direct upgrade (Pro → Max) — no portal redirect, go to dashboard
        window.location.href = "/dashboard?upgrade=success";
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(null);
    }
  }

  // Auto-trigger checkout when redirected back from login with ?autoCheckout=
  useEffect(() => {
    if (autoCheckoutFired.current) return;
    const plan = searchParams.get("autoCheckout") as "pro" | "max" | null;
    if (plan === "pro" || plan === "max") {
      autoCheckoutFired.current = true;
      handleUpgrade(plan);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const upgradeButtonClass =
    "group inline-flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-[var(--radius-pill)] bg-[var(--color-accent-primary)] px-8 py-[16px] text-[15px] font-semibold text-[var(--color-bg-0)] transition-[background-color,box-shadow,opacity] duration-[180ms] hover:bg-[var(--color-accent-hover)] hover:shadow-[0_6px_20px_hsla(40,85%,58%,0.35)] disabled:cursor-not-allowed disabled:opacity-60";
  const currentPlanButtonClass =
    "inline-flex w-full cursor-default items-center justify-center rounded-[var(--radius-pill)] border border-[var(--color-border-subtle)] px-8 py-[16px] text-[15px] font-semibold text-[var(--color-text-secondary)] opacity-70";

  function renderFreeButton() {
    if (userPlan === null) {
      // Not logged in — show Try for Free
      return (
        <Link
          href="/login"
          className="group inline-flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-[var(--radius-pill)] bg-[var(--color-accent-primary)] px-8 py-[16px] text-[15px] font-semibold text-[var(--color-bg-0)] transition-[background-color,box-shadow] duration-[180ms] hover:bg-[var(--color-accent-hover)] hover:shadow-[0_6px_20px_hsla(40,85%,58%,0.35)]"
        >
          Try for Free
          <span className="ml-0 inline-block max-w-0 overflow-hidden opacity-0 transition-[max-width,opacity,margin-left] duration-[300ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover:ml-1.5 group-hover:max-w-[1.5em] group-hover:opacity-100">
            →
          </span>
        </Link>
      );
    }
    if (userPlan === "free") {
      return <span className={currentPlanButtonClass}>Current Plan</span>;
    }
    // pro or max — they've surpassed this tier
    return <span className={currentPlanButtonClass}>Included in your plan</span>;
  }

  function renderProButton() {
    if (userPlan === "pro") {
      return <span className={currentPlanButtonClass}>Current Plan</span>;
    }
    if (userPlan === "max") {
      return <span className={currentPlanButtonClass}>Included in Max</span>;
    }
    return (
      <button
        onClick={() => handleUpgrade("pro")}
        disabled={loading !== null}
        className={upgradeButtonClass}
      >
        {loading === "pro" ? "Redirecting…" : "Upgrade to Pro"}
        {loading !== "pro" && (
          <span className="ml-0 inline-block max-w-0 overflow-hidden opacity-0 transition-[max-width,opacity,margin-left] duration-[300ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover:ml-1.5 group-hover:max-w-[1.5em] group-hover:opacity-100">
            →
          </span>
        )}
      </button>
    );
  }

  function renderMaxButton() {
    if (userPlan === "max") {
      return <span className={currentPlanButtonClass}>Current Plan</span>;
    }
    const isProUpgrade = userPlan === "pro";
    return (
      <button
        onClick={isProUpgrade ? openUpgradeConfirm : () => handleUpgrade("max")}
        disabled={loading !== null}
        className={upgradeButtonClass}
      >
        {loading === "max" ? "Redirecting…" : "Upgrade to Max"}
        {loading !== "max" && (
          <span className="ml-0 inline-block max-w-0 overflow-hidden opacity-0 transition-[max-width,opacity,margin-left] duration-[300ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover:ml-1.5 group-hover:max-w-[1.5em] group-hover:opacity-100">
            →
          </span>
        )}
      </button>
    );
  }

  return (
    <main className="relative z-10 mx-auto max-w-[1200px] px-16 pb-[120px] pt-[160px]">
      <div className="mb-[80px] text-center">
        <p className="mb-5 text-[13px] font-medium uppercase tracking-[0.1em] text-[var(--color-accent-primary)]">
          Pricing
        </p>
        <h1 className="mb-6 text-[76px] font-bold leading-[1.05] tracking-[-0.03em]">
          Simple, transparent pricing
        </h1>
        <p className="mx-auto max-w-[480px] text-[19px] leading-[1.75] text-[var(--color-text-tertiary)]">
          Start free. Upgrade when you&apos;re ready.
        </p>
      </div>

      {error && (
        <div className="mb-8 rounded-[var(--radius-md)] border border-[var(--color-error,#f87171)]/30 bg-[var(--color-error,#f87171)]/10 px-5 py-3 text-center text-[14px] text-[var(--color-error,#f87171)]">
          {error}
        </div>
      )}

      <div className="flex flex-col items-center justify-center gap-8 md:flex-row md:items-stretch">
        {/* Free card */}
        <motion.div {...CARD_REVEAL(0)} className="w-full max-w-[360px]">
          <div className="flex h-full flex-col rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] p-10 transition-[border-color,box-shadow] duration-[320ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-3)]">
            <p className="mb-5 text-[13px] font-medium uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">
              Free
            </p>
            <div className="mb-2 text-[56px] font-bold leading-none text-[var(--color-text-primary)]">
              $0{" "}
              <span className="text-[20px] font-normal text-[var(--color-text-tertiary)]">
                / month
              </span>
            </div>
            <p className="mb-8 text-[14px] text-[var(--color-text-tertiary)]">
              No credit card required.
            </p>
            <ul className="mb-10 flex flex-col gap-3">
              {FREE_FEATURES.map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-3 text-[14px] text-[var(--color-text-secondary)]"
                >
                  <CheckIcon />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-auto">{renderFreeButton()}</div>
          </div>
        </motion.div>

        {/* Pro card */}
        <motion.div {...CARD_REVEAL(0.3)} className="w-full max-w-[360px]">
          <div className="flex h-full flex-col rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] p-10 transition-[border-color,box-shadow] duration-[320ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-3)]">
            <p className="mb-5 text-[13px] font-medium uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">
              Pro
            </p>
            <div className="mb-2 text-[56px] font-bold leading-none text-[var(--color-text-primary)]">
              $9{" "}
              <span className="text-[20px] font-normal text-[var(--color-text-tertiary)]">
                / month
              </span>
            </div>
            <p className="mb-8 text-[14px] text-[var(--color-text-tertiary)]">
              For active PMs and founders using Xern AI regularly.
            </p>
            <ul className="mb-10 flex flex-col gap-3">
              {PRO_FEATURES.map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-3 text-[14px] text-[var(--color-text-secondary)]"
                >
                  <CheckIcon />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-auto">{renderProButton()}</div>
          </div>
        </motion.div>

        {/* Max card */}
        <motion.div {...CARD_REVEAL(0.6)} className="w-full max-w-[360px]">
          <div className="flex h-full flex-col rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] p-10 transition-[border-color,box-shadow] duration-[320ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-3)]">
            <p className="mb-5 text-[13px] font-medium uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">
              Max
            </p>
            <div className="mb-2 text-[56px] font-bold leading-none text-[var(--color-text-primary)]">
              $19{" "}
              <span className="text-[20px] font-normal text-[var(--color-text-tertiary)]">
                / month
              </span>
            </div>
            <p className="mb-8 text-[14px] text-[var(--color-text-tertiary)]">
              For power users and teams running high volumes of feedback.
            </p>
            <ul className="mb-10 flex flex-col gap-3">
              {MAX_FEATURES.map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-3 text-[14px] text-[var(--color-text-secondary)]"
                >
                  <CheckIcon />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-auto">{renderMaxButton()}</div>
          </div>
        </motion.div>
      </div>

      {/* Upgrade confirmation modal (Pro → Max) */}
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
              onClick={() => loading === null && setUpgradeConfirmOpen(false)}
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
                  now for the remainder of this billing period, then $19/mo going forward.
                </p>

                {cancelAt && (
                  <p className="mb-2 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
                    Your scheduled cancellation will also be removed and your subscription reactivated.
                  </p>
                )}

                <p className="mb-7 text-[13px] text-[var(--color-text-tertiary)]">
                  Your existing payment method will be charged automatically.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setUpgradeConfirmOpen(false)}
                    disabled={loading !== null}
                    className="flex-1 cursor-pointer rounded-[var(--radius-pill)] border border-[var(--color-border-subtle)] bg-transparent px-4 py-2.5 text-[14px] font-medium text-[var(--color-text-secondary)] transition-colors duration-[120ms] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => { setUpgradeConfirmOpen(false); handleUpgrade("max"); }}
                    disabled={loading !== null}
                    className="group relative flex-1 cursor-pointer overflow-hidden rounded-[var(--radius-pill)] bg-[var(--color-accent-primary)] px-4 py-2.5 text-[14px] font-semibold text-[var(--color-bg-0)] transition-[background-color,box-shadow] duration-[120ms] hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 translate-y-full bg-black/25 transition-transform duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0"
                    />
                    <span className="relative">
                      {loading === "max" ? "Upgrading…" : "Upgrade — $19/mo"}
                    </span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </main>
  );
}
