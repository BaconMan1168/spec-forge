// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AddInputForm } from "./add-input-form";

vi.mock("motion/react", () => ({
  motion: {
    div: ({
      children,
      className,
      initial: _i,
      animate: _a,
      exit: _e,
      transition: _t,
      custom: _c,
      variants: _v,
      ...rest
    }: any) => (
      <div className={className} {...rest}>
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
    }: any) => (
      <button className={className} {...rest}>
        {children}
      </button>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/app/actions/feedback-files", () => ({
  uploadFeedbackFiles: vi
    .fn()
    .mockResolvedValue({ succeeded: [{ id: "f1" }], failed: [] }),
  pasteFeedbackText: vi.fn().mockResolvedValue({ id: "f2" }),
}));

describe("AddInputForm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders step 1 on load with both type tiles", () => {
    render(<AddInputForm projectId="p1" />);
    expect(screen.getByText("Upload files")).toBeInTheDocument();
    expect(screen.getByText("Paste text")).toBeInTheDocument();
  });

  it("advances to step 2 after selecting upload and clicking Next", async () => {
    render(<AddInputForm projectId="p1" />);
    fireEvent.click(screen.getByText("Upload files").closest("button")!);
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    await waitFor(() =>
      expect(screen.getByText(/drag & drop/i)).toBeInTheDocument()
    );
  });

  it("shows paste textarea when Paste text type selected", async () => {
    render(<AddInputForm projectId="p1" />);
    fireEvent.click(screen.getByText("Paste text").closest("button")!);
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    await waitFor(() =>
      expect(
        screen.getByRole("textbox", { name: /paste/i })
      ).toBeInTheDocument()
    );
  });

  it("goes back to step 1 when Back is clicked", async () => {
    render(<AddInputForm projectId="p1" />);
    fireEvent.click(screen.getByText("Upload files").closest("button")!);
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    await waitFor(() => screen.getByText(/drag & drop/i));
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    await waitFor(() =>
      expect(screen.getByText("Upload files")).toBeInTheDocument()
    );
  });
});
