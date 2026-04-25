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

export function CtaSection({ isAuthenticated = false }: { isAuthenticated?: boolean }) {
  return (
    <>
      {/* Final CTA */}
      <section className="relative z-10 overflow-hidden border-t border-[hsl(220_10%_14%)] px-16 py-[140px] text-center">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[800px] -translate-x-1/2 -translate-y-1/2"
          style={{
            background:
              "radial-gradient(ellipse at center, hsla(220,55%,50%,0.07) 0%, transparent 70%)",
          }}
        />
        <motion.h2
          {...REVEAL_UP(0)}
          className="relative mb-6 text-[80px] font-bold leading-[1.05] tracking-[-0.03em]"
        >
          Ready to ship faster?
        </motion.h2>
        <motion.p
          {...REVEAL_UP(0.3)}
          className="relative mx-auto mb-14 max-w-[420px] text-[19px] leading-[1.75] text-[var(--color-text-tertiary)]"
        >
          Join early users turning raw customer feedback into AI-ready specs in
          minutes.
        </motion.p>
        <motion.div
          {...REVEAL_UP(0.6)}
          className="relative flex items-center justify-center gap-4"
        >
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
            <>
              <Link
                href="/login"
                className="group inline-flex cursor-pointer items-center overflow-hidden rounded-[var(--radius-pill)] bg-[var(--color-accent-primary)] px-9 py-[18px] text-[17px] font-semibold text-[var(--color-bg-0)] transition-[background-color,box-shadow] duration-[180ms] hover:bg-[var(--color-accent-hover)] hover:shadow-[0_6px_20px_hsla(40,85%,58%,0.35)]"
              >
                Start for Free
                <span className="ml-0 inline-block max-w-0 overflow-hidden opacity-0 transition-[max-width,opacity,margin-left] duration-[300ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover:ml-1.5 group-hover:max-w-[1.5em] group-hover:opacity-100">
                  →
                </span>
              </Link>
              <Link
                href="/login"
                className="inline-flex cursor-pointer items-center rounded-[var(--radius-pill)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] px-8 py-[18px] text-[17px] font-medium text-[var(--color-text-secondary)] transition-[background-color,border-color,color] duration-[180ms] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-1)] hover:text-[var(--color-text-primary)]"
              >
                Sign In
              </Link>
            </>
          )}
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 mx-auto flex max-w-[1200px] items-center justify-between px-16 py-12 border-t border-[hsl(220_10%_13%)]">
        <div className="flex items-center gap-2 text-[14px] font-semibold text-[var(--color-text-secondary)]">
          <div
            aria-hidden="true"
            className="h-[18px] w-[18px] flex-shrink-0"
            style={{
              background:
                "linear-gradient(135deg, hsl(220 55% 40%), hsl(240 55% 50%))",
              clipPath:
                "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)",
            }}
          />
          Xern
        </div>
        <nav className="flex gap-7 text-[13px] text-[var(--color-text-tertiary)]">
          <Link href="/" className="transition-colors duration-[180ms] hover:text-[var(--color-text-secondary)]">Home</Link>
          <Link href="/pricing" className="transition-colors duration-[180ms] hover:text-[var(--color-text-secondary)]">Pricing</Link>
          <Link href="/privacy" className="transition-colors duration-[180ms] hover:text-[var(--color-text-secondary)]">Privacy Policy</Link>
          <Link href="/terms" className="transition-colors duration-[180ms] hover:text-[var(--color-text-secondary)]">Terms of Service</Link>
        </nav>
        <p className="text-[12px] text-[hsl(220_6%_32%)]">
          © 2026 Xern AI. All rights reserved.
        </p>
      </footer>
    </>
  );
}
