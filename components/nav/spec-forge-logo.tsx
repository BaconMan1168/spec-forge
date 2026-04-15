// components/nav/spec-forge-logo.tsx
// Placeholder — swap the inner content for the real SVG when ready.
// The outer wrapper keeps dimensions and border-radius stable.
export function SpecForgeLogo() {
  return (
    <div
      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[7px]"
      style={{
        background:
          "linear-gradient(135deg, hsl(220, 55%, 55%), hsl(240, 55%, 60%))",
      }}
      aria-hidden="true"
    >
      <span className="text-[13px] font-bold text-white">X</span>
    </div>
  );
}
