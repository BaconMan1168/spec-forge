"use client";

import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { InsightQuote } from "@/lib/types/database";

interface QuotesModalProps {
  themeName: string;
  quotes: InsightQuote[];
  isOpen: boolean;
  onClose: () => void;
}

export function QuotesModal({ themeName, quotes, isOpen, onClose }: QuotesModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ backgroundColor: "hsla(220,18%,4%,0.8)", backdropFilter: "blur(4px)" }}
          onClick={onClose}
        >
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-xl rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] p-6 shadow-[var(--shadow-3)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--color-text-tertiary)]">
                  All quotes
                </p>
                <h2 className="mt-1 text-[15px] font-semibold text-[var(--color-text-primary)]">
                  {themeName}
                </h2>
              </div>
              <button
                aria-label="Close"
                onClick={onClose}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]"
              >
                <X size={15} strokeWidth={1.8} />
              </button>
            </div>

            <div
              className="flex flex-col gap-3 overflow-y-auto"
              style={{ maxHeight: "60vh" }}
            >
              {quotes.map((q, i) => (
                <div
                  key={i}
                  className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-1)] p-4"
                >
                  <p className="text-[13px] italic leading-relaxed text-[var(--color-text-secondary)]">
                    &ldquo;{q.quote}&rdquo;
                  </p>
                  <p className="mt-2 text-[11px] text-[var(--color-text-disabled)]">
                    — {q.sourceLabel}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
