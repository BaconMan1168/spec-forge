// app/login/page.tsx
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
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
          background:
            "radial-gradient(circle, hsla(220,55%,55%,0.15) 0%, transparent 65%)",
          filter: "blur(4px)",
        }}
      />
      {/* Orb — bottom right amber */}
      <div
        className="absolute -bottom-24 -right-20 w-80 h-80 rounded-full"
        style={{
          background:
            "radial-gradient(circle, hsla(40,85%,58%,0.09) 0%, transparent 65%)",
          filter: "blur(4px)",
        }}
      />
      {/* Center vignette — keeps card area clean */}
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
      <div className="relative w-full max-w-sm rounded-[var(--radius-lg)] bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] shadow-[var(--shadow-2)] p-8">
        <div className="mb-8 text-center">
          <h1 className="text-[25px] font-semibold text-[var(--color-text-primary)]">
            SpecForge
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Sign in to your account
          </p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
