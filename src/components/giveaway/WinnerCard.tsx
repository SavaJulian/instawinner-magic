import { motion } from "framer-motion";
import logo from "@/assets/emimoda-logo.png";

export function WinnerCard({
  winners,
  onReset,
}: {
  winners: string[];
  onReset: () => void;
}) {
  return (
    <div className="flex w-full flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--gold)]/40 bg-foreground/[0.02] px-6 py-10 text-center"
        style={{
          boxShadow:
            "0 0 120px -20px color-mix(in oklab, var(--gold) 50%, transparent)",
        }}
      >
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2"
          style={{
            background:
              "linear-gradient(115deg, transparent, color-mix(in oklab, var(--gold) 30%, transparent), transparent)",
          }}
          animate={{ x: ["0%", "300%"] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        />

        <img
          src={logo}
          alt="EmiModa"
          className="mx-auto w-[55%] max-w-[300px]"
          style={{ filter: "brightness(0) invert(1)" }}
        />
        <h2
          className="mt-6 font-display text-4xl text-foreground md:text-5xl"
          style={{
            textShadow:
              "0 0 30px color-mix(in oklab, var(--gold) 50%, transparent)",
          }}
        >
          Our 3 winners
        </h2>

        <div className="mt-7 flex flex-col gap-3">
          {winners.map((w, i) => (
            <motion.div
              key={w + i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.25, duration: 0.5 }}
              className="flex items-center justify-between gap-4 rounded-lg border border-[var(--gold)]/30 bg-foreground/[0.03] px-5 py-4"
              style={{
                boxShadow:
                  "inset 0 0 30px -10px color-mix(in oklab, var(--gold) 40%, transparent)",
              }}
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-[0.6rem] uppercase tracking-[0.3em] text-[var(--gold)]">
                  0{i + 1}
                </span>
                <span className="font-display text-2xl text-foreground md:text-3xl">
                  @{w}
                </span>
              </div>
              <span
                className="rounded-lg px-5 py-2 font-display text-2xl md:text-3xl"
                style={{
                  background: "var(--gold)",
                  color: "#000",
                  boxShadow:
                    "0 0 30px color-mix(in oklab, var(--gold) 70%, transparent)",
                }}
              >
                €100
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <button
        onClick={onReset}
        className="mt-6 font-mono text-xs uppercase tracking-[0.3em] text-foreground/40 transition hover:text-foreground"
      >
        Reset (R)
      </button>
    </div>
  );
}