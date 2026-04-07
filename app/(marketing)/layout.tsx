import { PublicNavbar } from "@/components/nav/public-navbar";
import { ShapesBackground } from "@/components/marketing/shapes-background";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-[var(--color-bg-0)]">
      <ShapesBackground />
      <PublicNavbar />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
