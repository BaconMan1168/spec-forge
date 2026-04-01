// components/marketing/pricing-section.test.tsx
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
    motion: { div: make("div"), p: make("p"), h2: make("h2") },
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

import { PricingSection } from "./pricing-section";

describe("PricingSection", () => {
  it("renders the pricing heading", () => {
    render(<PricingSection />);
    expect(screen.getByText(/simple, transparent pricing/i)).toBeInTheDocument();
  });

  it("renders the $0 price", () => {
    render(<PricingSection />);
    expect(screen.getByText("$0")).toBeInTheDocument();
  });

  it("renders Get Early Access button linking to /login", () => {
    render(<PricingSection />);
    const link = screen.getByRole("link", { name: /get early access/i });
    expect(link).toHaveAttribute("href", "/login");
  });

  it("renders the pricing details link to /pricing", () => {
    render(<PricingSection />);
    const link = screen.getByRole("link", { name: /full pricing details/i });
    expect(link).toHaveAttribute("href", "/pricing");
  });
});
