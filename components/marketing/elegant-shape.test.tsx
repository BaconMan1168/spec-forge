// components/marketing/elegant-shape.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import React from "react";

// Mock framer-motion so animations don't run in jsdom
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

import { ElegantShape } from "./elegant-shape";

describe("ElegantShape", () => {
  it("renders a container div", () => {
    const { container } = render(
      <ElegantShape width={600} height={140} rotate={12} gradient="from-analog-2/15" />
    );
    expect(container.firstChild).toBeTruthy();
  });

  it("renders with default props without crashing", () => {
    const { container } = render(<ElegantShape />);
    expect(container.firstChild).toBeTruthy();
  });
});
