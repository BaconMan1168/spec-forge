// components/marketing/how-it-works-section.test.tsx
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
    motion: { div: make("div"), p: make("p"), h2: make("h2"), h3: make("h3") },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});

import { HowItWorksSection } from "./how-it-works-section";

describe("HowItWorksSection", () => {
  it("renders the section heading", () => {
    render(<HowItWorksSection />);
    expect(screen.getByText(/three steps/i)).toBeInTheDocument();
  });

  it("renders step numbers 1, 2, 3", () => {
    render(<HowItWorksSection />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders all step titles", () => {
    render(<HowItWorksSection />);
    expect(screen.getByText("Upload Feedback")).toBeInTheDocument();
    expect(screen.getByText("Run Analysis")).toBeInTheDocument();
    expect(screen.getByText("Export & Build")).toBeInTheDocument();
  });

  it("has an id for the scroll anchor", () => {
    const { container } = render(<HowItWorksSection />);
    expect(container.querySelector("#how-it-works")).toBeTruthy();
  });
});
