// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageTransition } from "./page-transition";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

vi.mock("motion/react", () => ({
  motion: {
    div: ({
      children,
      className,
      initial: _i,
      animate: _a,
      transition: _t,
      ...rest
    }: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>) => (
      <div className={className as string} {...(rest as React.HTMLAttributes<HTMLDivElement>)}>
        {children}
      </div>
    ),
  },
}));

describe("PageTransition", () => {
  it("renders children", () => {
    render(
      <PageTransition>
        <p>Hello</p>
      </PageTransition>
    );
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("renders a wrapper div", () => {
    const { container } = render(
      <PageTransition>
        <span>content</span>
      </PageTransition>
    );
    expect(container.firstChild).not.toBeNull();
  });
});
