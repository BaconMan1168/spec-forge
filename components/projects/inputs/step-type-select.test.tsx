// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StepTypeSelect } from "./step-type-select";

describe("StepTypeSelect", () => {
  it("renders both method tiles", () => {
    render(<StepTypeSelect value={null} onChange={vi.fn()} onNext={vi.fn()} />);
    expect(screen.getByText("Upload files")).toBeInTheDocument();
    expect(screen.getByText("Paste text")).toBeInTheDocument();
  });

  it("Next button is disabled when no method selected", () => {
    render(<StepTypeSelect value={null} onChange={vi.fn()} onNext={vi.fn()} />);
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
  });

  it("calls onChange with 'upload' when Upload tile is clicked", () => {
    const onChange = vi.fn();
    render(<StepTypeSelect value={null} onChange={onChange} onNext={vi.fn()} />);
    fireEvent.click(screen.getByText("Upload files").closest("button")!);
    expect(onChange).toHaveBeenCalledWith("upload");
  });

  it("calls onChange with 'paste' when Paste tile is clicked", () => {
    const onChange = vi.fn();
    render(<StepTypeSelect value={null} onChange={onChange} onNext={vi.fn()} />);
    fireEvent.click(screen.getByText("Paste text").closest("button")!);
    expect(onChange).toHaveBeenCalledWith("paste");
  });

  it("calls onNext when Next is clicked with a selection", () => {
    const onNext = vi.fn();
    render(<StepTypeSelect value="upload" onChange={vi.fn()} onNext={onNext} />);
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it("method card buttons have cursor-pointer class", () => {
    render(
      <StepTypeSelect value={null} onChange={vi.fn()} onNext={vi.fn()} />
    );
    const buttons = screen.getAllByRole("button").filter(
      (b) => b.textContent?.includes("Upload files") || b.textContent?.includes("Paste text")
    );
    expect(buttons.length).toBe(2);
    buttons.forEach((btn) => {
      expect(btn.className).toContain("cursor-pointer");
    });
  });
});
