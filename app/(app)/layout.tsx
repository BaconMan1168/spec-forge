// app/(app)/layout.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { Particles } from "@/components/ui/particles";
import { PageTransition } from "@/components/ui/page-transition";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="relative min-h-screen bg-[var(--color-bg-0)]">
      {/* AuroraBackground renders its own fixed inset-0 wrapper internally */}
      <AuroraBackground />

      {/* Particles layer — separate fixed wrapper */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden="true"
      >
        <Particles
          className="absolute inset-0"
          quantity={20}
          staticity={30}
          color="#7b9fd4"
          size={0.4}
        />
      </div>

      {/* App shell */}
      <div className="relative z-10">
        <header className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-1)]/80 backdrop-blur-[20px]">
          <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4">
            <span className="font-semibold text-[var(--color-text-primary)]">
              SpecForge
            </span>
            <SignOutButton />
          </div>
        </header>
        <main className="mx-auto max-w-[1200px] px-6 py-8">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
