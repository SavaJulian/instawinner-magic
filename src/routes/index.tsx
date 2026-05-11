import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGiveawayState } from "@/hooks/useGiveawayState";
import { ParticipantEditor } from "@/components/giveaway/ParticipantEditor";
import { IntroLogo } from "@/components/giveaway/IntroLogo";
import { SpinningWheel } from "@/components/giveaway/SpinningWheel";
import { WinnerCard } from "@/components/giveaway/WinnerCard";
import { LogoWatermark } from "@/components/giveaway/LogoWatermark";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const g = useGiveawayState();
  const [finalWinners, setFinalWinners] = useState<string[]>([]);
  const allNames = useMemo(
    () => g.participants.map((p) => p.username),
    [g.participants],
  );
  const startedRef = useRef(false);

  // Keyboard: Space spins from ready, R resets
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement) {
        const tag = e.target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
      }
      if (e.code === "Space" && g.phase === "ready") {
        e.preventDefault();
        g.setPhase("spinning");
      }
      if ((e.key === "r" || e.key === "R") && !e.shiftKey) {
        if (g.phase !== "setup") {
          g.reset();
          setFinalWinners([]);
          startedRef.current = false;
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [g]);

  // When entering intro phase, freeze the winner list
  useEffect(() => {
    if (g.phase === "intro" && !startedRef.current) {
      startedRef.current = true;
      setFinalWinners(g.computeFinalWinners());
    }
    if (g.phase === "setup") {
      startedRef.current = false;
    }
  }, [g.phase, g.computeFinalWinners]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* persistent subtle background glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at 50% 120%, color-mix(in oklab, var(--gold) 12%, transparent), transparent 60%)",
        }}
      />

      {g.phase !== "setup" && g.phase !== "intro" && <LogoWatermark />}

      <AnimatePresence mode="wait">
        {g.phase === "setup" && g.loaded && (
          <motion.div
            key="setup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ParticipantEditor
              participants={g.participants}
              addUsernames={g.addUsernames}
              removeParticipant={g.removeParticipant}
              clearAll={g.clearAll}
              toggleWinner={g.toggleWinner}
              onStart={g.start}
            />
          </motion.div>
        )}

        {g.phase === "intro" && (
          <IntroLogo
            key="intro"
            onDone={() => {
              setTimeout(() => g.setPhase("ready"), 500);
            }}
          />
        )}

        {g.phase === "ready" && (
          <motion.div
            key="ready"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
          >
            <div className="font-mono text-xs uppercase tracking-[0.3em] text-foreground/50">
              Eligibility complete
            </div>
            <h2 className="mt-3 font-display text-5xl text-foreground md:text-7xl">
              Ready to draw
            </h2>
            <motion.button
              onClick={() => g.setPhase("spinning")}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="mt-10 rounded-full bg-[var(--gold)] px-10 py-5 font-display text-2xl text-[var(--gold-foreground)]"
              style={{
                boxShadow:
                  "0 0 80px -10px color-mix(in oklab, var(--gold) 70%, transparent)",
              }}
            >
              SPIN
            </motion.button>
            <p className="mt-6 font-mono text-[0.65rem] uppercase tracking-[0.3em] text-foreground/30">
              or press Space
            </p>
          </motion.div>
        )}

        {g.phase === "spinning" && (
          <motion.div
            key="spinning"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <SpinningWheel
              allNames={allNames}
              winners={finalWinners}
              onFinished={(w: string[]) => {
                g.setRevealedWinners(w);
                g.setPhase("revealed");
              }}
            />
          </motion.div>
        )}

        {g.phase === "revealed" && (
          <motion.div
            key="revealed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <WinnerCard
              winners={g.revealedWinners}
              onReset={() => {
                g.reset();
                setFinalWinners([]);
                startedRef.current = false;
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
