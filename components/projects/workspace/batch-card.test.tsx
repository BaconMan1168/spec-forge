// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BatchCard, type BatchGroup } from "./batch-card";

vi.mock("motion/react", () => ({
  motion: {
    div: ({
      children,
      className,
      initial: _i,
      animate: _a,
      exit: _e,
      transition: _t,
      custom: _c,
      variants: _v,
      ...rest
    }: React.HTMLAttributes<HTMLDivElement> & {
      initial?: unknown;
      animate?: unknown;
      exit?: unknown;
      transition?: unknown;
      custom?: unknown;
      variants?: unknown;
    }) => <div className={className} {...rest}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
    ...rest
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} className={className} {...rest}>{children}</a>
  ),
}));

Object.assign(navigator, {
  clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
});

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

const pasteBatch: BatchGroup = {
  sourceLabel: "Interview Notes",
  files: [
    {
      id: "p1", project_id: "proj1", file_name: "Pasted text",
      source_type: "Interview Notes",
      content: "This is the paste content",
      storage_url: null, mime_type: null,
      input_method: "paste", word_count: 5,
      created_at: new Date().toISOString(),
    },
  ],
  wordCount: 5,
  badge: "Paste",
};

describe("BatchCard", () => {
  it("renders source label", () => {
    render(<BatchCard batch={batch} onDelete={vi.fn()} isDeleting={false} projectId="p1" />);
    expect(screen.getByText("User Interview")).toBeInTheDocument();
  });

  it("renders file count", () => {
    render(<BatchCard batch={batch} onDelete={vi.fn()} isDeleting={false} projectId="p1" />);
    expect(screen.getByText(/2 files/i)).toBeInTheDocument();
  });

  it("renders word count", () => {
    render(<BatchCard batch={batch} onDelete={vi.fn()} isDeleting={false} projectId="p1" />);
    expect(screen.getByText(/800 words/i)).toBeInTheDocument();
  });

  it("calls onDelete when delete button clicked", () => {
    const onDelete = vi.fn();
    render(<BatchCard batch={batch} onDelete={onDelete} isDeleting={false} projectId="p1" />);
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("disables delete button while deleting", () => {
    render(<BatchCard batch={batch} onDelete={vi.fn()} isDeleting={true} projectId="p1" />);
    expect(screen.getByRole("button", { name: /delete/i })).toBeDisabled();
  });

  it("trash button has cursor-pointer class", () => {
    render(<BatchCard batch={batch} onDelete={vi.fn()} isDeleting={false} projectId="p1" />);
    const deleteBtn = screen.getByRole("button", { name: /delete/i });
    expect(deleteBtn.className).toContain("cursor-pointer");
  });

  it("paste batch card renders as a link to the detail page", () => {
    render(
      <BatchCard
        batch={pasteBatch}
        onDelete={vi.fn()}
        isDeleting={false}
        projectId="proj1"
      />
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute(
      "href",
      `/projects/proj1/inputs/${encodeURIComponent("Interview Notes")}`
    );
  });

  it("clipboard icon copies batch content when clicked", () => {
    render(
      <BatchCard
        batch={pasteBatch}
        onDelete={vi.fn()}
        isDeleting={false}
        projectId="proj1"
      />
    );
    const copyBtn = screen.getByRole("button", { name: /copy/i });
    fireEvent.click(copyBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "This is the paste content"
    );
  });

  it("non-paste batch does not render a link wrapper", () => {
    render(
      <BatchCard batch={batch} onDelete={vi.fn()} isDeleting={false} projectId="p1" />
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
