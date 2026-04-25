"use client";

import { motion } from "motion/react";

const EASE = [0.22, 1, 0.36, 1] as const;

export interface TocItem {
  id: string;
  label: string;
}

interface LegalPageLayoutProps {
  title: string;
  subtitle?: string;
  effectiveDate: string;
  tocItems: TocItem[];
  children: React.ReactNode;
}

export function LegalPageLayout({
  title,
  subtitle,
  effectiveDate,
  tocItems,
  children,
}: LegalPageLayoutProps) {
  return (
    <div className="relative z-10 min-h-screen">
      {/* Soft background accent — same radial pattern used across marketing */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 h-[600px] w-full"
        style={{
          background:
            "radial-gradient(ellipse 70% 40% at 15% 0%, hsla(220,55%,45%,0.05) 0%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-[1100px] px-8 pb-[120px] lg:px-16">
        {/* Page header */}
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="border-b border-[var(--color-border-subtle)] pb-12 pt-[120px]"
        >
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-disabled)]">
            Legal
          </p>
          <h1 className="mb-4 text-[49px] font-bold leading-[1.05] tracking-[-0.025em] text-[var(--color-text-primary)]">
            {title}
          </h1>
          {subtitle && (
            <p className="mb-5 max-w-[540px] text-[16px] leading-[1.75] text-[var(--color-text-secondary)]">
              {subtitle}
            </p>
          )}
          <p className="text-[13px] text-[var(--color-text-tertiary)]">
            Effective date:{" "}
            <span className="text-[var(--color-text-secondary)]">{effectiveDate}</span>
          </p>
        </motion.header>

        {/* Body: sidebar + content */}
        <div className="mt-12 flex gap-16">
          {/* Sticky sidebar ToC — desktop only */}
          <motion.aside
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.25, ease: EASE }}
            className="hidden w-[200px] flex-shrink-0 lg:block"
            aria-label="Table of contents"
          >
            <div className="sticky top-[96px]">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-disabled)]">
                Contents
              </p>
              <nav>
                <ul className="space-y-0.5">
                  {tocItems.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className="block border-l-2 border-transparent py-[5px] pl-3 text-[13px] leading-[1.5] text-[var(--color-text-tertiary)] transition-[border-color,color] duration-[180ms] hover:border-[var(--color-accent-primary)] hover:text-[var(--color-text-secondary)]"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </motion.aside>

          {/* Main content */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
            className="min-w-0 flex-1"
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

interface LegalSectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
  last?: boolean;
}

export function LegalSection({ id, title, children, last = false }: LegalSectionProps) {
  return (
    <section
      id={id}
      className={`scroll-mt-[96px] ${
        last ? "" : "mb-12 border-b border-[var(--color-border-subtle)] pb-12"
      }`}
    >
      <h2 className="mb-5 text-[20px] font-semibold text-[var(--color-text-primary)]">
        {title}
      </h2>
      <div className="space-y-3 text-[15px] leading-[1.8] text-[var(--color-text-secondary)]">
        {children}
      </div>
    </section>
  );
}
