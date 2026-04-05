// components/marketing/hero-section.test.tsx
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
    motion: { div: make("div"), span: make("span") },
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

import { HeroSection } from "./hero-section";

describe("HeroSection", () => {
  it("renders the main headline text", () => {
    render(<HeroSection />);
    expect(screen.getByText("From Raw Feedback")).toBeInTheDocument();
    expect(screen.getByText("to Actionable Specs")).toBeInTheDocument();
  });

  it("renders Start for Free button linking to /login", () => {
    render(<HeroSection />);
    const link = screen.getByRole("link", { name: /start for free/i });
    expect(link).toHaveAttribute("href", "/login");
  });

  it("renders See How It Works anchor", () => {
    render(<HeroSection />);
    const link = screen.getByRole("link", { name: /see how it works/i });
    expect(link).toHaveAttribute("href", "#how-it-works");
  });
});
