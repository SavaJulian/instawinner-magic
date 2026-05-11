import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";

const ITEM_HEIGHT = 88;
const VISIBLE = 5;

function buildStrip(names: string[], winner: string, loops: number) {
  const arr: string[] = [];
  const pool = names.length > 0 ? names : [winner];
  for (let i = 0; i < loops; i++) {
    for (let j = 0; j < pool.length; j++) {
      arr.push(pool[(j + i * 7) % pool.length]);
    }
  }
  arr.push(winner);
  return arr;
}

function ReelColumn({
  names,
  winner,
  startDelay,
  durationMs,
  onStop,
  label,
}: {
  names: string[];
  winner: string;
  startDelay: number;
  durationMs: number;
  onStop: () => void;
  label: string;
}) {
  const strip = useRef<string[]>(buildStrip(names, winner, 6));
  const [started, setStarted] = useState(false);
  const [stopped, setStopped] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), startDelay);
    const t2 = setTimeout(() => {
      setStopped(true);
      onStop();
    }, startDelay + durationMs);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, [startDelay, durationMs, onStop]);

  const totalItems = strip.current.length;
  const finalY =
    -(totalItems - 1) * ITEM_HEIGHT + ((VISIBLE - 1) / 2) * ITEM_HEIGHT;

  return (
    <div className="flex flex-col items-center">
      <div className="mb-3 font-mono text-[0.65rem] uppercase tracking-[0.3em] text-foreground/50">
        {label}
      </div>
      <div
        className="relative overflow-hidden rounded-xl border border-[var(--gold)]/30 bg-foreground/[0.02]"
        style={{
          height: ITEM_HEIGHT * VISIBLE,
          width: "min(28vw, 280px)",
          minWidth: 180,
          boxShadow:
            "inset 0 30px 40px -20px rgba(0,0,0,0.9), inset 0 -30px 40px -20px rgba(0,0,0,0.9), 0 0 60px -20px color-mix(in oklab, var(--gold) 50%, transparent)",
        }}
      >
        <motion.div
          initial={{ y: 0 }}
          animate={started ? { y: finalY } : { y: 0 }}
          transition={{
            duration: durationMs / 1000,
            ease: [0.15, 0.85, 0.25, 1],
          }}
          style={{
            filter: started && !stopped ? "blur(2px)" : "blur(0px)",
            transition: "filter 0.3s",
          }}
        >
          {strip.current.map((name, i) => (
            <div
              key={i}
              className="flex items-center justify-center font-display text-2xl text-foreground md:text-3xl"
              style={{ height: ITEM_HEIGHT }}
            >
              @{name}
            </div>
          ))}
        </motion.div>

        <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2">
          <div
            className="mx-2 border-y"
            style={{
              height: ITEM_HEIGHT,
              borderColor:
                "color-mix(in oklab, var(--gold) 60%, transparent)",
            }}
          />
        </div>

        {stopped && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.8 }}
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at center, color-mix(in oklab, var(--gold) 40%, transparent), transparent 70%)",
            }}
          />
        )}
      </div>
    </div>
  );
}

export function SlotReels({
  allNames,
  winners,
  onFinished,
}: {
  allNames: string[];
  winners: string[];
  onFinished: (winners: string[]) => void;
}) {
  const stopsRef = useRef(0);

  const handleStop = (i: number) => {
    stopsRef.current += 1;
    const origin = { y: 0.6, x: 0.18 + i * 0.32 };
    confetti({
      particleCount: 60,
      spread: 70,
      startVelocity: 35,
      origin,
      colors: ["#C9A961", "#F5F1EA", "#ffffff"],
      ticks: 200,
    });
    if (stopsRef.current >= winners.length) {
      setTimeout(() => {
        confetti({
          particleCount: 220,
          spread: 120,
          startVelocity: 55,
          origin: { y: 0.5, x: 0.5 },
          colors: ["#C9A961", "#F5F1EA", "#ffffff"],
          ticks: 300,
        });
        onFinished(winners);
      }, 900);
    }
  };

  const labels = ["Winner 01", "Winner 02", "Winner 03"];
  const delays = [200, 1300, 2700];
  const durations = [2600, 3000, 3600];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-20">
      <div className="mb-10 text-center">
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-foreground/50">
          Drawing winners
        </div>
        <div className="mt-2 font-display text-4xl text-foreground md:text-6xl">
          The wheel of fate
        </div>
      </div>
      <div className="flex items-start gap-3 md:gap-6">
        {winners.map((w, i) => (
          <ReelColumn
            key={i}
            names={allNames}
            winner={w}
            startDelay={delays[i]}
            durationMs={durations[i]}
            label={labels[i]}
            onStop={() => handleStop(i)}
          />
        ))}
      </div>
    </div>
  );
}