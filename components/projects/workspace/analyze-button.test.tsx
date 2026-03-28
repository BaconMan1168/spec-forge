// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AnalyzeButton } from "./analyze-button";

const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ refresh: mockRefresh })),
}));

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ signal: "ok" }) });
});

describe("AnalyzeButton", () => {
  it("renders 'Analyze' when not stale and has inputs", () => {
    render(<AnalyzeButton projectId="p1" hasInputs isStale={false} />);
    expect(screen.getByRole("button", { name: /analyze/i })).toBeInTheDocument();
  });

  it("renders 'Re-analyze' when stale", () => {
    render(<AnalyzeButton projectId="p1" hasInputs isStale />);
    expect(screen.getByRole("button", { name: /re-analyze/i })).toBeInTheDocument();
  });

  it("is disabled when hasInputs is false", () => {
    render(<AnalyzeButton projectId="p1" hasInputs={false} isStale={false} />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("calls /api/projects/[id]/analyze on click and refreshes on success", async () => {
    render(<AnalyzeButton projectId="p1" hasInputs isStale={false} />);
    fireEvent.click(screen.getByRole("button", { name: /analyze/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/projects/p1/analyze",
        expect.objectContaining({ method: "POST" })
      );
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("shows error message when fetch fails", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: { message: "Rate limited" } }) });
    render(<AnalyzeButton projectId="p1" hasInputs isStale={false} />);
    fireEvent.click(screen.getByRole("button", { name: /analyze/i }));

    await waitFor(() => {
      expect(screen.getByText(/rate limited/i)).toBeInTheDocument();
    });
  });

  it("shows 'Analyzing…' during the fetch", async () => {
    let resolvePromise!: (v: unknown) => void;
    global.fetch = vi.fn().mockReturnValue(new Promise((r) => (resolvePromise = r)));

    render(<AnalyzeButton projectId="p1" hasInputs isStale={false} />);
    fireEvent.click(screen.getByRole("button", { name: /analyze/i }));

    expect(await screen.findByText(/analyzing/i)).toBeInTheDocument();
    resolvePromise({ ok: true, json: async () => ({ signal: "ok" }) });
  });
});
