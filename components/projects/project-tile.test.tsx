// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProjectTile } from "./project-tile";

// MagicCard uses next-themes — mock it
vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "dark", resolvedTheme: "dark" }),
}));

// blur-fade and magic-card use motion/react — mock all used exports
vi.mock("motion/react", () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useMotionValue: () => ({ set: vi.fn(), get: () => 0 }),
  useMotionTemplate: () => "",
  useInView: () => true,
  useSpring: () => ({ set: vi.fn(), get: () => 0 }),
}));

const baseProps = {
  id: "abc-123",
  name: "Q2 Discovery Sprint",
  createdAt: "2026-03-24T00:00:00.000Z",
  index: 0,
};

describe("ProjectTile", () => {
  it("renders the project name", () => {
    render(<ProjectTile {...baseProps} />);
    expect(screen.getByText("Q2 Discovery Sprint")).toBeInTheDocument();
  });

  it("renders the formatted created date", () => {
    render(<ProjectTile {...baseProps} />);
    expect(screen.getByText(/2026|Mar/i)).toBeInTheDocument();
  });

  it("renders as a link to the project page", () => {
    render(<ProjectTile {...baseProps} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/projects/abc-123");
  });

  it("renders a color-coded icon block", () => {
    const { container } = render(<ProjectTile {...baseProps} />);
    const icon = container.querySelector("[data-tile-icon]");
    expect(icon).not.toBeNull();
  });

  it("has fluid hover transition (320ms duration)", () => {
    const { container } = render(<ProjectTile {...baseProps} />);
    const card = container.querySelector("[class*='duration-']");
    expect(card?.className).toMatch(/duration-\[320ms\]/);
  });
});
