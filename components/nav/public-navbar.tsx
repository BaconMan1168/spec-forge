"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { SpecForgeLogo } from "@/components/nav/spec-forge-logo";

const NAV_LINKS = [
  { name: "Home", href: "/" },
  { name: "Pricing", href: "/pricing" },
];

export function PublicNavbar() {
  const pathname = usePathname();

  return (
    <div className="pointer-events-none fixed left-0 right-0 top-0 z-[200] flex justify-center pt-6">
      <motion.nav
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-auto inline-flex items-center gap-0.5 rounded-[var(--radius-pill)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-1)]/88 px-1.5 py-1.5 shadow-[var(--shadow-2)] backdrop-blur-[20px]"
      >
        {/* Brand */}
        <Link
          href="/"
          className="mr-1 flex items-center gap-2 rounded-[var(--radius-pill)] px-3 py-1.5 text-[15px] font-semibold text-[var(--color-text-primary)]"
        >
          <SpecForgeLogo />
          SpecForge
        </Link>

        <div
          aria-hidden="true"
          className="mx-1 h-[18px] w-px flex-shrink-0 bg-[var(--color-border-subtle)]"
        />

        {/* Nav links */}
        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative rounded-[var(--radius-pill)] px-5 py-2 text-sm font-medium transition-colors duration-[180ms]",
                isActive
                  ? "bg-[var(--color-surface-0)] text-[var(--color-accent-primary)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-0)] hover:text-[var(--color-text-primary)]"
              )}
            >
              {/* Tube light */}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute left-1/2 top-[-3px] h-1 w-8 -translate-x-1/2 rounded-b-sm bg-[var(--color-accent-primary)]"
                  style={{
                    boxShadow:
                      "0 0 12px 4px hsla(40,85%,58%,0.5), 0 12px 28px 2px hsla(40,85%,58%,0.15)",
                  }}
                />
              )}
              {link.name}
            </Link>
          );
        })}

        <div
          aria-hidden="true"
          className="mx-1 h-[18px] w-px flex-shrink-0 bg-[var(--color-border-subtle)]"
        />

        {/* Sign In */}
        <Link
          href="/login"
          className="rounded-[var(--radius-pill)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors duration-[180ms] hover:bg-[var(--color-surface-0)] hover:text-[var(--color-text-primary)]"
        >
          Sign In
        </Link>

        {/* Get Started — arrow expands on hover, no empty space at rest */}
        <Link
          href="/login"
          className="group ml-1 inline-flex cursor-pointer items-center overflow-hidden rounded-[var(--radius-pill)] bg-[var(--color-accent-primary)] px-5 py-2 text-sm font-semibold text-[var(--color-bg-0)] transition-[background-color,box-shadow] duration-[180ms] hover:bg-[var(--color-accent-hover)] hover:shadow-[0_4px_16px_hsla(40,85%,58%,0.35)]"
        >
          Get Started
          <span className="ml-0 inline-block max-w-0 overflow-hidden opacity-0 transition-[max-width,opacity,margin-left] duration-[300ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover:ml-1.5 group-hover:max-w-[1.5em] group-hover:opacity-100">
            →
          </span>
        </Link>
      </motion.nav>
    </div>
  );
}
