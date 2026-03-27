// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "./button";

// Replace motion.button with a plain <button> — no animation side-effects in tests
vi.mock("motion/react", () => ({
  motion: {
    button: ({
      children,
      className,
      whileHover: _wh,
      whileTap: _wt,
      transition: _tr,
      ...rest
    }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
      whileHover?: unknown;
      whileTap?: unknown;
      transition?: unknown;
    }) => (
      <button className={className} {...rest}>
        {children}
      </button>
    ),
  },
}));

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(
      screen.getByRole("button", { name: /click me/i })
    ).toBeInTheDocument();
  });

  it("has cursor-pointer class", () => {
    const { container } = render(<Button>Click</Button>);
    expect((container.firstChild as HTMLElement).className).toContain(
      "cursor-pointer"
    );
  });

  it("primary (default) variant references accent-primary token", () => {
    const { container } = render(<Button>Primary</Button>);
    expect((container.firstChild as HTMLElement).className).toContain(
      "accent-primary"
    );
  });

  it("secondary variant references surface-1 token", () => {
    const { container } = render(<Button variant="secondary">Secondary</Button>);
    expect((container.firstChild as HTMLElement).className).toContain(
      "surface-1"
    );
  });

  it("renders with pill radius token", () => {
    const { container } = render(<Button>Pill</Button>);
    expect((container.firstChild as HTMLElement).className).toContain(
      "radius-pill"
    );
  });

  it("is disabled when disabled prop is passed", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    screen.getByRole("button").click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick when disabled", () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Go
      </Button>
    );
    screen.getByRole("button").click();
    expect(onClick).not.toHaveBeenCalled();
  });

  it("forwards type attribute", () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });
});
