// components/projects/new-project-modal.tsx
"use client";

import { useState } from "react";
import { createProject } from "@/app/actions/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewProjectModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>New Project</Button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />

          {/* Card */}
          <div className="relative w-full max-w-sm rounded-[var(--radius-lg)] bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] shadow-[var(--shadow-2)] p-8">
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
          </div>
        </div>
      )}
    </>
  );
}
