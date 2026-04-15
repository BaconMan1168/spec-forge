"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { SpecForgeLogo } from "@/components/nav/spec-forge-logo";
import { AvatarDropdown } from "@/components/nav/avatar-dropdown";

const NAV_LINKS = [
  { name: "Home", href: "/" },
  { name: "Pricing", href: "/pricing" },
];

const SLIDE_TRANSITION = { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const };
const TUBE_TRANSITION = { duration: 0.38, ease: [0.22, 1, 0.36, 1] as const };

interface PublicNavbarProps {
  userEmail?: string | null;
}

export function PublicNavbar({ userEmail }: PublicNavbarProps) {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [tubeStyle, setTubeStyle] = useState<{ left: number; width: number } | null>(null);
  const [pillStyle, setPillStyle] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  useEffect(() => {
    const el = linkRefs.current[pathname];
    if (el) {
      setTubeStyle({ left: el.offsetLeft + el.offsetWidth / 2, width: el.offsetWidth * 0.6 });
    }
  }, [pathname]);

  // The bg pill lives on the active nav link at rest; slides to wherever is hovered
  const activeNavItem = NAV_LINKS.find((l) => l.href === pathname)?.href ?? null;
  const bgTarget = hoveredItem ?? activeNavItem;

  // Update pill position using DOM measurements — same pattern as tube-light to avoid
  // layoutId scroll-jump: Framer Motion's layout projection can incorrectly include
  // window.scrollY when measuring positions inside a position:fixed element.
  useEffect(() => {
    const navLink = NAV_LINKS.find((l) => l.href === bgTarget);
    if (!navLink) {
      setPillStyle(null);
      return;
    }
    const el = linkRefs.current[navLink.href];
    if (el) {
      setPillStyle({
        left: el.offsetLeft,
        top: el.offsetTop,
        width: el.offsetWidth,
        height: el.offsetHeight,
      });
    }
  }, [bgTarget]);

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
          className="flex items-center gap-4 rounded-[var(--radius-pill)] px-3 py-1.5 text-[15px] font-semibold text-[var(--color-text-primary)]"
        >
          <SpecForgeLogo />
          Xern
        </Link>

        <div
          aria-hidden="true"
          className="mx-1 h-[18px] w-px flex-shrink-0 bg-[var(--color-border-subtle)]"
        />

        {/* Nav links */}
        <div className="relative flex items-center">
          {/* Single always-mounted tube-light — position driven by measured DOM ref */}
          {tubeStyle && (
            <motion.span
              aria-hidden="true"
              className="pointer-events-none absolute top-[-3px] h-1 rounded-b-sm bg-[var(--color-accent-primary)]"
              animate={{ left: tubeStyle.left - tubeStyle.width / 2, width: tubeStyle.width }}
              transition={TUBE_TRANSITION}
              style={{
                boxShadow: "0 0 12px 4px hsla(40,85%,58%,0.5), 0 12px 28px 2px hsla(40,85%,58%,0.15)",
              }}
            />
          )}
          {/* Single always-mounted background pill — position driven by measured DOM ref,
              avoids layoutId scroll-jump bug in fixed containers */}
          {pillStyle && (
            <motion.span
              aria-hidden="true"
              className="pointer-events-none absolute rounded-[var(--radius-pill)] bg-[var(--color-surface-0)]"
              animate={{
                left: pillStyle.left,
                top: pillStyle.top,
                width: pillStyle.width,
                height: pillStyle.height,
              }}
              transition={SLIDE_TRANSITION}
            />
          )}
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                ref={(el) => { linkRefs.current[link.href] = el; }}
                onMouseEnter={() => setHoveredItem(link.href)}
                onMouseLeave={() => setHoveredItem(null)}
                className={cn(
                  "relative rounded-[var(--radius-pill)] px-5 py-2 text-sm font-medium transition-colors duration-[180ms]",
                  isActive
                    ? "text-[var(--color-accent-primary)]"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                )}
              >
                <span className="relative z-10">{link.name}</span>
              </Link>
            );
          })}
        </div>

        <div
          aria-hidden="true"
          className="mx-1 h-[18px] w-px flex-shrink-0 bg-[var(--color-border-subtle)]"
        />

        {userEmail ? (
          /* Authenticated — show avatar dropdown */
          <div className="ml-1 flex items-center gap-2">
            <Link
              href="/dashboard"
              className="rounded-[var(--radius-pill)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors duration-[180ms] hover:text-[var(--color-text-primary)]"
            >
              Dashboard
            </Link>
            <AvatarDropdown email={userEmail} />
          </div>
        ) : (
          /* Unauthenticated — show Sign In + Get Started */
          <>
            <Link
              href="/login"
              onMouseEnter={() => setHoveredItem("sign-in")}
              onMouseLeave={() => setHoveredItem(null)}
              className="relative rounded-[var(--radius-pill)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors duration-[180ms] hover:text-[var(--color-text-primary)]"
            >
              {/* Simple fade — no layoutId to avoid cross-section scroll-jump */}
              <AnimatePresence>
                {hoveredItem === "sign-in" && (
                  <motion.span
                    key="sign-in-bg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="absolute inset-0 rounded-[var(--radius-pill)] bg-[var(--color-surface-0)]"
                  />
                )}
              </AnimatePresence>
              <span className="relative z-10">Sign In</span>
            </Link>

            <Link
              href="/login"
              className="group ml-1 inline-flex cursor-pointer items-center overflow-hidden rounded-[var(--radius-pill)] bg-[var(--color-accent-primary)] px-5 py-2 text-sm font-semibold text-[var(--color-bg-0)] transition-[background-color,box-shadow] duration-[180ms] hover:bg-[var(--color-accent-hover)] hover:shadow-[0_4px_16px_hsla(40,85%,58%,0.35)]"
            >
              Get Started
              <span className="ml-0 inline-block max-w-0 overflow-hidden opacity-0 transition-[max-width,opacity,margin-left] duration-[300ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover:ml-1.5 group-hover:max-w-[1.5em] group-hover:opacity-100">
                →
              </span>
            </Link>
          </>
        )}
      </motion.nav>
    </div>
  );
}
