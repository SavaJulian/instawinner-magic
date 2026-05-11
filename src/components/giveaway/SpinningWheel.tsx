import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValue, animate, useTransform } from "framer-motion";
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
const MAX_VISIBLE_SLICES = 24;

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

function useSpinAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const droneRef = useRef<{
    stop: () => void;
  } | null>(null);
  const noiseBufferRef = useRef<AudioBuffer | null>(null);

  const getCtx = () => {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current) {
      const Ctx =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return null;
      const ctx = new Ctx();
      const master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(ctx.destination);
      ctxRef.current = ctx;
      masterRef.current = master;

      // Pre-build a short white-noise buffer for click bursts
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      noiseBufferRef.current = buf;
    }
    const ctx = ctxRef.current;
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    return ctx;
  };

  const click = (velocity: number) => {
    const ctx = getCtx();
    const master = masterRef.current;
    const buf = noiseBufferRef.current;
    if (!ctx || !master || !buf) return;
    const t = ctx.currentTime;

    // Velocity-driven pitch: fast = bright, slow = soft and woody
    const v = Math.min(1, velocity / 600);
    const cutoff = 600 + v * 3200;

    // Filtered noise burst — the "click"
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = cutoff;
    bp.Q.value = 6;
    const g = ctx.createGain();
    const peak = 0.08 + v * 0.12;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    src.connect(bp).connect(g).connect(master);
    src.start(t);
    src.stop(t + 0.06);

    // Sub-thump only while spinning fast — adds weight
    if (v > 0.45) {
      const osc = ctx.createOscillator();
      const og = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(70, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.05);
      og.gain.setValueAtTime(0, t);
      og.gain.linearRampToValueAtTime(0.07 * v, t + 0.005);
      og.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
      osc.connect(og).connect(master);
      osc.start(t);
      osc.stop(t + 0.1);
    }
  };

  const startDrone = () => {
    const ctx = getCtx();
    const master = masterRef.current;
    if (!ctx || !master) return;
    stopDrone();
    const t = ctx.currentTime;
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    // Warm cinematic bed: two sines an octave apart, gentle bandpass shimmer
    o1.type = "sine";
    o2.type = "sine";
    o1.frequency.value = 220; // A3
    o2.frequency.value = 440; // A4
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 800;
    bp.Q.value = 1.2;
    // Slow LFO on the bandpass for subtle motion
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.25;
    lfoGain.gain.value = 180;
    lfo.connect(lfoGain).connect(bp.frequency);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.03, t + 1.8);
    o1.connect(bp);
    o2.connect(bp);
    bp.connect(g).connect(master);
    o1.start(t);
    o2.start(t);
    lfo.start(t);
    droneRef.current = {
      stop: () => {
        const nt = ctx.currentTime;
        g.gain.cancelScheduledValues(nt);
        g.gain.setValueAtTime(g.gain.value, nt);
        g.gain.exponentialRampToValueAtTime(0.0001, nt + 0.8);
        o1.stop(nt + 0.9);
        o2.stop(nt + 0.9);
        lfo.stop(nt + 0.9);
      },
    };
  };

  const stopDrone = () => {
    droneRef.current?.stop();
    droneRef.current = null;
  };

  const chime = (notes: number[], opts?: { gain?: number; spacing?: number }) => {
    const ctx = getCtx();
    const master = masterRef.current;
    if (!ctx || !master) return;
    const t0 = ctx.currentTime;
    const spacing = opts?.spacing ?? 0.11;
    const peakG = opts?.gain ?? 0.18;
    notes.forEach((freq, i) => {
      const t = t0 + i * spacing;
      // Two-osc bell: fundamental + octave-up shimmer
      [1, 2.01].forEach((mult, idx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(freq * mult, t);
        const peak = idx === 0 ? peakG : peakG * 0.35;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(peak, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
        o.connect(g).connect(master);
        o.start(t);
        o.stop(t + 1.7);
      });
    });
  };

  const landingChime = () => chime([659.25, 783.99, 987.77]); // E5 G5 B5
  const finaleChime = () =>
    chime([523.25, 659.25, 783.99, 1046.5], { gain: 0.22, spacing: 0.14 }); // C5 E5 G5 C6

  return { click, startDrone, stopDrone, landingChime, finaleChime };
}

