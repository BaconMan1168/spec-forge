// components/projects/new-project-modal.tsx
"use client";

import { useState, useTransition, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";

// Returns false during SSR, true on the client — no useEffect/setState needed.
// This avoids the react-compiler "setState in effect" lint error while still
// preventing hydration mismatches when accessing document.body.
const useIsClient = () =>
  useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
import { AnimatePresence, motion } from "motion/react";
import { createProject } from "@/app/actions/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlanLimitTooltip } from "@/components/billing/plan-limit-tooltip";
import type { LimitResult } from "@/lib/billing/limits";

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

interface NewProjectModalProps {
  canCreate?: LimitResult;
}

export function NewProjectModal({ canCreate = { allowed: true, reason: "" } }: NewProjectModalProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [nameError, setNameError] = useState<string | null>(null);
  const isClient = useIsClient();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    if (!name?.trim()) {
      setNameError("Project name is required");
      return;
    }
    startTransition(async () => {
      await createProject(formData);
    });
  }

  return (
    <>
      <PlanLimitTooltip allowed={canCreate.allowed} reason={canCreate.reason}>
        <Button onClick={canCreate.allowed ? () => setOpen(true) : undefined}>New Project</Button>
      </PlanLimitTooltip>

      {isClient && createPortal(
        <AnimatePresence>
          {open && (
            // Renders directly into document.body — escapes any parent
            // transform/overflow/contain stacking context completely
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={BACKDROP_TRANSITION}
              onClick={() => setOpen(false)}
            >
              {/* Card — stopPropagation prevents backdrop close on inner clicks */}
              <motion.div
                className="w-full max-w-sm rounded-[var(--radius-xl)] bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] shadow-[var(--shadow-3)] p-8"
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={CARD_TRANSITION}
                onClick={(e) => e.stopPropagation()}
              >
                <h2
                  id="modal-title"
                  className="text-lg font-semibold text-[var(--color-text-primary)] mb-6"
                >
                  New Project
                </h2>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
                  <div>
                    <Input
                      label="Project name"
                      name="name"
                      type="text"
                      placeholder="e.g. Q2 Discovery Sprint"
                      autoFocus
                      disabled={isPending}
                      onChange={() => setNameError(null)}
                    />
                    {nameError && <p role="alert" className="mt-1 text-sm text-[var(--color-error)]">{nameError}</p>}
                  </div>

                  <div className="flex gap-3 justify-end">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setOpen(false)}
                      disabled={isPending}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isPending}>
                      {isPending && <Loader2 size={13} className="animate-spin" />}
                      {isPending ? "Creating…" : "Create"}
                    </Button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
