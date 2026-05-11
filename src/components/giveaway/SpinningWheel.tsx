import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import confetti from "canvas-confetti";
import logo from "@/assets/emimoda-logo.png";

type Props = {
  allNames: string[];
  winners: string[];
  onFinished: (winners: string[]) => void;
};

const SIZE = 720;
const R = SIZE / 2;
const RIM = 14;

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
  const [active, setActive] = useState<string[]>(allNames);
  const [spinIndex, setSpinIndex] = useState(0);
  const [revealed, setRevealed] = useState<string[]>([]);
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
  const [currentName, setCurrentName] = useState<string>(allNames[0] ?? "");
  const [landed, setLanded] = useState(false);
  const rotation = useMotionValue(0);
  const tick = useTicker();
  const lastSliceRef = useRef<number>(-1);

  const sliceAngle = active.length > 0 ? 360 / active.length : 0;

  // Decide if we show name labels on slices (only for small lists)
  const showSliceLabels = active.length <= 24;

  const slices = useMemo(
    () =>
      active.map((name, i) => {
        const start = i * sliceAngle;
        const end = start + sliceAngle;
        return { name, start, end, mid: start + sliceAngle / 2, index: i };
      }),
    [active, sliceAngle],
  );

  // Track which slice is under pointer and update center display + tick sound
  useEffect(() => {
    const unsub = rotation.on("change", (v) => {
      if (sliceAngle === 0) return;
      const norm = ((-v) % 360 + 360) % 360;
      const idx = Math.floor(norm / sliceAngle) % active.length;
      if (idx !== lastSliceRef.current) {
        lastSliceRef.current = idx;
        setCurrentName(active[idx]);
        const vel = Math.abs(rotation.getVelocity());
        const freq = 650 + Math.min(900, vel * 0.5);
        const gain = vel > 80 ? 0.05 : 0.1;
        tick(freq, gain);
      }
    });
    return () => unsub();
  }, [rotation, sliceAngle, tick, active]);

  // Run spin
  useEffect(() => {
    if (active.length === 0) return;
    if (spinIndex >= winners.length) return;

    setLanded(false);
    const targetName = winners[spinIndex];
    let targetIdx = active.findIndex(
      (n) => n.toLowerCase() === targetName.toLowerCase(),
    );
    if (targetIdx === -1) {
      targetIdx = Math.floor(Math.random() * active.length);
    }

    const mid = targetIdx * sliceAngle + sliceAngle / 2;
    const currentRot = rotation.get();
    const baseTurns = Math.floor(currentRot / 360) * 360;
    const jitter = (Math.random() - 0.5) * sliceAngle * 0.4;
    const desired = -mid + jitter;
    const extraTurns = spinIndex === 0 ? 11 : 9;
    const finalRot = baseTurns + extraTurns * 360 + desired;
    const duration = spinIndex === 0 ? 13 : 11;

    const controls = animate(rotation, finalRot, {
      duration,
      ease: [0.12, 0.62, 0.18, 1],
      onComplete: () => {
        setHighlightIdx(targetIdx);
        setLanded(true);
        const winnerName = active[targetIdx];
        setCurrentName(winnerName);
        confetti({
          particleCount: 160,
          spread: 95,
          startVelocity: 48,
          origin: { x: 0.5, y: 0.45 },
          colors: ["#C9A961", "#F5F1EA", "#ffffff"],
          ticks: 280,
        });
        setRevealed((prev) => [...prev, winnerName]);

        setTimeout(() => {
          setHighlightIdx(null);
          setLanded(false);
          const next = spinIndex + 1;
          if (next >= winners.length) {
            confetti({
              particleCount: 280,
              spread: 130,
              startVelocity: 60,
              origin: { x: 0.5, y: 0.5 },
              colors: ["#C9A961", "#F5F1EA", "#ffffff"],
              ticks: 320,
            });
            setTimeout(() => onFinished(winners), 1500);
          } else {
            setActive((prev) => prev.filter((_, i) => i !== targetIdx));
            setSpinIndex(next);
          }
        }, 2400);
      },
    });

    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinIndex, active]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-start px-4 pt-6 pb-10">
      {/* Prize banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mb-4 flex flex-col items-center gap-1 text-center"
      >
        <div className="font-mono text-[0.6rem] uppercase tracking-[0.4em] text-foreground/40">
          EmiModa giveaway
        </div>
        <div
          className="font-display text-4xl text-foreground md:text-5xl"
          style={{
            textShadow:
              "0 0 30px color-mix(in oklab, var(--gold) 60%, transparent)",
          }}
        >
          €300 prize pool
        </div>
        <div className="font-mono text-[0.7rem] uppercase tracking-[0.35em] text-[var(--gold)]">
          3 winners · €100 each
        </div>
      </motion.div>

      <div className="mb-3 text-center">
        <div className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-foreground/50">
          Drawing winner {Math.min(spinIndex + 1, winners.length)} of{" "}
          {winners.length} · {active.length} entries
        </div>
      </div>

      <div
        className="relative"
        style={{ width: "min(82vw, 560px)", aspectRatio: "1 / 1" }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-[-12%]"
          style={{
            background:
              "radial-gradient(circle at center, color-mix(in oklab, var(--gold) 22%, transparent), transparent 65%)",
          }}
        />

        {/* Pointer */}
        <div
          aria-hidden
          className="absolute left-1/2 top-[-3%] z-20 -translate-x-1/2"
          style={{
            width: 0,
            height: 0,
            borderLeft: "20px solid transparent",
            borderRight: "20px solid transparent",
            borderTop: "36px solid var(--gold)",
            filter:
              "drop-shadow(0 4px 12px color-mix(in oklab, var(--gold) 70%, transparent))",
          }}
        />

        <motion.svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="relative h-full w-full"
          style={{ rotate: rotation }}
        >
          {/* Outer rim */}
          <circle
            cx={R}
            cy={R}
            r={R - 3}
            fill="none"
            stroke="var(--gold)"
            strokeWidth={4}
            opacity={0.95}
          />
          <circle cx={R} cy={R} r={R - RIM} fill="#050505" />

          {/* Slices */}
          <g>
            {slices.map((s) => {
              const isHi = highlightIdx === s.index;
              return (
                <path
                  key={"s" + s.index}
                  d={slicePath(s.start, s.end, R - RIM - 1)}
                  fill={
                    isHi
                      ? "#C9A961"
                      : s.index % 2 === 0
                        ? "#0c0c0c"
                        : "#020202"
                  }
                  stroke="color-mix(in oklab, #C9A961 35%, transparent)"
                  strokeWidth={active.length > 60 ? 0.3 : 0.7}
                  opacity={isHi ? 1 : 1}
                />
              );
            })}
          </g>

          {/* Slice labels only when there are few entries */}
          {showSliceLabels && (
            <g>
              {slices.map((s) => {
                const isHi = highlightIdx === s.index;
                const labelR = R - RIM - 28;
                const p = polar(s.mid, labelR);
                return (
                  <text
                    key={"t" + s.index}
                    x={p.x}
                    y={p.y}
                    fill={isHi ? "#000" : "#F5F1EA"}
                    fontFamily="'JetBrains Mono', monospace"
                    fontSize={Math.max(11, Math.min(18, 280 / active.length))}
                    fontWeight={isHi ? 700 : 400}
                    textAnchor="end"
                    dominantBaseline="middle"
                    opacity={isHi ? 1 : 0.85}
                    transform={`rotate(${s.mid - 90} ${p.x} ${p.y})`}
                  >
                    @{s.name.length > 16 ? s.name.slice(0, 15) + "…" : s.name}
                  </text>
                );
              })}
            </g>
          )}

          {/* Decorative tick marks on rim for big lists */}
          {!showSliceLabels && (
            <g>
              {slices.map((s) => {
                const outer = polar(s.start, R - RIM - 1);
                const inner = polar(s.start, R - RIM - 14);
                return (
                  <line
                    key={"tk" + s.index}
                    x1={outer.x}
                    y1={outer.y}
                    x2={inner.x}
                    y2={inner.y}
                    stroke="#C9A961"
                    strokeWidth={0.6}
                    opacity={0.6}
                  />
                );
              })}
            </g>
          )}

          {/* Hub */}
          <circle cx={R} cy={R} r={R * 0.22} fill="#000" />
          <circle
            cx={R}
            cy={R}
            r={R * 0.22}
            fill="none"
            stroke="var(--gold)"
            strokeWidth={2}
            opacity={0.75}
          />
        </motion.svg>

        {/* Center logo (does not rotate) */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <img
            src={logo}
            alt="EmiModa"
            className="w-[34%] h-auto opacity-95"
            style={{
              filter:
                "brightness(0) invert(1) drop-shadow(0 0 18px color-mix(in oklab, var(--gold) 55%, transparent))",
            }}
          />
        </div>
      </div>

      {/* LIVE name display under the wheel — big, readable on camera */}
      <motion.div
        key={landed ? "landed" : "live"}
        initial={{ opacity: 0.6, scale: 0.98 }}
        animate={{
          opacity: 1,
          scale: landed ? 1.06 : 1,
        }}
        transition={{ duration: 0.25 }}
        className="mt-6 flex h-20 items-center justify-center rounded-xl border px-8"
        style={{
          minWidth: "min(82vw, 560px)",
          borderColor: landed
            ? "var(--gold)"
            : "color-mix(in oklab, var(--gold) 25%, transparent)",
          background: landed
            ? "color-mix(in oklab, var(--gold) 12%, transparent)"
            : "color-mix(in oklab, var(--gold) 4%, transparent)",
          boxShadow: landed
            ? "0 0 80px -10px color-mix(in oklab, var(--gold) 70%, transparent)"
            : "none",
        }}
      >
        <span
          className="truncate font-display text-3xl text-foreground md:text-5xl"
          style={{
            letterSpacing: "0.01em",
          }}
        >
          @{currentName}
        </span>
      </motion.div>

      {/* Revealed winners stack */}
      {revealed.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {revealed.map((w, i) => (
            <motion.div
              key={w + i}
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="rounded-lg border border-[var(--gold)]/40 bg-foreground/[0.04] px-4 py-2"
            >
              <span className="mr-2 font-mono text-[0.6rem] uppercase tracking-[0.3em] text-[var(--gold)]">
                W0{i + 1}
              </span>
              <span className="font-display text-xl text-foreground">@{w}</span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
