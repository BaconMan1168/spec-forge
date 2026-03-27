import { UploadCloud, Clipboard } from "lucide-react";
import { Button } from "@/components/ui/button";

// To add a new file format: update ACCEPTED_EXTENSIONS in step-upload.tsx and
// add a parser in lib/parse/parse-file.ts. Do NOT add tiles here.
export const INPUT_TYPES = [
  {
    id: "upload" as const,
    label: "Upload files",
    description: "PDF, DOCX, TXT, MD, JSON",
    icon: UploadCloud,
  },
  {
    id: "paste" as const,
    label: "Paste text",
    description: "copy / paste",
    icon: Clipboard,
  },
] as const;

export type InputTypeId = (typeof INPUT_TYPES)[number]["id"];

interface StepTypeSelectProps {
  value: InputTypeId | null;
  onChange: (type: InputTypeId) => void;
  onNext: () => void;
}

export function StepTypeSelect({ value, onChange, onNext }: StepTypeSelectProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.07em] text-[var(--color-text-tertiary)]">
          Choose input method
        </p>
        <div className="grid grid-cols-2 gap-2">
          {INPUT_TYPES.map(({ id, label, description, icon: Icon }) => {
            const selected = value === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onChange(id)}
                className={[
                  "flex flex-col items-center gap-2 rounded-[var(--radius-md)] border px-3 py-5 transition-all",
                  selected
                    ? "border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10"
                    : "border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] hover:border-[var(--color-accent-primary)]/30 hover:bg-[var(--color-surface-2)]",
                ].join(" ")}
              >
                <div
                  className={[
                    "flex h-10 w-10 items-center justify-center rounded-[10px]",
                    selected
                      ? "bg-[var(--color-accent-primary)]/15 text-[var(--color-accent-primary)]"
                      : "bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]",
                  ].join(" ")}
                >
                  <Icon size={19} strokeWidth={1.6} />
                </div>
                <span className="text-[13px] font-medium text-[var(--color-text-primary)]">
                  {label}
                </span>
                <span className="text-[11px] text-[var(--color-text-tertiary)]">
                  {description}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex justify-end">
        <Button size="sm" disabled={!value} onClick={onNext} type="button">
          Next
        </Button>
      </div>
    </div>
  );
}
