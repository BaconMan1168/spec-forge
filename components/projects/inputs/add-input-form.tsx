"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, Zap, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepTypeSelect, type InputTypeId } from "./step-type-select";
import { StepUpload, validateSourceLabel } from "./step-upload";
import { StepPaste } from "./step-paste";
import {
  uploadFeedbackFiles,
  pasteFeedbackText,
  type UploadResult,
} from "@/app/actions/feedback-files";

const EASE = [0.22, 1, 0.36, 1] as const;

const stepVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

interface AddInputFormProps {
  projectId: string;
}

export function AddInputForm({ projectId }: AddInputFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [direction, setDirection] = useState(1);
  const [selectedType, setSelectedType] = useState<InputTypeId | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [pasteContent, setPasteContent] = useState("");
  const [sourceLabel, setSourceLabel] = useState("");
  const [sourceLabelError, setSourceLabelError] = useState<string | null>(null);
  const [submitResult, setSubmitResult] = useState<UploadResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const goToStep2 = () => {
    setDirection(1);
    setStep(2);
  };

  const goToStep1 = () => {
    setDirection(-1);
    setStep(1);
  };

  const resetForm = () => {
    setStep(1);
    setDirection(1);
    setSelectedType(null);
    setFiles([]);
    setPasteContent("");
    setSourceLabel("");
    setSourceLabelError(null);
    setSubmitResult(null);
  };

  const handleSubmit = () => {
    const err = validateSourceLabel(sourceLabel);
    if (err) {
      setSourceLabelError(err);
      return;
    }
    setSourceLabelError(null);

    startTransition(async () => {
      if (selectedType === "paste") {
        const record = await pasteFeedbackText({
          projectId,
          sourceType: sourceLabel,
          content: pasteContent,
        });
        setSubmitResult({ succeeded: [record], failed: [] });
      } else {
        const formData = new FormData();
        formData.append("project_id", projectId);
        formData.append("source_type", sourceLabel);
        files.forEach((f) => formData.append("files", f));
        const result = await uploadFeedbackFiles(formData);
        setSubmitResult(result);
      }
    });
  };

  // Success state
  if (submitResult) {
    const count = submitResult.succeeded.length;
    return (
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[hsl(150_55%_42%/0.25)] bg-[hsl(150_55%_42%/0.08)] px-4 py-3.5">
            <CheckCircle2
              size={18}
              className="mt-0.5 shrink-0 text-[hsl(150,55%,42%)]"
              strokeWidth={2}
            />
            <div>
              <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
                {count} {count === 1 ? "item" : "items"} added under &ldquo;
                {sourceLabel}&rdquo;
              </p>
              <p className="mt-0.5 text-[11px] text-[var(--color-text-tertiary)]">
                Parsed and ready for analysis
              </p>
              {submitResult.failed.length > 0 && (
                <p className="mt-1 text-[11px] text-[var(--color-error)]">
                  {submitResult.failed.length} file(s) failed:{" "}
                  {submitResult.failed.map((f) => f.name).join(", ")}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={resetForm}
              type="button"
            >
              <Plus size={13} />
              Add more
            </Button>
            <Button
              size="sm"
              onClick={() => router.push(`/projects/${projectId}`)}
              type="button"
            >
              <Zap size={13} />
              Analyze
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)]">
      {/* Card header */}
      <div className="flex items-center justify-between px-5 pt-5">
        <p className="text-[13px] font-semibold tracking-[0.01em] text-[var(--color-text-primary)]">
          Add Feedback
        </p>
        <div className="flex gap-1.5">
          {[1, 2].map((s) => (
            <span
              key={s}
              className={[
                "h-1.5 w-1.5 rounded-full transition-all",
                step === s
                  ? "bg-[var(--color-accent-primary)]"
                  : step > s
                  ? "bg-[var(--color-accent-primary)]/35"
                  : "bg-[var(--color-surface-2)]",
              ].join(" ")}
            />
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="overflow-hidden px-5 pb-5 pt-4">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "tween", duration: 0.32, ease: EASE }}
          >
            {step === 1 ? (
              <StepTypeSelect
                value={selectedType}
                onChange={setSelectedType}
                onNext={goToStep2}
              />
            ) : selectedType === "paste" ? (
              <StepPaste
                content={pasteContent}
                onContentChange={setPasteContent}
                sourceLabel={sourceLabel}
                onSourceLabelChange={setSourceLabel}
                sourceLabelError={sourceLabelError}
                onBack={goToStep1}
                onSubmit={handleSubmit}
                isSubmitting={isPending}
              />
            ) : (
              <StepUpload
                files={files}
                onFilesChange={setFiles}
                sourceLabel={sourceLabel}
                onSourceLabelChange={setSourceLabel}
                sourceLabelError={sourceLabelError}
                onBack={goToStep1}
                onSubmit={handleSubmit}
                isSubmitting={isPending}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
