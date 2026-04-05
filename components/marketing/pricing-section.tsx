"use client";

import Link from "next/link";
import { motion } from "motion/react";

const EASE = [0.22, 1, 0.36, 1] as const;
const VIEWPORT = { once: true, margin: "0px 0px -10px 0px" } as const;

const REVEAL_UP = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: VIEWPORT,
  transition: { duration: 1.2, delay, ease: EASE },
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
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

const FEATURES = [
  "Unlimited projects",
  "All file types (.txt, .pdf, .docx, .json, .md)",
  "AI synthesis + proposal generation",
  "Markdown export to any coding agent",
  "Priority feedback channel",
];

export function PricingSection() {
  return (
    <section className="relative z-10 mx-auto max-w-[1200px] px-16 py-[120px] text-center">
      <motion.p
        {...REVEAL_UP(0)}
        className="mb-5 text-[13px] font-medium uppercase tracking-[0.1em] text-[var(--color-accent-primary)]"
      >
        Pricing
      </motion.p>
      <motion.h2
        {...REVEAL_UP(0.3)}
        className="mb-6 text-[76px] font-bold leading-[1.05] tracking-[-0.03em]"
      >
        Simple, transparent pricing
      </motion.h2>
      <motion.p
        {...REVEAL_UP(0.6)}
        className="mx-auto mb-[72px] max-w-[480px] text-[19px] leading-[1.75] text-[var(--color-text-tertiary)]"
      >
        One plan, no surprises. Full access while we build with early users.
      </motion.p>

      {/* Reveal wrapper separate from card so hover transition doesn't override scroll animation */}
      <motion.div {...REVEAL_UP(0.9)} className="mx-auto max-w-[580px]">
        <div className="rounded-[28px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] p-14 text-center transition-[border-color,box-shadow] duration-[320ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-3)]">
          <p className="mb-5 text-[13px] font-medium uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">
            Free
          </p>
          <div className="mb-2.5 text-[64px] font-bold leading-none text-[var(--color-text-primary)]">
            $0{" "}
            <span className="text-[22px] font-normal text-[var(--color-text-tertiary)]">
              / month
            </span>
          </div>
          <p className="mb-10 text-[15px] text-[var(--color-text-tertiary)]">
            No credit card required.
          </p>
          <ul className="mb-11 flex flex-col gap-4 text-left">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3 text-[15px] text-[var(--color-text-secondary)]">
                <CheckIcon />
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/login"
            className="group inline-flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-[var(--radius-pill)] bg-[var(--color-accent-primary)] px-8 py-[18px] text-[16px] font-semibold text-[var(--color-bg-0)] transition-[background-color,box-shadow] duration-[180ms] hover:bg-[var(--color-accent-hover)] hover:shadow-[0_6px_20px_hsla(40,85%,58%,0.35)]"
          >
            Try for Free
            <span className="ml-0 inline-block max-w-0 overflow-hidden opacity-0 transition-[max-width,opacity,margin-left] duration-[300ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover:ml-1.5 group-hover:max-w-[1.5em] group-hover:opacity-100">
              →
            </span>
          </Link>
          <Link
            href="/pricing"
            className="mt-4 block text-[13px] text-[var(--color-text-tertiary)] underline transition-colors duration-[180ms] hover:text-[var(--color-text-secondary)]"
          >
            View full pricing details →
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
