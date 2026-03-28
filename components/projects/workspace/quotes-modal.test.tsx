// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuotesModal } from "./quotes-modal";
import type { InsightQuote } from "@/lib/types/database";

const quotes: InsightQuote[] = [
  { quote: "I was totally lost", sourceLabel: "Interview" },
  { quote: "No guide at all", sourceLabel: "Support Ticket" },
];

describe("QuotesModal", () => {
  it("renders all quotes when open", () => {
    render(
      <QuotesModal
        themeName="Onboarding confusion"
        quotes={quotes}
        isOpen
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText(/I was totally lost/i)).toBeInTheDocument();
    expect(screen.getByText(/No guide at all/i)).toBeInTheDocument();
  });

  it("renders nothing when not open", () => {
    render(
      <QuotesModal
        themeName="Onboarding confusion"
        quotes={quotes}
        isOpen={false}
        onClose={vi.fn()}
      />
    );
    expect(screen.queryByText(/I was totally lost/i)).not.toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(
      <QuotesModal themeName="T" quotes={quotes} isOpen onClose={onClose} />
    );
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
