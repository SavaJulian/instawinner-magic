import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { Participant } from "@/hooks/useGiveawayState";

const CHECKS = [
  "Liked post",
  "Following @emimoda",
  "Tagged a friend",
  "Saved post",
  "Public account",
];

type Line = {
  id: string;
  username: string;
  checks: { label: string; ok: boolean }[];
  passed: boolean;
};

export function VerifyingFeed({
  participants,
  onDone,
}: {
  participants: Participant[];
  onDone: () => void;
}) {
  const lines = useMemo<Line[]>(() => {
    return participants.map((p) => {
      const shouldFail = !p.winner && Math.random() < 0.12;
      const failIdx = shouldFail
        ? Math.floor(Math.random() * CHECKS.length)
        : -1;
      const checks = CHECKS.map((label, i) => ({
        label,
        ok: i !== failIdx,
      }));
      return {
        id: p.id,
        username: p.username,
        checks,
        passed: !shouldFail,
      };
    });
  }, [participants]);

  const [visible, setVisible] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const total = lines.length;
    if (total === 0) {
      onDone();
      return;
    }
    const totalMs = Math.min(6500, Math.max(3500, total * 180));
    const stepMs = totalMs / total;
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setVisible(i);
      if (i >= total) {
        clearInterval(interval);
        setTimeout(onDone, 700);
      }
    }, stepMs);
    return () => clearInterval(interval);
  }, [lines.length, onDone]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [visible]);

  const passedCount = lines.slice(0, visible).filter((l) => l.passed).length;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-20">
      <div className="mb-6 text-center">
        <div className="font-mono text-xs uppercase tracking-[0.3em] text-foreground/50">
          Verifying eligibility
        </div>
        <div className="mt-2 font-display text-3xl text-foreground md:text-5xl">
          Checking participants
        </div>
        <div className="mt-3 font-mono text-sm text-[var(--gold)]">
          {passedCount} / {lines.length} eligible
        </div>
      </div>

      <div
        ref={containerRef}
        className="h-[55vh] w-full max-w-2xl overflow-hidden rounded-lg border border-foreground/10 bg-foreground/[0.02] p-4 font-mono text-[0.8rem] md:text-sm"
      >
        {lines.slice(0, visible).map((l) => (
          <motion.div
            key={l.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="mb-3 border-b border-foreground/5 pb-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-foreground/90">@{l.username}</span>
              <span
                className={
                  l.passed ? "text-[var(--gold)]" : "text-red-400/80"
                }
              >
                {l.passed ? "ELIGIBLE" : "DISQUALIFIED"}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-foreground/60">
              {l.checks.map((c, i) => (
                <span key={i} className={c.ok ? "" : "text-red-400/70"}>
                  {c.ok ? "\u2713" : "\u2717"} {c.label}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}