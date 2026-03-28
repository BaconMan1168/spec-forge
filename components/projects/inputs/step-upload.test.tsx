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
    div: ({
      children,
      className,
      initial: _i,
      animate: _a,
      exit: _e,
      transition: _t,
      ...rest
    }: React.HTMLAttributes<HTMLDivElement> & {
      initial?: unknown;
      animate?: unknown;
      exit?: unknown;
      transition?: unknown;
    }) => <div className={className} {...rest}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const makeFile = (name: string) =>
  new File(["content"], name, { type: "application/pdf" });

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

  it("shows contracted file row with latest filename when 1 file selected", () => {
    const props = { ...baseProps, files: [makeFile("report.pdf")] };
    render(<StepUpload {...props} />);
    expect(screen.getByText("report.pdf")).toBeInTheDocument();
  });

  it("shows 'and N more' badge when multiple files selected", () => {
    const props = {
      ...baseProps,
      files: [makeFile("a.pdf"), makeFile("b.pdf"), makeFile("c.pdf")],
    };
    render(<StepUpload {...props} />);
    expect(screen.getByText(/and 2 more/i)).toBeInTheDocument();
  });

  it("expands to show all filenames when toggle is clicked", () => {
    const props = {
      ...baseProps,
      files: [makeFile("a.pdf"), makeFile("b.pdf")],
    };
    render(<StepUpload {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /show files|expand/i }));
    expect(screen.getAllByText("a.pdf").length).toBeGreaterThan(0);
    expect(screen.getAllByText("b.pdf").length).toBeGreaterThan(0);
  });

  it("calls onFilesChange without the removed file when × is clicked", () => {
    const onFilesChange = vi.fn();
    const files = [makeFile("a.pdf"), makeFile("b.pdf")];
    const props = { ...baseProps, files, onFilesChange };
    render(<StepUpload {...props} />);
    // Expand first
    fireEvent.click(screen.getByRole("button", { name: /show files|expand/i }));
    // Click remove on first file
    fireEvent.click(screen.getAllByRole("button", { name: /remove/i })[0]);
    expect(onFilesChange).toHaveBeenCalledWith([files[1]]);
  });
});
