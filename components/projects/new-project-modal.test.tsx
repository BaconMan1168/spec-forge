// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NewProjectModal } from "./new-project-modal";

vi.mock("@/app/actions/projects", () => ({
  createProject: vi.fn(),
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
});
