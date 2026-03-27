// components/ui/aurora-background.tsx
// Five horizontally-blurred aurora bands that drift continuously.
// Uses exact --analog-1/2/3 token values per design-system.md §1.4.
// Respects prefers-reduced-motion by pausing animation.

const BANDS = [
  {
    height: "70px",
    top: "18%",
    gradient:
      "linear-gradient(90deg, transparent 0%, hsla(200,55%,55%,0.18) 25%, hsla(220,55%,55%,0.14) 55%, transparent 100%)",
    blur: "22px",
    duration: "10s",
    direction: "normal" as const,
    delay: "0s",
  },
  {
    height: "50px",
    top: "32%",
    gradient:
      "linear-gradient(90deg, transparent 10%, hsla(240,55%,60%,0.14) 40%, hsla(200,55%,55%,0.12) 65%, transparent 100%)",
    blur: "18px",
    duration: "14s",
    direction: "reverse" as const,
    delay: "-4s",
  },
  {
    height: "60px",
    top: "58%",
    gradient:
      "linear-gradient(90deg, transparent 5%, hsla(220,55%,55%,0.12) 35%, hsla(240,55%,60%,0.16) 70%, transparent 100%)",
    blur: "20px",
    duration: "11s",
    direction: "normal" as const,
    delay: "-7s",
  },
  {
    height: "40px",
    top: "72%",
    gradient:
      "linear-gradient(90deg, transparent 20%, hsla(200,55%,55%,0.10) 50%, hsla(220,55%,55%,0.12) 75%, transparent 100%)",
    blur: "16px",
    duration: "16s",
    direction: "reverse" as const,
    delay: "-2s",
  },
  {
    height: "35px",
    top: "8%",
    gradient:
      "linear-gradient(90deg, transparent 30%, hsla(240,55%,60%,0.09) 60%, transparent 100%)",
    blur: "14px",
    duration: "12s",
    direction: "normal" as const,
    delay: "-9s",
  },
] as const;

export function AuroraBackground() {
  return (
    <>
      <style>{`
        @keyframes aurora-drift {
          0%, 100% { transform: translateX(0) skewX(-6deg) scaleY(1); }
          30%       { transform: translateX(6%) skewX(3deg) scaleY(1.12); }
          60%       { transform: translateX(-4%) skewX(-3deg) scaleY(0.88); }
          80%       { transform: translateX(9%) skewX(4deg) scaleY(1.08); }
        }
        @media (prefers-reduced-motion: reduce) {
          .aurora-band { animation-play-state: paused !important; }
        }
      `}</style>
      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        aria-hidden="true"
      >
        {BANDS.map((band, i) => (
          <div
            key={i}
            data-aurora-band
            className="aurora-band absolute left-[-10%] w-[120%] rounded-[50%]"
            style={{
              height: band.height,
              top: band.top,
              background: band.gradient,
              filter: `blur(${band.blur})`,
              animation: `aurora-drift ${band.duration} ease-in-out ${band.delay} infinite ${band.direction}`,
            }}
          />
        ))}
      </div>
    </>
  );
}
