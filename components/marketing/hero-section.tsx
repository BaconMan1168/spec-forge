"use client";

import Link from "next/link";
import { motion } from "motion/react";

const EASE = [0.22, 1, 0.36, 1] as const;

export function HeroSection({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  return (
    <section className="relative z-10 mx-auto min-h-screen max-w-[1200px] px-16 pb-[120px] pt-[160px] flex items-center">
      {/* Subtle radial tint behind text */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 60% at 20% 50%, hsla(220,55%,45%,0.07) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 80% 50%, hsla(40,85%,58%,0.04) 0%, transparent 70%)",
        }}
      />

      <div className="w-full">
        {/* Staggered headline — line 1 left, line 2 right */}
        <div className="mb-14">
          <motion.span
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.6, ease: EASE }}
            className="block text-left text-[112px] font-bold leading-[0.98] tracking-[-0.035em]"
            style={{
              background: "linear-gradient(to bottom, var(--color-text-primary) 30%, hsl(220 10% 70%))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            From Raw Feedback
          </motion.span>
          <motion.span
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.85, ease: EASE }}
            className="block text-right text-[112px] font-bold leading-[0.98] tracking-[-0.035em]"
            style={{
              background:
                "linear-gradient(90deg, var(--color-analog-1) 0%, var(--color-text-primary) 40%, var(--color-accent-primary) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            to Actionable Specs
          </motion.span>
        </div>

        {/* Bottom row: subtext left, CTAs right */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.2, ease: EASE }}
          className="flex items-end justify-between gap-16"
        >
          <p className="max-w-[440px] text-[19px] leading-[1.75] text-[var(--color-text-tertiary)]">
            Upload customer interviews and feedback. SpecForge synthesizes
            insights and generates structured feature proposals — ready to paste
            into Cursor or Claude Code.
          </p>

          <div className="flex flex-shrink-0 items-center gap-3.5">
            {/* Authenticated users go straight to dashboard; guests see Start for Free */}
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="group inline-flex cursor-pointer items-center overflow-hidden rounded-[var(--radius-pill)] bg-[var(--color-accent-primary)] px-9 py-[18px] text-[17px] font-semibold text-[var(--color-bg-0)] transition-[background-color,box-shadow] duration-[180ms] hover:bg-[var(--color-accent-hover)] hover:shadow-[0_6px_20px_hsla(40,85%,58%,0.35)]"
              >
                Go to Dashboard
                <span className="ml-0 inline-block max-w-0 overflow-hidden opacity-0 transition-[max-width,opacity,margin-left] duration-[300ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover:ml-1.5 group-hover:max-w-[1.5em] group-hover:opacity-100">
                  →
                </span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="group inline-flex cursor-pointer items-center overflow-hidden rounded-[var(--radius-pill)] bg-[var(--color-accent-primary)] px-9 py-[18px] text-[17px] font-semibold text-[var(--color-bg-0)] transition-[background-color,box-shadow] duration-[180ms] hover:bg-[var(--color-accent-hover)] hover:shadow-[0_6px_20px_hsla(40,85%,58%,0.35)]"
              >
                Start for Free
                <span className="ml-0 inline-block max-w-0 overflow-hidden opacity-0 transition-[max-width,opacity,margin-left] duration-[300ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover:ml-1.5 group-hover:max-w-[1.5em] group-hover:opacity-100">
                  →
                </span>
              </Link>
            )}

            {/* See How It Works — scroll anchor */}
            <Link
              href="#how-it-works"
              className="inline-flex cursor-pointer items-center rounded-[var(--radius-pill)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] px-8 py-[18px] text-[17px] font-medium text-[var(--color-text-secondary)] transition-[background-color,border-color,color] duration-[180ms] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-1)] hover:text-[var(--color-text-primary)]"
            >
              See How It Works
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
