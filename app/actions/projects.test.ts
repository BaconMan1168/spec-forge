// app/actions/projects.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/lib/billing/limits", () => ({
  canCreateProject: vi.fn().mockResolvedValue({ allowed: true, reason: "" }),
}));

import { createProject } from "./projects";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

describe("createProject", () => {
  const mockSingle = vi.fn();
  const mockSelect = vi.fn(() => ({ single: mockSingle }));
  const mockInsert = vi.fn(() => ({ select: mockSelect }));
  const mockFrom = vi.fn(() => ({ insert: mockInsert }));
  const mockGetUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockSingle.mockResolvedValue({ data: { id: "proj-1" }, error: null });
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      from: mockFrom,
      auth: { getUser: mockGetUser },
    });
  });

  it("inserts a project with name and user_id then redirects to workspace", async () => {
    const formData = new FormData();
    formData.set("name", "Test Project");

    await createProject(formData);

    expect(mockFrom).toHaveBeenCalledWith("projects");
    expect(mockInsert).toHaveBeenCalledWith({
      name: "Test Project",
      user_id: "user-1",
    });
    expect(redirect).toHaveBeenCalledWith("/projects/proj-1");
  });

  it("redirects to /login when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const formData = new FormData();
    formData.set("name", "Test Project");

    await createProject(formData);

    expect(redirect).toHaveBeenCalledWith("/login");
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("throws when insert returns an error", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: "DB error" } });

    const formData = new FormData();
    formData.set("name", "Test Project");

    await expect(createProject(formData)).rejects.toThrow("DB error");
  });
});
