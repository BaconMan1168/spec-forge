// app/login/page.tsx
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[var(--color-bg-0)] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
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
