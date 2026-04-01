import { HeroSection } from "@/components/marketing/hero-section";
import { CapabilitiesSection } from "@/components/marketing/capabilities-section";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { PricingSection } from "@/components/marketing/pricing-section";
import { CtaSection } from "@/components/marketing/cta-section";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <div className="relative z-10 mx-auto max-w-[1100px] h-px bg-gradient-to-r from-transparent via-[var(--color-border-subtle)] to-transparent" />
      <CapabilitiesSection />
      <div className="relative z-10 mx-auto max-w-[1100px] h-px bg-gradient-to-r from-transparent via-[var(--color-border-subtle)] to-transparent" />
      <HowItWorksSection />
      <div className="relative z-10 mx-auto max-w-[1100px] h-px bg-gradient-to-r from-transparent via-[var(--color-border-subtle)] to-transparent" />
      <PricingSection />
      <CtaSection />
    </>
  );
}
