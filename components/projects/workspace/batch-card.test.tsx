// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BatchCard, type BatchGroup } from "./batch-card";

vi.mock("motion/react", () => ({
  motion: {
    div: ({ children, className, initial: _i, animate: _a, exit: _e,
            transition: _t, custom: _c, variants: _v, ...rest }: any) => (
      <div className={className} {...rest}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const batch: BatchGroup = {
  sourceLabel: "User Interview",
  files: [
    {
      id: "f1", project_id: "p1", file_name: "a.pdf", source_type: "User Interview",
      content: "", storage_url: null, mime_type: "application/pdf",
      input_method: "upload", word_count: 500, created_at: new Date().toISOString(),
    },
    {
      id: "f2", project_id: "p1", file_name: "b.pdf", source_type: "User Interview",
      content: "", storage_url: null, mime_type: "application/pdf",
      input_method: "upload", word_count: 300, created_at: new Date().toISOString(),
    },
  ],
  wordCount: 800,
  badge: "PDF",
};

describe("BatchCard", () => {
  it("renders source label", () => {
    render(<BatchCard batch={batch} onDelete={vi.fn()} isDeleting={false} />);
    expect(screen.getByText("User Interview")).toBeInTheDocument();
  });

  it("renders file count", () => {
    render(<BatchCard batch={batch} onDelete={vi.fn()} isDeleting={false} />);
    expect(screen.getByText(/2 files/i)).toBeInTheDocument();
  });

  it("renders word count", () => {
    render(<BatchCard batch={batch} onDelete={vi.fn()} isDeleting={false} />);
    expect(screen.getByText(/800 words/i)).toBeInTheDocument();
  });

  it("calls onDelete when delete button clicked", () => {
    const onDelete = vi.fn();
    render(<BatchCard batch={batch} onDelete={onDelete} isDeleting={false} />);
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("disables delete button while deleting", () => {
    render(<BatchCard batch={batch} onDelete={vi.fn()} isDeleting={true} />);
    expect(screen.getByRole("button", { name: /delete/i })).toBeDisabled();
  });
});
