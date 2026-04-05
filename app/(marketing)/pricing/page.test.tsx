// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("motion/react", async () => {
  const { createElement } = await import("react");
  const stripMotionProps = (props: Record<string, unknown>) => {
    const motionKeys = new Set([
      "initial", "animate", "exit", "transition",
      "whileInView", "viewport", "whileHover", "whileTap", "layoutId",
    ]);
    return Object.fromEntries(
      Object.entries(props).filter(([k]) => !motionKeys.has(k))
    );
  };
  const make = (el: string) =>
    ({ children, ...rest }: Record<string, unknown>) =>
      createElement(el as string, stripMotionProps(rest) as Record<string, unknown>, children as React.ReactNode);
  return {
    motion: { div: make("div") },
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

import PricingPage from "./page";

describe("PricingPage", () => {
  it("renders the Free tier label", () => {
    render(<PricingPage />);
    expect(screen.getByText("Free")).toBeInTheDocument();
  });

  it("renders the $0 price", () => {
    render(<PricingPage />);
    expect(screen.getByText("$0")).toBeInTheDocument();
  });

  it("renders the Try for Free link pointing to /login", () => {
    render(<PricingPage />);
    const link = screen.getByRole("link", { name: /try for free/i });
    expect(link).toHaveAttribute("href", "/login");
  });

  it("renders the Pro tier label", () => {
    render(<PricingPage />);
    expect(screen.getByText("Pro")).toBeInTheDocument();
  });

  it("renders the $9 price for Pro", () => {
    render(<PricingPage />);
    expect(screen.getByText("$9")).toBeInTheDocument();
  });

  it("renders the Max tier label", () => {
    render(<PricingPage />);
    expect(screen.getByText("Max")).toBeInTheDocument();
  });

  it("renders the $19 price for Max", () => {
    render(<PricingPage />);
    expect(screen.getByText("$19")).toBeInTheDocument();
  });

  it("renders an enabled Upgrade to Pro button", () => {
    render(<PricingPage />);
    const button = screen.getByRole("button", { name: /upgrade to pro/i });
    expect(button).not.toBeDisabled();
  });

  it("renders an enabled Upgrade to Max button", () => {
    render(<PricingPage />);
    const button = screen.getByRole("button", { name: /upgrade to max/i });
    expect(button).not.toBeDisabled();
  });
});
