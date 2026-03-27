// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { AuroraBackground } from "./aurora-background";

describe("AuroraBackground", () => {
  it("renders without crashing", () => {
    const { container } = render(<AuroraBackground />);
    expect(container.firstChild).not.toBeNull();
  });

  it("renders exactly 5 aurora bands", () => {
    const { container } = render(<AuroraBackground />);
    const bands = container.querySelectorAll("[data-aurora-band]");
    expect(bands).toHaveLength(5);
  });

  it("has pointer-events-none so it does not block interaction", () => {
    const { container } = render(<AuroraBackground />);
    // The fixed wrapper is the second child (after the style tag); find the div with pointer-events-none
    const wrapper = container.querySelector(".pointer-events-none");
    expect(wrapper).not.toBeNull();
  });
});
