// components/marketing/shapes-background.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
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
    motion: { div: make("div") },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});

import { ShapesBackground } from "./shapes-background";

describe("ShapesBackground", () => {
  it("renders the fixed background wrapper", () => {
    const { container } = render(<ShapesBackground />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toBeTruthy();
    expect(wrapper.tagName).toBe("DIV");
  });
});
