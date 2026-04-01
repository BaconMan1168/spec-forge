// components/marketing/cta-section.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("motion/react", async () => {
  const { createElement } = await import("react");
  const stripMotionProps = (props: Record<string, unknown>) => {
    const motionKeys = new Set([
      "initial","animate","exit","transition","whileInView",
      "viewport","whileHover","whileTap","layoutId",
    ]);
    return Object.fromEntries(
      Object.entries(props).filter(([k]) => !motionKeys.has(k))
    );
  };
  const make = (el: string) =>
    ({ children, ...rest }: Record<string, unknown>) =>
      createElement(el as string, stripMotionProps(rest) as Record<string, unknown>, children as React.ReactNode);
  return {
    motion: { div: make("div"), h2: make("h2"), p: make("p") },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => <a href={href} className={className}>{children}</a>,
}));

import { CtaSection } from "./cta-section";

describe("CtaSection", () => {
  it("renders the CTA heading", () => {
    render(<CtaSection />);
    expect(screen.getByText(/ready to ship faster/i)).toBeInTheDocument();
  });

  it("renders Start for Free linking to /login", () => {
    render(<CtaSection />);
    const link = screen.getByRole("link", { name: /start for free/i });
    expect(link).toHaveAttribute("href", "/login");
  });

  it("renders Sign In linking to /login", () => {
    render(<CtaSection />);
    const link = screen.getByRole("link", { name: /sign in/i });
    expect(link).toHaveAttribute("href", "/login");
  });

  it("renders footer with SpecForge brand", () => {
    render(<CtaSection />);
    // Footer is rendered inside CtaSection
    expect(screen.getByText("SpecForge")).toBeInTheDocument();
  });
});
