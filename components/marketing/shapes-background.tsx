"use client";

import { ElegantShape } from "./elegant-shape";

export function ShapesBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Shape 1 — analog-2, 600×140, rotate 12° */}
      <ElegantShape
        delay={0.3}
        width={600}
        height={140}
        rotate={12}
        gradient="from-[var(--color-analog-2)]/15"
        className="left-[-5%] top-[20%]"
      />
      {/* Shape 2 — analog-3, 500×120, rotate -15° */}
      <ElegantShape
        delay={0.5}
        width={500}
        height={120}
        rotate={-15}
        gradient="from-[var(--color-analog-3)]/15"
        className="right-[0%] top-[75%]"
      />
      {/* Shape 3 — analog-1, 300×80, rotate -8° */}
      <ElegantShape
        delay={0.4}
        width={300}
        height={80}
        rotate={-8}
        gradient="from-[var(--color-analog-1)]/15"
        className="bottom-[10%] left-[10%]"
      />
      {/* Shape 4 — accent-primary, 200×60, rotate 20° */}
      <ElegantShape
        delay={0.6}
        width={200}
        height={60}
        rotate={20}
        gradient="from-[var(--color-accent-primary)]/[0.12]"
        className="right-[20%] top-[15%]"
      />
      {/* Shape 5 — analog-1, 150×40, rotate -25° */}
      <ElegantShape
        delay={0.7}
        width={150}
        height={40}
        rotate={-25}
        gradient="from-[var(--color-analog-1)]/[0.11]"
        className="left-[25%] top-[10%]"
      />
    </div>
  );
}
