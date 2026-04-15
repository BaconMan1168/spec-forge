"use client";

import { motion } from "motion/react";

const EASE = [0.22, 1, 0.36, 1] as const;
const VIEWPORT = { once: true, margin: "0px 0px -10px 0px" } as const;

const REVEAL_LEFT = {
  initial: { opacity: 0, x: -36 },
  whileInView: { opacity: 1, x: 0 },
  viewport: VIEWPORT,
  transition: { duration: 1.2, ease: EASE },
} as const;

const REVEAL_RIGHT = {
  initial: { opacity: 0, x: 36 },
  whileInView: { opacity: 1, x: 0 },
  viewport: VIEWPORT,
  transition: { duration: 1.2, delay: 0.3, ease: EASE },
} as const;

const REVEAL_UP = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: VIEWPORT,
} as const;

// Upload icon
function UploadIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  );
}

// Sparkle / star icon
function SparkleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}

// Share / export icon
function ExportIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
      <polyline points="16 6 12 2 8 6"/>
      <line x1="12" y1="2" x2="12" y2="15"/>
    </svg>
  );
}

const FILE_TAGS = [".txt", ".pdf", ".docx", ".json", ".md", "Paste text"];

export function CapabilitiesSection() {
  return (
    <section id="capabilities" className="relative z-10 mx-auto max-w-[1200px] px-16 py-[120px]">
      {/* Section intro */}
      <motion.p
        {...REVEAL_UP}
        transition={{ duration: 1.2, ease: EASE }}
        className="mb-5 text-[13px] font-medium uppercase tracking-[0.1em] text-[var(--color-accent-primary)]"
      >
        Capabilities
      </motion.p>
      <motion.h2
        {...REVEAL_UP}
        transition={{ duration: 1.2, delay: 0.3, ease: EASE }}
        className="mb-6 max-w-[820px] text-[76px] font-bold leading-[1.05] tracking-[-0.03em]"
      >
        Everything you need to go
        <br />
        from discovery to delivery
      </motion.h2>
      <motion.p
        {...REVEAL_UP}
        transition={{ duration: 1.2, delay: 0.6, ease: EASE }}
        className="mb-24 max-w-[500px] text-[19px] leading-[1.75] text-[var(--color-text-tertiary)]"
      >
        No more manual synthesis. Xern AI turns messy qualitative feedback
        into structured, evidence-backed specs in minutes.
      </motion.p>

      {/* Capability 1 — Multi-Source Ingestion */}
      <div className="grid grid-cols-2 gap-20 border-t border-[var(--color-border-subtle)] py-20">
        <motion.div {...REVEAL_LEFT}>
          <div className="mb-7 flex h-[52px] w-[52px] items-center justify-center rounded-[16px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] text-[var(--color-analog-2)]">
            <UploadIcon />
          </div>
          <h3 className="text-[48px] font-bold leading-[1.1] tracking-[-0.025em]">
            Multi-Source
            <br />
            Ingestion
          </h3>
        </motion.div>
        <motion.div {...REVEAL_RIGHT} className="pt-2">
          <p className="mb-7 text-[18px] leading-[1.8] text-[var(--color-text-secondary)]">
            Upload files or paste raw text from any source. Every file type your
            workflow already uses is supported — no reformatting required.
          </p>
          <div className="flex flex-wrap gap-2">
            {FILE_TAGS.map((tag) => (
              <span
                key={tag}
                className="rounded-[var(--radius-pill)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] px-3.5 py-1.5 text-[13px] font-medium text-[var(--color-text-secondary)]"
              >
                {tag}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Capability 2 — AI-Powered Synthesis */}
      <div className="grid grid-cols-2 gap-20 border-t border-[var(--color-border-subtle)] py-20">
        <motion.div {...REVEAL_LEFT}>
          <div className="mb-7 flex h-[52px] w-[52px] items-center justify-center rounded-[16px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] text-[var(--color-analog-2)]">
            <SparkleIcon />
          </div>
          <h3 className="text-[48px] font-bold leading-[1.1] tracking-[-0.025em]">
            AI-Powered
            <br />
            Synthesis
          </h3>
        </motion.div>
        <motion.div {...REVEAL_RIGHT} className="pt-2">
          <p className="text-[18px] leading-[1.8] text-[var(--color-text-secondary)]">
            Identify recurring themes and pain points across all your inputs.
            Every surfaced insight is backed by direct customer quotes —
            grounded in your actual source material, never hallucinated.
          </p>
        </motion.div>
      </div>

      {/* Capability 3 — Exportable Proposals */}
      <div className="grid grid-cols-2 gap-20 border-t border-[var(--color-border-subtle)] py-20">
        <motion.div {...REVEAL_LEFT}>
          <div className="mb-7 flex h-[52px] w-[52px] items-center justify-center rounded-[16px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] text-[var(--color-analog-2)]">
            <ExportIcon />
          </div>
          <h3 className="text-[48px] font-bold leading-[1.1] tracking-[-0.025em]">
            Exportable
            <br />
            Proposals
          </h3>
        </motion.div>
        <motion.div {...REVEAL_RIGHT} className="pt-2">
          <p className="text-[18px] leading-[1.8] text-[var(--color-text-secondary)]">
            Generate structured feature proposals with problem statements,
            evidence, and engineering task breakdowns. Export as Markdown and
            send directly to Cursor, Claude Code, ChatGPT, Gemini, or any
            coding agent — or share with your team instantly.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
