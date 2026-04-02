// components/nav/avatar-dropdown.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface AvatarDropdownProps {
  email: string;
}

function getInitials(email: string): string {
  const username = email.split("@")[0];
  return username.slice(0, 2).toUpperCase();
}

export function AvatarDropdown({ email }: AvatarDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const initials = getInitials(email);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open user menu"
        aria-expanded={open}
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[var(--color-border-subtle)] text-[12px] font-semibold text-white transition-[border-color,transform] duration-[120ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:scale-105 hover:border-[var(--color-border-strong)]"
        style={{
          background:
            "linear-gradient(135deg, hsl(220, 55%, 40%), hsl(240, 55%, 50%))",
        }}
      >
        {initials}
      </button>

      {open && (
        <div
          className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-[180px] rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] p-1.5 shadow-[var(--shadow-2)]"
          role="menu"
        >
          <p className="border-b border-[var(--color-border-subtle)] px-2.5 pb-2 pt-2 text-[12px] text-[var(--color-text-tertiary)]">
            {email}
          </p>
          <Link
            href="/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="mt-1 flex items-center gap-2 rounded-[var(--radius-xs)] px-2.5 py-2 text-[14px] font-medium text-[var(--color-text-secondary)] transition-colors duration-[120ms] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]"
          >
            <Settings size={14} />
            Settings
          </Link>
          <button
            onClick={handleSignOut}
            role="menuitem"
            aria-label="Sign out"
            className="mt-1 flex w-full cursor-pointer items-center gap-2 rounded-[var(--radius-xs)] px-2.5 py-2 text-[14px] font-medium text-[var(--color-error)] transition-colors duration-[120ms] hover:bg-[var(--color-error)]/10"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
