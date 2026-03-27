// components/projects/new-project-modal.tsx
"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { createProject } from "@/app/actions/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MODAL_TRANSITION = {
  type: "tween" as const,
  duration: 0.28,
  ease: [0.22, 1, 0.36, 1] as const,
};

const BACKDROP_TRANSITION = {
  type: "tween" as const,
  duration: 0.18,
  ease: "easeOut" as const,
};

export function NewProjectModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>New Project</Button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={BACKDROP_TRANSITION}
          >
            {/* Backdrop */}
            <div
              data-backdrop
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            {/* Dialog card */}
            <motion.div
              className="relative w-full max-w-sm rounded-[var(--radius-xl)] bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] shadow-[var(--shadow-3)] p-8"
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={MODAL_TRANSITION}
            >
              <h2
                id="modal-title"
                className="text-lg font-semibold text-[var(--color-text-primary)] mb-6"
              >
                New Project
              </h2>

              <form action={createProject} className="flex flex-col gap-6">
                <Input
                  label="Project name"
                  name="name"
                  type="text"
                  placeholder="e.g. Q2 Discovery Sprint"
                  required
                  autoFocus
                />

                <div className="flex gap-3 justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Create</Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
