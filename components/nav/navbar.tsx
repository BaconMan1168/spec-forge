import Link from "next/link";
import { SpecForgeLogo } from "./spec-forge-logo";
import { NavBreadcrumb } from "./nav-breadcrumb";
import { AvatarDropdown } from "./avatar-dropdown";

interface NavbarProps {
  userEmail: string;
}

export function Navbar({ userEmail }: NavbarProps) {
  return (
    // NOTE: no overflow-hidden on <header> — the avatar dropdown is position:absolute
    // and must visually escape the header. overflow-hidden is applied only to the
    // left side where breadcrumb truncation is needed.
    <header className="sticky top-0 z-40 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-1)]/85 backdrop-blur-[20px]">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between gap-4 px-6">
        {/* Left: brand + conditional breadcrumb — overflow-hidden here for truncation */}
        <div className="flex min-w-0 flex-1 items-center gap-4 overflow-hidden">
          <Link
            href="/dashboard"
            className="flex flex-shrink-0 items-center gap-2"
          >
            <SpecForgeLogo />
            <span className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--color-text-primary)]">
              SpecForge
            </span>
          </Link>
          <NavBreadcrumb />
        </div>

        {/* Right: avatar dropdown */}
        <AvatarDropdown email={userEmail} />
      </div>
    </header>
  );
}