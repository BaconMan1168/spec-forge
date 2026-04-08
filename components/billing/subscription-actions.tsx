"use client";

import { useState } from "react";
import Link from "next/link";

interface SubscriptionActionsProps {
  plan: "free" | "pro" | "max";
  cancelAt: string | null; // ISO date string if pending cancellation
}

export function SubscriptionActions({ plan, cancelAt }: SubscriptionActionsProps) {
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade() {
    setError(null);
    setUpgradeLoading(true);
    try {
      const res = await fetch("/api/billing/upgrade", { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error?.message ?? "Failed to start upgrade. Please try again.");
        return;
      }
      if (body.url) window.location.href = body.url;
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setUpgradeLoading(false);
    }
  }

  async function handleCancel() {
    setError(null);
    setCancelLoading(true);
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error?.message ?? "Failed to cancel. Please try again.");
        return;
      }
      // Reload to reflect the new cancellation state from server
      window.location.reload();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setCancelLoading(false);
    }
  }

  if (plan === "free") {
    return (
      <Link
        href="/pricing"
        className="block w-full rounded-[var(--radius-pill)] bg-[var(--color-accent-primary)] px-8 py-[14px] text-center text-[15px] font-semibold text-[var(--color-bg-0)] transition-[background-color,box-shadow] duration-[180ms] hover:bg-[var(--color-accent-hover)] hover:shadow-[0_6px_20px_hsla(40,85%,58%,0.35)]"
      >
        View Plans — from $9/mo
      </Link>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p className="text-[12px] text-[var(--color-error,#f87171)]">{error}</p>
      )}

      {plan === "pro" && (
        <button
          onClick={handleUpgrade}
          disabled={upgradeLoading}
          className="w-full cursor-pointer rounded-[var(--radius-pill)] bg-[var(--color-accent-primary)] px-8 py-[14px] text-[15px] font-semibold text-[var(--color-bg-0)] transition-[background-color,box-shadow] duration-[180ms] hover:bg-[var(--color-accent-hover)] hover:shadow-[0_6px_20px_hsla(40,85%,58%,0.35)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {upgradeLoading ? "Redirecting…" : "Upgrade to Max — $19/mo"}
        </button>
      )}

      {plan === "max" && (
        <div className="flex w-full items-center justify-center rounded-[var(--radius-pill)] border border-[var(--color-accent-primary)]/30 bg-[var(--color-accent-muted)] px-8 py-[14px] text-[14px] font-medium text-[var(--color-accent-primary)]">
          All features unlocked
        </div>
      )}

      {cancelAt ? (
        <p className="text-center text-[12px] text-[var(--color-text-tertiary)]">
          Cancels on{" "}
          <span className="font-medium text-[var(--color-text-secondary)]">
            {new Date(cancelAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </p>
      ) : (
        <button
          onClick={handleCancel}
          disabled={cancelLoading}
          className="w-full cursor-pointer rounded-[var(--radius-pill)] border border-[var(--color-border-subtle)] bg-transparent px-8 py-[14px] text-[15px] font-medium text-[var(--color-text-secondary)] transition-[border-color,color] duration-[180ms] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {cancelLoading ? "Canceling…" : "Cancel Subscription"}
        </button>
      )}
    </div>
  );
}
