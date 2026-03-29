// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "dark", systemTheme: "dark" }),
}));
import { render, screen } from "@testing-library/react";
import { ThemesSection } from "./themes-section";
import type { Insight } from "@/lib/types/database";

const makeInsight = (id: string, themeName: string): Insight => ({
  id,
  project_id: "p1",
  theme_name: themeName,
  frequency: "3 of 5 sources",
  quotes: [
    { quote: "Test quote", sourceLabel: "Interview" },
    { quote: "Another quote", sourceLabel: "Survey" },
  ],
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
});