export function SpinningWheel({ allNames, winners, onFinished }: Props) {
  const [active, setActive] = useState<string[]>(allNames);
  const [spinIndex, setSpinIndex] = useState(0);
  const [revealed, setRevealed] = useState<string[]>([]);
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
  const [currentName, setCurrentName] = useState<string>(allNames[0] ?? "");
  const [landed, setLanded] = useState(false);
  const rotation = useMotionValue(0);
  const progress = useMotionValue(0);
  const progressWidth = useTransform(progress, (p) => `${Math.min(100, p * 100)}%`);
  const audio = useSpinAudio();
  const lastSliceRef = useRef<number>(-1);

  // Visual slice count is capped so the wheel never becomes thin slivers.
  const visualCount = Math.min(active.length, MAX_VISIBLE_SLICES) || 1;
  const sliceAngle = 360 / visualCount;
  const isCapped = active.length > MAX_VISIBLE_SLICES;
  const showSliceLabels = !isCapped && active.length <= MAX_VISIBLE_SLICES;

  const slices = useMemo(
    () =>
      Array.from({ length: visualCount }, (_, i) => {
        const start = i * sliceAngle;
        const end = start + sliceAngle;
        // When not capped, each slice maps 1:1 to a name
        const name = isCapped ? "" : active[i] ?? "";
        return { name, start, end, mid: start + sliceAngle / 2, index: i };
      }),
    [visualCount, sliceAngle, isCapped, active],
  );

  // Track which slice is under pointer and update center display + click sound
  useEffect(() => {
    const unsub = rotation.on("change", (v) => {
      if (sliceAngle === 0) return;
      const norm = ((-v) % 360 + 360) % 360;
      const visualIdx = Math.floor(norm / sliceAngle) % visualCount;
      if (visualIdx !== lastSliceRef.current) {
        lastSliceRef.current = visualIdx;
        // Map visual slice → a name. When capped, cycle through all names so
        // the live ticker still reflects the whole participant pool.
        const nameIdx = isCapped
          ? Math.floor(Math.random() * active.length)
          : visualIdx;
        setCurrentName(active[nameIdx] ?? "");
        const vel = Math.abs(rotation.getVelocity());
        audio.click(vel);
      }
    });
    return () => unsub();
  }, [rotation, sliceAngle, visualCount, isCapped, active, audio]);

  // Run spin
  useEffect(() => {
    if (active.length === 0) return;
    if (spinIndex >= winners.length) return;

    setLanded(false);
    progress.set(0);
    audio.startDrone();
    const targetName = winners[spinIndex];
    let activeIdx = active.findIndex(
      (n) => n.toLowerCase() === targetName.toLowerCase(),
    );
    if (activeIdx === -1) {
      activeIdx = Math.floor(Math.random() * active.length);
    }
    // Visual slice we'll actually land on (decorative when capped)
    const visualTargetIdx = isCapped
      ? Math.floor(Math.random() * visualCount)
      : activeIdx;

    const mid = visualTargetIdx * sliceAngle + sliceAngle / 2;
    const currentRot = rotation.get();
    const baseTurns = Math.floor(currentRot / 360) * 360;
    const jitter = (Math.random() - 0.5) * sliceAngle * 0.4;
    const desired = -mid + jitter;
    const extraTurns = spinIndex === 0 ? 11 : 9;
    const finalRot = baseTurns + extraTurns * 360 + desired;
    const duration = spinIndex === 0 ? 13 : 11;

    const progressCtl = animate(progress, 1, {
      duration,
      ease: "linear",
    });
    const controls = animate(rotation, finalRot, {
      duration,
      ease: [0.12, 0.62, 0.18, 1],
      onComplete: () => {
        setHighlightIdx(visualTargetIdx);
        setLanded(true);
        audio.stopDrone();
        audio.landingChime();
        const winnerName = active[activeIdx];
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
            audio.finaleChime();
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
            setActive((prev) => prev.filter((_, i) => i !== activeIdx));
            setSpinIndex(next);
          }
        }, 2400);
      },
    });

    return () => {
      controls.stop();
      progressCtl.stop();
      audio.stopDrone();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinIndex, active]);

  return (
    <div className="relative flex w-full flex-col items-center justify-center">
      {/* Prize banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mb-4 flex flex-col items-center gap-1 text-center"
      >
        <div className="flex items-center gap-2 font-mono text-[0.6rem] uppercase tracking-[0.4em] text-foreground/60">
          <motion.span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: "var(--gold)" }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          />
          LIVE GIVEAWAY
        </div>
        <div
          className="font-display text-5xl leading-none md:text-6xl"
          style={{
            background:
              "linear-gradient(180deg, #FBE7A8 0%, #E8C870 45%, #C9A961 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter:
              "drop-shadow(0 0 24px color-mix(in oklab, var(--gold) 55%, transparent))",
            fontWeight: 600,
          }}
        >
          €300
        </div>
        <div className="font-mono text-[0.7rem] uppercase tracking-[0.35em] text-foreground/70">
          3 × €100 winners · {active.length} entries
        </div>
      </motion.div>

      <div
        className="relative"
        style={{ width: "min(70vw, 44svh, 400px)", aspectRatio: "1 / 1" }}
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
            borderLeft: "24px solid transparent",
            borderRight: "24px solid transparent",
            borderTop: "44px solid var(--gold)",
            filter:
              "drop-shadow(0 6px 18px color-mix(in oklab, var(--gold) 85%, transparent))",
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
            strokeWidth={6}
            opacity={0.95}
          />
          <circle
            cx={R}
            cy={R}
            r={R - RIM - 2}
            fill="none"
            stroke="var(--gold)"
            strokeWidth={1}
            opacity={0.35}
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
                        : "color-mix(in oklab, #C9A961 14%, #050505)"
                  }
                  stroke="color-mix(in oklab, #C9A961 45%, transparent)"
                  strokeWidth={1}
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
          <circle cx={R} cy={R} r={R * 0.26} fill="#000" />
          <circle
            cx={R}
            cy={R}
            r={R * 0.26}
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

      {/* Status chip above live-name pill */}
      <div className="mt-3 flex justify-center">
        <span
          className="rounded-full px-3 py-1 font-mono text-[0.55rem] uppercase tracking-[0.3em]"
          style={{
            background: landed
              ? "var(--gold)"
              : "color-mix(in oklab, var(--gold) 18%, transparent)",
            color: landed ? "#000" : "var(--gold)",
          }}
        >
          {landed
            ? `Winner ${spinIndex + 1}`
            : `${Math.min(spinIndex + 1, winners.length)} / ${winners.length}`}
        </span>
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
        className="relative mt-2 flex h-14 items-center justify-center overflow-hidden rounded-xl border px-6"
        style={{
          minWidth: "min(72vw, 480px)",
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
          className="truncate font-display text-4xl text-foreground md:text-5xl"
          style={{
            letterSpacing: "0.01em",
          }}
        >
          @{currentName}
        </span>

        {/* Progress bar — visual countdown for muted viewers */}
        <motion.div
          aria-hidden
          className="absolute bottom-0 left-0 h-[3px]"
          style={{
            width: progressWidth,
            background:
              "linear-gradient(90deg, color-mix(in oklab, var(--gold) 40%, transparent), var(--gold))",
            boxShadow:
              "0 0 12px color-mix(in oklab, var(--gold) 80%, transparent)",
          }}
        />
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
                W{i + 1}
              </span>
              <span className="font-display text-xl text-foreground">@{w}</span>
            </motion.div>
          ))}
        </div>
      )}

      {/* Participants panel — auto-scrolling list of every entry */}
      <ParticipantsPanel names={allNames} currentName={currentName} landed={landed} />
    </div>
  );
}

