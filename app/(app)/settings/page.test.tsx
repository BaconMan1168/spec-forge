// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { PlanCard } from "./page";

describe("PlanCard (Free view)", () => {
  it("shows upgrade CTA for free user", () => {
    render(
      <PlanCard
        plan="free"
        projectsThisMonth={1}
        stripeCustomerId={null}
      />
    );
    expect(screen.getByText(/view plans/i)).toBeInTheDocument();
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
    expect(screen.getByText(/Free/)).toBeInTheDocument();
  });
});

describe("PlanCard (Pro view)", () => {
  it("shows manage subscription for pro user", () => {
    render(
      <PlanCard
        plan="pro"
        projectsThisMonth={7}
        stripeCustomerId="cus_123"
      />
    );
    expect(screen.getByText(/manage subscription/i)).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("7 / 20")).toBeInTheDocument();
  });
});

describe("PlanCard (Max view)", () => {
  it("shows manage subscription for max user", () => {
    render(
      <PlanCard
        plan="max"
        projectsThisMonth={42}
        stripeCustomerId="cus_456"
      />
    );
    expect(screen.getByText(/manage subscription/i)).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });
});
