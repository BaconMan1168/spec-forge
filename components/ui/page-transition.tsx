// components/ui/page-transition.tsx
"use client";

import { motion } from "motion/react";
import { usePathname } from "next/navigation";

const PAGE_TRANSITION = {
  type: "tween" as const,
  duration: 0.3,
  ease: [0.22, 1, 0.36, 1] as const,
};

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={PAGE_TRANSITION}
    >
      {children}
    </motion.div>
  );
}
