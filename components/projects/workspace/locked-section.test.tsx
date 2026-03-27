// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LockedSection } from "./locked-section";

describe("LockedSection", () => {
  it("renders title", () => {
    render(<LockedSection title="Themes" description="Run Analyze to unlock." />);
    expect(screen.getByText("Themes")).toBeInTheDocument();
  });

  it("renders description", () => {
    render(<LockedSection title="Themes" description="Run Analyze to unlock." />);
    expect(screen.getByText("Run Analyze to unlock.")).toBeInTheDocument();
  });
});
