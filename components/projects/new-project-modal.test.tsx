// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NewProjectModal } from "./new-project-modal";

vi.mock("@/app/actions/projects", () => ({
  createProject: vi.fn(),
}));

// createPortal renders into document.body in jsdom; mock it to render inline
// so screen queries and event propagation work without extra setup.
vi.mock("react-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-dom")>();
  return { ...actual, createPortal: (node: React.ReactNode) => node };
});

// AnimatePresence must immediately render/remove children in tests (no exit animations)
vi.mock("motion/react", () => ({
  motion: {
    div: ({
      children,
      className,
      initial: _i,
      animate: _a,
      exit: _e,
      transition: _t,
      ...rest
    }: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>) => (
      <div className={className as string} {...(rest as React.HTMLAttributes<HTMLDivElement>)}>
        {children}
      </div>
    ),
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
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

describe("NewProjectModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the New Project button", () => {
    render(<NewProjectModal />);
    expect(
      screen.getByRole("button", { name: /new project/i })
    ).toBeInTheDocument();
  });

  it("does not show modal by default", () => {
    render(<NewProjectModal />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens modal when button is clicked", () => {
    render(<NewProjectModal />);
    fireEvent.click(screen.getByRole("button", { name: /new project/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows project name input in modal", () => {
    render(<NewProjectModal />);
    fireEvent.click(screen.getByRole("button", { name: /new project/i }));
    expect(screen.getByLabelText(/project name/i)).toBeInTheDocument();
  });

  it("closes modal when cancel is clicked", () => {
    render(<NewProjectModal />);
    fireEvent.click(screen.getByRole("button", { name: /new project/i }));
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes modal when backdrop (dialog wrapper) is clicked", () => {
    render(<NewProjectModal />);
    fireEvent.click(screen.getByRole("button", { name: /new project/i }));
    // Click the outer dialog wrapper (the backdrop itself)
    fireEvent.click(screen.getByRole("dialog"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
