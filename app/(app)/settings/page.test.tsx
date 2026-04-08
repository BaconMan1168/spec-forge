// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { SubscriptionActions } from "@/components/billing/subscription-actions";

describe("SubscriptionActions (Free view)", () => {
  it("shows view plans CTA for free user", () => {
    render(<SubscriptionActions plan="free" cancelAt={null} />);
    expect(screen.getByText(/view plans/i)).toBeInTheDocument();
  });
});

describe("SubscriptionActions (Pro view)", () => {
  it("shows upgrade to max and cancel buttons", () => {
    render(<SubscriptionActions plan="pro" cancelAt={null} />);
    expect(screen.getByText(/upgrade to max/i)).toBeInTheDocument();
    expect(screen.getByText(/cancel subscription/i)).toBeInTheDocument();
  });

  it("shows cancels-on message when pending cancellation", () => {
    render(<SubscriptionActions plan="pro" cancelAt="2026-05-01T00:00:00Z" />);
    expect(screen.getByText(/cancels on/i)).toBeInTheDocument();
    expect(screen.queryByText(/cancel subscription/i)).not.toBeInTheDocument();
  });
});

describe("SubscriptionActions (Max view)", () => {
  it("shows all features unlocked and cancel button", () => {
    render(<SubscriptionActions plan="max" cancelAt={null} />);
    expect(screen.getByText(/all features unlocked/i)).toBeInTheDocument();
    expect(screen.getByText(/cancel subscription/i)).toBeInTheDocument();
  });

  it("shows cancels-on message when pending cancellation", () => {
    render(<SubscriptionActions plan="max" cancelAt="2026-05-01T00:00:00Z" />);
    expect(screen.getByText(/cancels on/i)).toBeInTheDocument();
    expect(screen.queryByText(/cancel subscription/i)).not.toBeInTheDocument();
  });
});
