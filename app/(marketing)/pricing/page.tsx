"use client";

import Link from "next/link";
import { motion } from "motion/react";

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
  "Unlimited projects",
  "Up to 20 files per project",
  "Full proposal export",
  "Indefinite session persistence",
  "Priority AI processing",
  "Re-run analysis after adding feedback",
];

async function handleUpgrade() {
  const res = await fetch("/api/billing/checkout", { method: "POST" });
  const body = await res.json();
  if (body.url) window.location.href = body.url;
}

export default function PricingPage() {
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

      <div className="flex flex-col items-center justify-center gap-8 md:flex-row md:items-stretch">
        {/* Free card */}
        <motion.div {...CARD_REVEAL(0)} className="w-full max-w-[420px]">
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
            <div className="mt-auto">
              <Link
                href="/login"
                className="group inline-flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-[var(--radius-pill)] bg-[var(--color-accent-primary)] px-8 py-[16px] text-[15px] font-semibold text-[var(--color-bg-0)] transition-[background-color,box-shadow] duration-[180ms] hover:bg-[var(--color-accent-hover)] hover:shadow-[0_6px_20px_hsla(40,85%,58%,0.35)]"
              >
                Try for Free
                <span className="ml-0 inline-block max-w-0 overflow-hidden opacity-0 transition-[max-width,opacity,margin-left] duration-[300ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover:ml-1.5 group-hover:max-w-[1.5em] group-hover:opacity-100">
                  →
                </span>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Pro card — live */}
        <motion.div {...CARD_REVEAL(0.5)} className="w-full max-w-[420px]">
          <div className="flex h-full flex-col rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] p-10 transition-[border-color,box-shadow] duration-[320ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-3)]">
            <p className="mb-5 text-[13px] font-medium uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">
              Pro
            </p>
            <div className="mb-2 text-[56px] font-bold leading-none text-[var(--color-text-primary)]">
              $29{" "}
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
            <div className="mt-auto">
              <button
                onClick={handleUpgrade}
                className="group inline-flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-[var(--radius-pill)] bg-[var(--color-accent-primary)] px-8 py-[16px] text-[15px] font-semibold text-[var(--color-bg-0)] transition-[background-color,box-shadow] duration-[180ms] hover:bg-[var(--color-accent-hover)] hover:shadow-[0_6px_20px_hsla(40,85%,58%,0.35)]"
              >
                Upgrade to Pro
                <span className="ml-0 inline-block max-w-0 overflow-hidden opacity-0 transition-[max-width,opacity,margin-left] duration-[300ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover:ml-1.5 group-hover:max-w-[1.5em] group-hover:opacity-100">
                  →
                </span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
