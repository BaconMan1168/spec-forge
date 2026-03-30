// components/nav/nav-breadcrumb.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { NavBreadcrumb } from "./nav-breadcrumb";

const mockUsePathname = vi.fn();
const mockUseParams = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
  useParams: () => mockUseParams(),
}));

const mockSingle = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: mockSingle,
        }),
      }),
    }),
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("NavBreadcrumb", () => {
  it("renders nothing on the dashboard page", () => {
    mockUsePathname.mockReturnValue("/dashboard");
    mockUseParams.mockReturnValue({});
    const { container } = render(<NavBreadcrumb />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when path has no project id", () => {
    mockUsePathname.mockReturnValue("/dashboard");
    mockUseParams.mockReturnValue({ id: undefined });
    const { container } = render(<NavBreadcrumb />);
    expect(container.firstChild).toBeNull();
  });

  it("renders Dashboard link and skeleton while project name is loading", () => {
    mockUsePathname.mockReturnValue("/projects/abc-123");
    mockUseParams.mockReturnValue({ id: "abc-123" });
    mockSingle.mockReturnValue(new Promise(() => {})); // never resolves
    render(<NavBreadcrumb />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("project-name-skeleton")).toBeInTheDocument();
  });

  it("renders project name after fetch resolves", async () => {
    mockUsePathname.mockReturnValue("/projects/abc-123");
    mockUseParams.mockReturnValue({ id: "abc-123" });
    mockSingle.mockResolvedValue({ data: { name: "Q4 Research" }, error: null });
    render(<NavBreadcrumb />);
    await waitFor(() => {
      expect(screen.getByText("Q4 Research")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("project-name-skeleton")).not.toBeInTheDocument();
  });

  it("renders the divider before the breadcrumb", () => {
    mockUsePathname.mockReturnValue("/projects/abc-123");
    mockUseParams.mockReturnValue({ id: "abc-123" });
    mockSingle.mockReturnValue(new Promise(() => {}));
    render(<NavBreadcrumb />);
    expect(screen.getByTestId("nav-divider")).toBeInTheDocument();
  });

  it("works on sub-routes like /projects/[id]/add", async () => {
    mockUsePathname.mockReturnValue("/projects/abc-123/add");
    mockUseParams.mockReturnValue({ id: "abc-123" });
    mockSingle.mockResolvedValue({ data: { name: "My Project" }, error: null });
    render(<NavBreadcrumb />);
    await waitFor(() => {
      expect(screen.getByText("My Project")).toBeInTheDocument();
    });
  });
});
