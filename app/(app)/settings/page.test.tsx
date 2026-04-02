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
    expect(screen.getByText(/upgrade to pro/i)).toBeInTheDocument();
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
    expect(screen.getByText("7")).toBeInTheDocument();
  });
});
