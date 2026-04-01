// components/nav/public-navbar.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn().mockReturnValue("/"),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

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
    motion: { div: make("div"), nav: make("nav") },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Mock SpecForgeLogo since it has no deps
vi.mock("@/components/nav/spec-forge-logo", () => ({
  SpecForgeLogo: () => <div data-testid="spec-forge-logo" />,
}));

import { PublicNavbar } from "./public-navbar";

describe("PublicNavbar", () => {
  it("renders the SpecForge logo", () => {
    render(<PublicNavbar />);
    expect(screen.getByTestId("spec-forge-logo")).toBeInTheDocument();
  });

  it("renders Home and Pricing nav links", () => {
    render(<PublicNavbar />);
    expect(screen.getByRole("link", { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /pricing/i })).toBeInTheDocument();
  });

  it("links Pricing to /pricing", () => {
    render(<PublicNavbar />);
    const pricingLink = screen.getByRole("link", { name: /pricing/i });
    expect(pricingLink).toHaveAttribute("href", "/pricing");
  });

  it("links Sign In to /login", () => {
    render(<PublicNavbar />);
    const signInLink = screen.getByRole("link", { name: /sign in/i });
    expect(signInLink).toHaveAttribute("href", "/login");
  });

  it("links Get Started to /login", () => {
    render(<PublicNavbar />);
    const getStarted = screen.getByRole("link", { name: /get started/i });
    expect(getStarted).toHaveAttribute("href", "/login");
  });
});
