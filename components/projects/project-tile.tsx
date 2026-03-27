// components/projects/project-tile.tsx
"use client";

import Link from "next/link";
import { MagicCard } from "@/components/ui/magic-card";
import { BlurFade } from "@/components/ui/blur-fade";

// Cycles through analog-1/2/3 token values at 20% opacity by index
const ICON_COLORS = [
  { bg: "hsla(200,55%,55%,0.20)", border: "hsla(200,55%,55%,0.30)" },
  { bg: "hsla(220,55%,55%,0.20)", border: "hsla(220,55%,55%,0.30)" },
  { bg: "hsla(240,55%,60%,0.20)", border: "hsla(240,55%,60%,0.30)" },
] as const;

type ProjectTileProps = {
  id: string;
  name: string;
  createdAt: string;
  index: number;
};

export function ProjectTile({ id, name, createdAt, index }: ProjectTileProps) {
  const iconColor = ICON_COLORS[index % ICON_COLORS.length];

  return (
    <BlurFade delay={index * 0.04} duration={0.28}>
      <Link href={`/projects/${id}`} className="block h-full">
        <MagicCard
          className="flex h-full flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] p-6 shadow-[var(--shadow-2)] backdrop-blur-[20px] transition-transform duration-[180ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:scale-[1.015]"
          gradientColor="hsla(220,55%,55%,0.10)"
        >
          {/* Color-coded icon block */}
          <div
            data-tile-icon
            className="h-[26px] w-[26px] rounded-[var(--radius-xs)] border"
            style={{
              background: iconColor.bg,
              borderColor: iconColor.border,
            }}
          />

          {/* Project name */}
          <p className="text-[20px] font-semibold leading-snug text-[var(--color-text-primary)]">
            {name}
          </p>

          {/* Created date */}
          <p className="text-[14px] text-[var(--color-text-tertiary)]">
            {new Date(createdAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        </MagicCard>
      </Link>
    </BlurFade>
  );
}
