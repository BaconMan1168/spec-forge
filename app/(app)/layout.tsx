// app/(app)/layout.tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { Particles } from "@/components/ui/particles";
import { PageTransition } from "@/components/ui/page-transition";
import { Navbar } from "@/components/nav/navbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

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
        <Navbar userEmail={user.email ?? ""} />
        <main className="mx-auto max-w-[1200px] px-6 py-8">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
}
