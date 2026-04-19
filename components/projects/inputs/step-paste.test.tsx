// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StepPaste } from "./step-paste";

vi.mock("motion/react", () => ({
  motion: {
    button: ({
      children,
      className,
      whileHover: _wh,
      whileTap: _wt,
      transition: _tr,
      ...rest
    }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
      whileHover?: unknown;
      whileTap?: unknown;
      transition?: unknown;
    }) => <button className={className} {...rest}>{children}</button>,
  },
}));

const baseProps = {
  content: "",
  onContentChange: vi.fn(),
  sourceLabel: "",
  onSourceLabelChange: vi.fn(),
  sourceLabelError: null,
  onBack: vi.fn(),
  onSubmit: vi.fn(),
  isSubmitting: false,
};

describe("StepPaste", () => {
  it("renders textarea", () => {
    render(<StepPaste {...baseProps} />);
    expect(
      screen.getByRole("textbox", { name: /paste/i })
    ).toBeInTheDocument();
  });

  it("Submit is disabled when content is empty", () => {
    render(<StepPaste {...baseProps} content="" />);
    expect(screen.getByRole("button", { name: /submit/i })).toBeDisabled();
  });

  it("calls onBack when Back is clicked", () => {
    render(<StepPaste {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(baseProps.onBack).toHaveBeenCalledTimes(1);
  });

  it("shows word count counter", () => {
    render(<StepPaste {...baseProps} content="hello world" />);
    expect(screen.getByText(/2 \/ 5,000 words/i)).toBeInTheDocument();
  });

  it("disables submit when content exceeds word limit", () => {
    const overLimit = Array(5001).fill("word").join(" ");
    render(<StepPaste {...baseProps} content={overLimit} />);
    expect(screen.getByRole("button", { name: /submit/i })).toBeDisabled();
    expect(screen.getByText(/limit exceeded/i)).toBeInTheDocument();
  });

  it("submit is enabled when content is within word limit", () => {
    const withinLimit = Array(100).fill("word").join(" ");
    render(<StepPaste {...baseProps} content={withinLimit} />);
    expect(screen.getByRole("button", { name: /submit/i })).not.toBeDisabled();
  });
});
