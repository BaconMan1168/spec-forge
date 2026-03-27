// components/ui/button.tsx
"use client";

import { motion } from "motion/react";
import { cva, type VariantProps } from "class-variance-authority";
import { type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

// Shared motion config — tween only (design-system §8.3, §8.6: no spring physics)
const HOVER = { scale: 1.02, y: -2 } as const;
const TAP = { scale: 0.97 } as const;
const MOTION_TRANSITION = {
  type: "tween" as const,
  duration: 0.12,
  ease: [0.22, 1, 0.36, 1] as const,
};

const buttonVariants = cva(
  // Base — always applied
  [
    "group relative inline-flex shrink-0 cursor-pointer items-center justify-center",
    "gap-2 overflow-hidden whitespace-nowrap",
    "rounded-[var(--radius-pill)] font-medium",
    "select-none outline-none",
    "transition-[background-color,box-shadow,opacity] duration-[120ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]",
    "focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)]/50",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        // Primary CTA — amber accent (design-system §7 / §1.3)
        default:
          "bg-[var(--color-accent-primary)] text-[var(--color-bg-0)] shadow-[var(--shadow-1)] hover:bg-[var(--color-accent-hover)] hover:shadow-[var(--shadow-2)]",
        // Secondary — glass surface (design-system §7)
        secondary:
          "bg-[var(--color-surface-1)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] hover:border-[var(--color-border-strong)]",
        // Ghost — transparent, low-prominence
        ghost:
          "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-1)] hover:text-[var(--color-text-primary)]",
        // Destructive
        destructive:
          "bg-[var(--color-error)]/10 text-[var(--color-error)] border border-[var(--color-error)]/20 hover:bg-[var(--color-error)]/20",
      },
      size: {
        // padding: 16px vertical / 24px horizontal per design-system §7
        default: "px-6 py-4 text-sm",
        sm: "px-4 py-2.5 text-xs",
        lg: "px-8 py-5 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

type ButtonProps = ComponentPropsWithoutRef<"button"> &
  VariantProps<typeof buttonVariants>;

function Button({
  className,
  variant = "default",
  size = "default",
  children,
  ...props
}: ButtonProps) {
  const isPrimary = variant === "default" || variant == null;

  return (
    <motion.button
      data-slot="button"
      whileHover={HOVER}
      whileTap={TAP}
      transition={MOTION_TRANSITION}
      className={cn(buttonVariants({ variant, size, className }))}
      {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {/* Shimmer sweep — primary buttons only */}
      {isPrimary && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 ease-out group-hover:translate-x-[120%]"
        />
      )}
      {children}
    </motion.button>
  );
}

export { Button, buttonVariants };
