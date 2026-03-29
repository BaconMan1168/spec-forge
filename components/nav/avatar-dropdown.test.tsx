// components/nav/avatar-dropdown.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AvatarDropdown } from "./avatar-dropdown";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockSignOut = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signOut: mockSignOut },
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockSignOut.mockResolvedValue({});
});

describe("AvatarDropdown", () => {
  it("renders initials from the first two chars of the email username", () => {
    render(<AvatarDropdown email="daniel@example.com" />);
    expect(screen.getByRole("button", { name: /open user menu/i })).toHaveTextContent("DA");
  });

  it("renders single initial when username is one char", () => {
    render(<AvatarDropdown email="a@example.com" />);
    expect(screen.getByRole("button", { name: /open user menu/i })).toHaveTextContent("A");
  });

  it("dropdown is hidden by default", () => {
    render(<AvatarDropdown email="daniel@example.com" />);
    expect(screen.queryByText("daniel@example.com")).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: /sign out/i })).not.toBeInTheDocument();
  });

  it("clicking the avatar opens the dropdown", () => {
    render(<AvatarDropdown email="daniel@example.com" />);
    fireEvent.click(screen.getByRole("button", { name: /open user menu/i }));
    expect(screen.getByText("daniel@example.com")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /sign out/i })).toBeInTheDocument();
  });

  it("clicking the avatar again closes the dropdown", () => {
    render(<AvatarDropdown email="daniel@example.com" />);
    const avatarBtn = screen.getByRole("button", { name: /open user menu/i });
    fireEvent.click(avatarBtn);
    fireEvent.click(avatarBtn);
    expect(screen.queryByText("daniel@example.com")).not.toBeInTheDocument();
  });

  it("sign out calls supabase signOut and redirects to /login", async () => {
    render(<AvatarDropdown email="daniel@example.com" />);
    fireEvent.click(screen.getByRole("button", { name: /open user menu/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /sign out/i }));
    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/login");
    });
  });
});
