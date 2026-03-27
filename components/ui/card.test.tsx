// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Card } from "./card";

describe("Card", () => {
  it("renders children", () => {
    const { getByText } = render(<Card>hello</Card>);
    expect(getByText("hello")).toBeInTheDocument();
  });

  it("applies backdrop-filter for glass surface effect", () => {
    const { container } = render(<Card>content</Card>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("backdrop-blur");
  });

  it("accepts and merges additional className", () => {
    const { container } = render(<Card className="extra-class">x</Card>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("extra-class");
  });
});
