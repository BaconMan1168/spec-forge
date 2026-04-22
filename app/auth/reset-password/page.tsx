// app/auth/reset-password/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    let valid = true;
    if (!password) { setPasswordError("Password is required"); valid = false; }
    else if (password.length < 6) { setPasswordError("Password must be at least 6 characters"); valid = false; }
    if (!confirmPassword) { setConfirmPasswordError("Please confirm your password"); valid = false; }
    if (!valid) return;

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      const msg = error.message;
      setError(
        (error as { status?: number }).status === 429
          ? "Too many requests. Please wait a moment before trying again."
          : msg.charAt(0).toUpperCase() + msg.slice(1)
      );
      return;
    }

    setDone(true);
  }

  return (
    <main className="relative min-h-screen bg-[var(--color-bg-0)] flex items-center justify-center px-6 overflow-hidden">
      {/* Grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(hsl(220,14%,14%) 1px, transparent 1px), linear-gradient(90deg, hsl(220,14%,14%) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      {/* Orb — top left blue */}
      <div
        className="absolute -top-24 -left-20 w-96 h-96 rounded-full"
        style={{
          background: "radial-gradient(circle, hsla(220,55%,55%,0.15) 0%, transparent 65%)",
          filter: "blur(4px)",
        }}
      />
      {/* Orb — bottom right amber */}
      <div
        className="absolute -bottom-24 -right-20 w-80 h-80 rounded-full"
        style={{
          background: "radial-gradient(circle, hsla(40,85%,58%,0.09) 0%, transparent 65%)",
          filter: "blur(4px)",
        }}
      />
      {/* Center vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 50% at 50% 50%, hsl(220,18%,8%) 10%, transparent 65%)",
        }}
      />
      {/* Top/bottom edge fade */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, hsl(220,18%,8%) 0%, transparent 15%, transparent 85%, hsl(220,18%,8%) 100%)",
        }}
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative w-full max-w-sm rounded-[var(--radius-lg)] bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] shadow-[var(--shadow-2)] p-8"
      >
        <div className="mb-6 text-center">
          <h1 className="text-[25px] font-semibold text-[var(--color-text-primary)]">
            Xern AI
          </h1>
        </div>

        {done ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col items-center gap-4 py-4 text-center"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent-muted)]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 text-[var(--color-accent-primary)]"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-[var(--color-text-primary)] font-medium">Password updated</p>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Your password has been changed successfully.
            </p>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="mt-2 text-sm text-[var(--color-text-secondary)] underline underline-offset-2 hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
            >
              Back to sign in
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
            className="flex flex-col gap-1"
          >
            <p className="mb-6 text-center text-sm text-[var(--color-text-secondary)]">
              Choose a new password
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
              <div>
                <Input
                  label="New password"
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setPasswordError(null); }}
                  placeholder="••••••••"
                />
                {passwordError && (
                  <p role="alert" className="mt-1 text-sm text-[var(--color-error)]">
                    {passwordError}
                  </p>
                )}
              </div>

              <div>
                <Input
                  label="Confirm new password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setConfirmPasswordError(null); }}
                  placeholder="••••••••"
                />
                {confirmPasswordError && (
                  <p role="alert" className="mt-1 text-sm text-[var(--color-error)]">
                    {confirmPasswordError}
                  </p>
                )}
              </div>

              {error && (
                <p role="alert" className="text-sm text-[var(--color-error)]">
                  {error}
                </p>
              )}

              <Button type="submit" disabled={loading}>
                {loading ? "Updating…" : "Set new password"}
              </Button>

              <button
                type="button"
                onClick={() => router.push("/login")}
                className="text-center text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors cursor-pointer"
              >
                Back to sign in
              </button>
            </form>
          </motion.div>
        )}
      </motion.div>
    </main>
  );
}