function ParticipantsPanel({
  names,
  currentName,
  landed,
}: {
  names: string[];
  currentName: string;
  landed: boolean;
}) {
  const duration = Math.max(30, Math.min(120, names.length * 0.7));
  return (
    <div
      className="mt-5 w-full"
      style={{ maxWidth: "min(78vw, 520px)" }}
    >
      <div className="mb-2 flex items-center justify-between font-mono text-[0.6rem] uppercase tracking-[0.3em] text-foreground/60">
        <span>Participants</span>
        <span className="text-[var(--gold)]">{names.length}</span>
      </div>
      <div
        className="relative overflow-hidden rounded-xl border"
        style={{
          height: "22vh",
          maxHeight: 240,
          borderColor: "color-mix(in oklab, var(--gold) 25%, transparent)",
          background: "color-mix(in oklab, var(--gold) 3%, transparent)",
          boxShadow:
            "inset 0 0 60px -20px color-mix(in oklab, var(--gold) 30%, transparent)",
        }}
      >
        {/* top/bottom fade masks */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10"
          style={{
            background:
              "linear-gradient(180deg, var(--background), transparent)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10"
          style={{
            background:
              "linear-gradient(0deg, var(--background), transparent)",
          }}
        />

        <div
          className="pointer-events-none flex flex-col gap-1.5 px-3 py-3"
          style={{
            animation: `participants-scroll ${duration}s linear infinite`,
          }}
        >
          {[...names, ...names].map((n, i) => {
            const isCurrent = n === currentName;
            return (
              <div
                key={i}
                className="flex items-center justify-between rounded-md px-3 py-1.5 font-mono text-sm transition-colors"
                style={{
                  background: isCurrent
                    ? "var(--gold)"
                    : "transparent",
                  color: isCurrent ? "#000" : "rgba(245,241,234,0.65)",
                  fontWeight: isCurrent ? 700 : 400,
                  boxShadow: isCurrent && landed
                    ? "0 0 24px color-mix(in oklab, var(--gold) 70%, transparent)"
                    : "none",
                }}
              >
                <span className="truncate">@{n}</span>
              </div>
            );
          })}
        </div>
      </div>
      <style>{`
        @keyframes participants-scroll {
          from { transform: translateY(0); }
          to { transform: translateY(-50%); }
        }
      `}</style>
    </div>
  );
}
