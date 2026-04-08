import { createClient } from "@/lib/supabase/server";
import { PublicNavbar } from "@/components/nav/public-navbar";
import { ShapesBackground } from "@/components/marketing/shapes-background";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="relative min-h-screen bg-[var(--color-bg-0)]">
      <ShapesBackground />
      <PublicNavbar userEmail={user?.email ?? null} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
