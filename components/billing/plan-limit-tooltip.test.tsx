// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlanLimitTooltip } from "./plan-limit-tooltip";

describe("PlanLimitTooltip", () => {
  it("renders children normally when allowed", () => {
    render(
      <PlanLimitTooltip allowed reason="">
        <button>Click me</button>
      </PlanLimitTooltip>
    );
    const btn = screen.getByRole("button", { name: "Click me" });
    expect(btn).not.toBeDisabled();
  });

  it("renders children as disabled when not allowed", () => {
    render(
      <PlanLimitTooltip allowed={false} reason="Monthly limit reached">
        <button>Click me</button>
      </PlanLimitTooltip>
    );
    const btn = screen.getByRole("button", { name: "Click me" });
    expect(btn).toBeDisabled();
  });

  it("shows reason text in tooltip wrapper when not allowed", () => {
    render(
      <PlanLimitTooltip allowed={false} reason="Monthly limit reached">
        <button>Click me</button>
      </PlanLimitTooltip>
    );
    expect(screen.getByText("Monthly limit reached")).toBeInTheDocument();
  });

  it("does not render tooltip content when allowed", () => {
    render(
      <PlanLimitTooltip allowed reason="should not appear">
        <button>Click me</button>
      </PlanLimitTooltip>
    );
    expect(screen.queryByText("should not appear")).not.toBeInTheDocument();
  });
});
