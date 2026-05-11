import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import confetti from "canvas-confetti";
import logo from "@/assets/emimoda-logo.png";

type Props = {
  allNames: string[];
  winners: string[]; // forced winners, length up to 3
  onFinished: (winners: string[]) => void;
};

const SIZE = 720;
const R = SIZE / 2;
const RIM = 18;

function polar(angleDeg: number, radius: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: R + radius * Math.cos(a), y: R + radius * Math.sin(a) };
}

function slicePath(startDeg: number, endDeg: number, outer: number) {
  const s = polar(startDeg, outer);
  const e = polar(endDeg, outer);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${R} ${R} L ${s.x} ${s.y} A ${outer} ${outer} 0 ${large} 1 ${e.x} ${e.y} Z`;
}

// Audio tick (Web Audio)
function useTicker() {
  const ctxRef = useRef<AudioContext | null>(null);
  const getCtx = () => {
    if (!ctxRef.current && typeof window !== "undefined") {
      const Ctx =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      if (Ctx) ctxRef.current = new Ctx();
    }
    return ctxRef.current;
  };
  return (freq = 1400, gain = 0.08) => {
    const ctx = getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    osc.connect(g).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.09);
  };
}

export function SpinningWheel({ allNames, winners, onFinished }: Props) {
  // Active wheel names — winners are removed after each round
  const [active, setActive] = useState<string[]>(allNames);
  const [spinIndex, setSpinIndex] = useState(0);
  const [revealed, setRevealed] = useState<string[]>([]);
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
  const rotation = useMotionValue(0);
  const tick = useTicker();
  const lastSliceRef = useRef<number>(-1);

  const sliceAngle = active.length > 0 ? 360 / active.length : 0;

  // Slices with start/end angles
  const slices = useMemo(() => {
    return active.map((name, i) => {
      const start = i * sliceAngle;
      const end = start + sliceAngle;
      return { name, start, end, mid: start + sliceAngle / 2, index: i };
    });
  }, [active, sliceAngle]);

  // Subscribe to rotation for tick sound (slice passing top pointer)
  useEffect(() => {
    const unsub = rotation.on("change", (v) => {
      if (sliceAngle === 0) return;
      // pointer is at top (0deg). Slice under pointer:
      const norm = ((-v) % 360 + 360) % 360;
      const idx = Math.floor(norm / sliceAngle);
      if (idx !== lastSliceRef.current) {
        lastSliceRef.current = idx;
        // frequency drifts down as wheel slows — use current motion velocity proxy via getVelocity
        const vel = Math.abs(rotation.getVelocity());
        const freq = 700 + Math.min(900, vel * 0.6);
        const gain = vel > 50 ? 0.06 : 0.1;
        tick(freq, gain);
      }
    });
    return () => unsub();
  }, [rotation, sliceAngle, tick]);

  // Run spin when spinIndex changes
  useEffect(() => {
    if (active.length === 0) return;
    if (spinIndex >= winners.length) return;

    const targetName = winners[spinIndex];
    // Find index of target on current wheel; if missing (shouldn't happen), pick random
    let targetIdx = active.findIndex(
      (n) => n.toLowerCase() === targetName.toLowerCase(),
    );
    if (targetIdx === -1) {
      targetIdx = Math.floor(Math.random() * active.length);
    }

    // The slice spans [targetIdx*sliceAngle, +sliceAngle]. Pointer is at 0deg top.
    // We need rotation R such that target slice mid ends up at 0deg.
    // After rotation R: visual angle of mid = (mid + R) mod 360. Want that == 0.
    // So R = -mid (mod 360). Add big number of full turns for suspense.
    const mid = targetIdx * sliceAngle + sliceAngle / 2;
    const currentRot = rotation.get();
    // Reduce current rotation to its [0,360) equivalent baseline
    const baseTurns = Math.floor(currentRot / 360) * 360;
    // tiny random jitter within slice (stay safely inside)
    const jitter = (Math.random() - 0.5) * sliceAngle * 0.5;
    const desired = -mid + jitter; // target final rotation mod 360
    // Number of full rotations for suspense — more for first spin
    const extraTurns = spinIndex === 0 ? 10 : 8;
    const finalRot = baseTurns + extraTurns * 360 + desired;

    const duration = spinIndex === 0 ? 13 : 11;

    const controls = animate(rotation, finalRot, {
      duration,
      ease: [0.12, 0.62, 0.18, 1], // long ease-out for suspense
      onComplete: () => {
        // celebrate
        setHighlightIdx(targetIdx);
        const winnerName = active[targetIdx];
        confetti({
          particleCount: 140,
          spread: 90,
          startVelocity: 45,
          origin: { x: 0.5, y: 0.45 },
          colors: ["#C9A961", "#F5F1EA", "#ffffff"],
          ticks: 260,
        });
        setRevealed((prev) => [...prev, winnerName]);

        setTimeout(() => {
          setHighlightIdx(null);
          const next = spinIndex + 1;
          if (next >= winners.length) {
            // finale
            confetti({
              particleCount: 260,
              spread: 130,
              startVelocity: 55,
              origin: { x: 0.5, y: 0.5 },
              colors: ["#C9A961", "#F5F1EA", "#ffffff"],
              ticks: 320,
            });
            setTimeout(() => onFinished(winners), 1400);
          } else {
            // Remove winner from wheel and continue
            setActive((prev) => prev.filter((_, i) => i !== targetIdx));
            setSpinIndex(next);
          }
        }, 2200);
      },
    });

    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinIndex, active]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="mb-6 text-center">
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-foreground/50">
          Drawing winner {Math.min(spinIndex + 1, winners.length)} of{" "}
          {winners.length}
        </div>
        <div className="mt-1 font-display text-3xl text-foreground md:text-5xl">
          The wheel of fate
        </div>
      </div>

      <div
        className="relative"
        style={{
          width: "min(86vw, 620px)",
          aspectRatio: "1 / 1",
        }}
      >
        {/* Outer glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-[-10%]"
          style={{
            background:
              "radial-gradient(circle at center, color-mix(in oklab, var(--gold) 22%, transparent), transparent 65%)",
          }}
        />

        {/* Pointer */}
        <div
          aria-hidden
          className="absolute left-1/2 top-[-2%] z-20 -translate-x-1/2"
          style={{
            width: 0,
            height: 0,
            borderLeft: "18px solid transparent",
            borderRight: "18px solid transparent",
            borderTop: "32px solid var(--gold)",
            filter:
              "drop-shadow(0 4px 10px color-mix(in oklab, var(--gold) 60%, transparent))",
          }}
        />

        <motion.svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="relative h-full w-full"
          style={{ rotate: rotation }}
        >
          <defs>
            <radialGradient id="hub" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1a1a1a" />
              <stop offset="100%" stopColor="#000" />
            </radialGradient>
          </defs>

          {/* Rim */}
          <circle
            cx={R}
            cy={R}
            r={R - 4}
            fill="none"
            stroke="var(--gold)"
            strokeWidth={4}
            opacity={0.9}
          />
          <circle
            cx={R}
            cy={R}
            r={R - RIM}
            fill="#050505"
          />

          {/* Slices */}
          <g>
            {slices.map((s) => {
              const isHi = highlightIdx === s.index;
              return (
                <g key={s.name + s.index}>
                  <path
                    d={slicePath(s.start, s.end, R - RIM - 2)}
                    fill={
                      isHi
                        ? "color-mix(in oklab, #C9A961 45%, #000)"
                        : s.index % 2 === 0
                          ? "#0a0a0a"
                          : "#000"
                    }
                    stroke="color-mix(in oklab, #C9A961 30%, transparent)"
                    strokeWidth={0.6}
                  />
                </g>
              );
            })}
          </g>

          {/* Labels along radius */}
          <g>
            {slices.map((s) => {
              const isHi = highlightIdx === s.index;
              const labelR = R - RIM - 30;
              const p = polar(s.mid, labelR);
              const inner = polar(s.mid, R * 0.28);
              const angle = s.mid; // 0 = top
              // Rotate text so it reads from rim toward center
              return (
                <text
                  key={"t" + s.index}
                  x={p.x}
                  y={p.y}
                  fill={isHi ? "#C9A961" : "#F5F1EA"}
                  fontFamily="'JetBrains Mono', monospace"
                  fontSize={Math.max(10, Math.min(20, 260 / Math.max(8, active.length)))}
                  textAnchor="end"
                  dominantBaseline="middle"
                  opacity={isHi ? 1 : 0.78}
                  transform={`rotate(${angle - 90} ${p.x} ${p.y})`}
                >
                  @{s.name.length > 18 ? s.name.slice(0, 17) + "…" : s.name}
                </text>
              );
            })}
          </g>

          {/* Hub */}
          <circle cx={R} cy={R} r={R * 0.18} fill="url(#hub)" />
          <circle
            cx={R}
            cy={R}
            r={R * 0.18}
            fill="none"
            stroke="var(--gold)"
            strokeWidth={2}
            opacity={0.7}
          />
        </motion.svg>

        {/* Center logo (counter-rotates by sitting outside the spinning svg) */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <img
            src={logo}
            alt="EmiModa"
            className="h-[14%] w-auto opacity-95"
            style={{
              filter:
                "drop-shadow(0 0 16px color-mix(in oklab, var(--gold) 50%, transparent))",
            }}
          />
        </div>
      </div>

      {/* Winner cards as they're revealed */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {revealed.map((w, i) => (
          <motion.div
            key={w + i}
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="rounded-lg border border-[var(--gold)]/40 bg-foreground/[0.04] px-5 py-3"
          >
            <div className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-[var(--gold)]">
              Winner 0{i + 1}
            </div>
            <div className="font-display text-2xl text-foreground">@{w}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
