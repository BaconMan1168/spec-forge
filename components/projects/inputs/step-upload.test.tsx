// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StepUpload } from "./step-upload";

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
  files: [],
  onFilesChange: vi.fn(),
  sourceLabel: "",
  onSourceLabelChange: vi.fn(),
  sourceLabelError: null,
  onBack: vi.fn(),
  onSubmit: vi.fn(),
  isSubmitting: false,
};

describe("StepUpload", () => {
  it("renders dropzone", () => {
    render(<StepUpload {...baseProps} />);
    expect(screen.getByText(/drag & drop/i)).toBeInTheDocument();
  });

  it("shows accepted formats hint", () => {
    render(<StepUpload {...baseProps} />);
    expect(screen.getByText(/pdf.*docx.*txt.*md.*json/i)).toBeInTheDocument();
  });

  it("renders source label input", () => {
    render(<StepUpload {...baseProps} />);
    expect(
      screen.getByPlaceholderText(/interview|ticket|survey/i)
    ).toBeInTheDocument();
  });

  it("shows source label error when provided", () => {
    render(<StepUpload {...baseProps} sourceLabelError="Required" />);
    expect(screen.getByText("Required")).toBeInTheDocument();
  });

  it("calls onBack when Back is clicked", () => {
    render(<StepUpload {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(baseProps.onBack).toHaveBeenCalledTimes(1);
  });

  it("Submit button is disabled when no files selected", () => {
    render(<StepUpload {...baseProps} files={[]} />);
    expect(screen.getByRole("button", { name: /submit/i })).toBeDisabled();
  });
});
