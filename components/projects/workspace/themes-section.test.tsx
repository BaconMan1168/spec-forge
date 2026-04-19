// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "dark", systemTheme: "dark" }),
}));
import { render, screen } from "@testing-library/react";
import { ThemesSection } from "./themes-section";
import type { Insight } from "@/lib/types/database";

const makeInsight = (
  id: string,
  themeName: string,
  signal_strength: Insight["signal_strength"] = null,
  has_conflict = false,
): Insight => ({
  id,
  project_id: "p1",
  theme_name: themeName,
  frequency: "3 of 5 sources",
  quotes: [
    { quote: "Test quote", sourceLabel: "Interview" },
    { quote: "Another quote", sourceLabel: "Survey" },
  ],
  signal_strength,
  has_conflict,
  created_at: "2026-01-01T00:00:00Z",
});

describe("ThemesSection", () => {
  it("renders all theme names", () => {
    const insights = [
      makeInsight("i1", "Onboarding confusion"),
      makeInsight("i2", "CSV export missing"),
    ];
    render(<ThemesSection insights={insights} isStale={false} />);
    expect(screen.getByText("Onboarding confusion")).toBeInTheDocument();
    expect(screen.getByText("CSV export missing")).toBeInTheDocument();
  });

  it("renders frequency badge for each theme", () => {
    render(<ThemesSection insights={[makeInsight("i1", "Theme A")]} isStale={false} />);
    expect(screen.getByText("3 of 5 sources")).toBeInTheDocument();
  });

  it("shows top 2 quotes inline per card", () => {
    render(<ThemesSection insights={[makeInsight("i1", "Theme A")]} isStale={false} />);
    expect(screen.getByText(/Test quote/i)).toBeInTheDocument();
    expect(screen.getByText(/Another quote/i)).toBeInTheDocument();
  });

  it("shows stale notice when isStale is true", () => {
    render(<ThemesSection insights={[makeInsight("i1", "T")]} isStale />);
    expect(screen.getByText(/new inputs/i)).toBeInTheDocument();
  });

  it("shows 'View all N quotes' button", () => {
    render(<ThemesSection insights={[makeInsight("i1", "T")]} isStale={false} />);
    expect(screen.getByText(/view all 2 quotes/i)).toBeInTheDocument();
  });

  it("shows 'Low signal' badge when signal_strength is low", () => {
    render(<ThemesSection insights={[makeInsight("i1", "App reminders", "low")]} isStale={false} />);
    expect(screen.getByText("Low signal")).toBeInTheDocument();
  });

  it("does not show 'Low signal' badge when signal_strength is high", () => {
    render(<ThemesSection insights={[makeInsight("i1", "Onboarding confusion", "high")]} isStale={false} />);
    expect(screen.queryByText("Low signal")).not.toBeInTheDocument();
  });

  it("does not show 'Low signal' badge when signal_strength is null", () => {
    render(<ThemesSection insights={[makeInsight("i1", "Old theme", null)]} isStale={false} />);
    expect(screen.queryByText("Low signal")).not.toBeInTheDocument();
  });

  it("shows 'Conflicting signals' badge when has_conflict is true", () => {
    render(<ThemesSection insights={[makeInsight("i1", "UX speed", "medium", true)]} isStale={false} />);
    expect(screen.getByText("Conflicting signals")).toBeInTheDocument();
  });

  it("does not show 'Low signal' badge when has_conflict is true (conflict takes precedence)", () => {
    render(<ThemesSection insights={[makeInsight("i1", "UX speed", "low", true)]} isStale={false} />);
    expect(screen.getByText("Conflicting signals")).toBeInTheDocument();
    expect(screen.queryByText("Low signal")).not.toBeInTheDocument();
  });

  it("does not show 'Conflicting signals' badge when has_conflict is false", () => {
    render(<ThemesSection insights={[makeInsight("i1", "Normal theme", "high", false)]} isStale={false} />);
    expect(screen.queryByText("Conflicting signals")).not.toBeInTheDocument();
  });
});
