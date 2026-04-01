"use client";

import { motion } from "motion/react";

const EASE = [0.22, 1, 0.36, 1] as const;
const VIEWPORT = { once: true, margin: "0px 0px -10px 0px" } as const;

const REVEAL_UP = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: VIEWPORT,
  transition: { duration: 1.2, delay, ease: EASE },
});

const STEPS = [
  {
    num: "1",
    title: "Upload Feedback",
    desc: "Add files or paste text from interviews, surveys, support tickets, or Slack exports. Label each input by source type — interview, survey, support ticket — so the AI can weight insights appropriately across your entire corpus.",
  },
  {
    num: "2",
    title: "Run Analysis",
    desc: "SpecForge reads all your inputs simultaneously, surfaces recurring patterns, and attaches direct customer quotes to each theme as evidence. No hallucination — every insight traces back to something a real user said.",
  },
  {
    num: "3",
    title: "Export & Build",
    desc: "Copy or download your proposals as Markdown and paste directly into Cursor, Claude Code, or any AI coding agent. Full problem statement, supporting evidence, and atomic engineering tasks — ready to hand to a builder.",
  },
] as const;

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="relative z-10 mx-auto max-w-[1200px] px-16 py-[120px]"
    >
      {/* Intro */}
      <motion.p
        {...REVEAL_UP(0)}
        className="mb-5 text-[13px] font-medium uppercase tracking-[0.1em] text-[var(--color-accent-primary)]"
      >
        How it works
      </motion.p>
      <motion.h2
        {...REVEAL_UP(0.3)}
        className="mb-6 max-w-[700px] text-[76px] font-bold leading-[1.05] tracking-[-0.03em]"
      >
        Three steps from
        <br />
        feedback to spec
      </motion.h2>
      <motion.p
        {...REVEAL_UP(0.6)}
        className="mb-24 max-w-[480px] text-[19px] leading-[1.75] text-[var(--color-text-tertiary)]"
      >
        The fastest path from raw discovery input to an AI-ready engineering
        spec.
      </motion.p>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical connector line */}
        <div
          aria-hidden="true"
          className="absolute left-[53px] top-[100px] bottom-[100px] w-px"
          style={{
            background:
              "linear-gradient(to bottom, transparent, var(--color-border-subtle) 10%, var(--color-border-subtle) 90%, transparent)",
          }}
        />

        {STEPS.map((step, i) => (
          <div
            key={step.num}
            className="grid grid-cols-[108px_1fr] gap-14 py-[72px]"
          >
            {/* Number circle */}
            <motion.div
              {...REVEAL_UP(i * 0.15)}
              className="relative z-10 flex h-[108px] w-[108px] flex-shrink-0 items-center justify-center rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] text-[44px] font-bold text-[var(--color-accent-primary)] transition-[border-color,box-shadow,background-color] duration-[400ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:border-[hsla(40,85%,58%,0.5)] hover:bg-[var(--color-surface-1)] hover:shadow-[0_0_32px_hsla(40,85%,58%,0.18)]"
            >
              {step.num}
            </motion.div>

            {/* Text */}
            <div className="pt-5">
              <motion.h3
                {...REVEAL_UP(i * 0.15 + 0.15)}
                className="mb-5 text-[40px] font-bold leading-[1.1] tracking-[-0.02em] text-[var(--color-text-primary)]"
              >
                {step.title}
              </motion.h3>
              <motion.p
                {...REVEAL_UP(i * 0.15 + 0.3)}
                className="max-w-[640px] text-[18px] leading-[1.8] text-[var(--color-text-secondary)]"
              >
                {step.desc}
              </motion.p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
