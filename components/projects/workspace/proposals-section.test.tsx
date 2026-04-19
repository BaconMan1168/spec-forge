// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "dark", systemTheme: "dark" }),
}));
vi.mock("@/app/actions/exports", () => ({
  exportProposal: vi.fn().mockResolvedValue("# markdown"),
}));
import { render, screen, fireEvent } from "@testing-library/react";
import { ProposalsSection } from "./proposals-section";
import type { Proposal } from "@/lib/types/database";

const defaultExportLimits = { allowed: true, reason: "" };
const makeExportLimits = (...ids: string[]) =>
  Object.fromEntries(ids.map((id) => [id, defaultExportLimits]));

const makeProposal = (id: string, featureName: string, overrides: Partial<Proposal> = {}): Proposal => ({
  id,
  project_id: "p1",
  feature_name: featureName,
  problem_statement: "Users struggle with this.",
  evidence: [{ quote: "It's hard", sourceLabel: "Interview" }],
  ui_changes: ["Add button"],
  data_model_changes: [],
  workflow_changes: ["Update flow"],
  engineering_tasks: ["Build it"],
  is_conflict_proposal: false,
  created_at: "2026-01-01T00:00:00Z",
  ...overrides,
});

describe("ProposalsSection", () => {
  it("renders all proposal feature names", () => {
    render(
      <ProposalsSection
        proposals={[makeProposal("p1", "Guided Onboarding"), makeProposal("p2", "CSV Export")]}
        isStale={false}
        projectId="proj-1"
        exportLimits={makeExportLimits("p1", "p2")}
      />
    );
    expect(screen.getByText("Guided Onboarding")).toBeInTheDocument();
    expect(screen.getByText("CSV Export")).toBeInTheDocument();
  });

  it("proposal body is hidden by default", () => {
    render(
      <ProposalsSection
        proposals={[makeProposal("p1", "Feature A")]}
        isStale={false}
        projectId="proj-1"
        exportLimits={makeExportLimits("p1")}
      />
    );
    expect(screen.queryByText(/problem statement/i)).not.toBeInTheDocument();
  });

  it("expands proposal body on header click", () => {
    render(
      <ProposalsSection
        proposals={[makeProposal("p1", "Feature A")]}
        isStale={false}
        projectId="proj-1"
        exportLimits={makeExportLimits("p1")}
      />
    );
    fireEvent.click(screen.getByText("Feature A"));
    expect(screen.getByText(/problem statement/i)).toBeInTheDocument();
    expect(screen.getByText(/users struggle with this/i)).toBeInTheDocument();
  });

  it("omits data model changes section when empty", () => {
    render(
      <ProposalsSection
        proposals={[makeProposal("p1", "Feature A", { data_model_changes: [] })]}
        isStale={false}
        projectId="proj-1"
        exportLimits={makeExportLimits("p1")}
      />
    );
    fireEvent.click(screen.getByText("Feature A"));
    expect(screen.queryByText(/data model/i)).not.toBeInTheDocument();
  });

  it("renders data model changes section when present", () => {
    render(
      <ProposalsSection
        proposals={[makeProposal("p1", "Feature A", { data_model_changes: ["Add column"] })]}
        isStale={false}
        projectId="proj-1"
        exportLimits={makeExportLimits("p1")}
      />
    );
    fireEvent.click(screen.getByText("Feature A"));
    expect(screen.getByText(/data model/i)).toBeInTheDocument();
    expect(screen.getByText("Add column")).toBeInTheDocument();
  });

  it("shows stale notice when isStale is true", () => {
    render(
      <ProposalsSection
        proposals={[makeProposal("p1", "F")]}
        isStale
        projectId="proj-1"
        exportLimits={makeExportLimits("p1")}
      />
    );
    expect(screen.getByText(/re-analyze/i)).toBeInTheDocument();
  });

  it("renders numbered proposal index", () => {
    render(
      <ProposalsSection
        proposals={[makeProposal("p1", "Feature A"), makeProposal("p2", "Feature B")]}
        isStale={false}
        projectId="proj-1"
        exportLimits={makeExportLimits("p1", "p2")}
      />
    );
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("shows conflict disclaimer when is_conflict_proposal is true and card is expanded", () => {
    render(
      <ProposalsSection
        proposals={[makeProposal("p1", "UX Speed", { is_conflict_proposal: true })]}
        isStale={false}
        projectId="proj-1"
        exportLimits={makeExportLimits("p1")}
      />
    );
    fireEvent.click(screen.getByText("UX Speed"));
    expect(screen.getByText(/opposing views/i)).toBeInTheDocument();
  });

  it("does not show conflict disclaimer for a normal proposal", () => {
    render(
      <ProposalsSection
        proposals={[makeProposal("p1", "Feature A", { is_conflict_proposal: false })]}
        isStale={false}
        projectId="proj-1"
        exportLimits={makeExportLimits("p1")}
      />
    );
    fireEvent.click(screen.getByText("Feature A"));
    expect(screen.queryByText(/opposing views/i)).not.toBeInTheDocument();
  });
});
