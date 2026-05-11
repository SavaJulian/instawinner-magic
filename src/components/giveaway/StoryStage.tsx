import { ReactNode } from "react";

/**
 * Wraps content in an Instagram-Story-safe layout.
 * Top ~14% and bottom ~20% of a 9:16 frame are covered by IG's chrome,
 * so we keep all critical content inside the middle band.
 * On wider viewports the padding is reduced so the desktop preview still looks balanced.
 */
export function StoryStage({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative mx-auto flex min-h-screen w-full flex-col items-center justify-center"
      style={{
        paddingTop: "max(2rem, 12svh)",
        paddingBottom: "max(2rem, 16svh)",
        paddingLeft: "1rem",
        paddingRight: "1rem",
      }}
    >
      {children}
    </div>
  );
}

/** Subtle film-grain overlay for a premium feel on Instagram's compression. */
export function FilmGrain() {
  const svg = encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>`,
  );
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[1] mix-blend-overlay"
      style={{
        backgroundImage: `url("data:image/svg+xml;utf8,${svg}")`,
        backgroundSize: "200px 200px",
        opacity: 0.06,
      }}
    />
  );
}