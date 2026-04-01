// components/marketing/capabilities-section.test.tsx
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

import { CapabilitiesSection } from "./capabilities-section";

describe("CapabilitiesSection", () => {
  it("renders the section heading", () => {
    render(<CapabilitiesSection />);
    expect(screen.getByText(/everything you need/i)).toBeInTheDocument();
  });

  it("renders all three capability titles", () => {
    const { container } = render(<CapabilitiesSection />);
    expect(container.textContent).toMatch(/multi-source/i);
    expect(container.textContent).toMatch(/ai-powered/i);
    expect(container.textContent).toMatch(/exportable/i);
  });

  it("renders file type tags", () => {
    render(<CapabilitiesSection />);
    expect(screen.getByText(".pdf")).toBeInTheDocument();
    expect(screen.getByText(".docx")).toBeInTheDocument();
    expect(screen.getByText(".json")).toBeInTheDocument();
    expect(screen.getByText(".md")).toBeInTheDocument();
  });
});
