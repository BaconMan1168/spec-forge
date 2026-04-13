"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
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

export default function PricingPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<"pro" | "max" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<"free" | "pro" | "max" | null>(null);
  const autoCheckoutFired = useRef(false);

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
        .select("subscription_status, subscription_plan")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data?.subscription_status === "active") {
            setUserPlan(data.subscription_plan === "max" ? "max" : "pro");
          } else {
            setUserPlan("free");
          }
        });
    });
  }, []);

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
    return (
      <button
        onClick={() => handleUpgrade("max")}
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
              For active PMs and founders using SpecForge regularly.
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
    </main>
  );
}
