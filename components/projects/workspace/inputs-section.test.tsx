// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { InputsSection } from "./inputs-section";
import type { FeedbackFile } from "@/lib/types/database";

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

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/app/actions/feedback-files", () => ({
  deleteFeedbackBatch: vi.fn().mockResolvedValue(undefined),
}));

beforeEach(() => vi.clearAllMocks());

const makeFile = (id: string, label: string): FeedbackFile => ({
  id,
  project_id: "p1",
  file_name: "a.pdf",
  source_type: label,
  content: "x",
  storage_url: null,
  mime_type: "application/pdf",
  input_method: "upload",
  word_count: 100,
  created_at: new Date().toISOString(),
});

describe("InputsSection", () => {
  it("renders each batch group label", () => {
    const files = [makeFile("f1", "Interview"), makeFile("f2", "Survey")];
    render(<InputsSection files={files} projectId="p1" />);
    expect(screen.getByText("Interview")).toBeInTheDocument();
    expect(screen.getByText("Survey")).toBeInTheDocument();
  });

  it("renders Add more inputs link pointing to /projects/p1/add", () => {
    render(<InputsSection files={[makeFile("f1", "Interview")]} projectId="p1" />);
    expect(
      screen.getByRole("link", { name: /add more inputs/i })
    ).toHaveAttribute("href", "/projects/p1/add");
  });

  it("renders empty message when no files", () => {
    render(<InputsSection files={[]} projectId="p1" />);
    expect(screen.getByText(/no inputs yet/i)).toBeInTheDocument();
  });

  it("shows 'Not included in analysis' group when some files are newer than lastAnalyzedAt", () => {
    const oldFile = { ...makeFile("f1", "Interview"), created_at: "2026-01-01T00:00:00Z" };
    const newFile = { ...makeFile("f2", "Survey"), created_at: "2026-03-01T00:00:00Z" };
    render(
      <InputsSection
        files={[oldFile, newFile]}
        projectId="p1"
        lastAnalyzedAt="2026-02-01T00:00:00Z"
      />
    );
    expect(screen.getByText(/not included/i)).toBeInTheDocument();
  });

  it("does not show staleness group when lastAnalyzedAt is null", () => {
    render(
      <InputsSection
        files={[makeFile("f1", "Interview")]}
        projectId="p1"
        lastAnalyzedAt={null}
      />
    );
    expect(screen.queryByText(/not included/i)).not.toBeInTheDocument();
  });
});
