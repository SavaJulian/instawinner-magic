import { motion } from "framer-motion";
import logo from "@/assets/emimoda-logo.png";

export function IntroLogo({ onDone }: { onDone: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="relative flex flex-col items-center">
        <div className="relative overflow-hidden">
          <motion.img
            src={logo}
            alt="EmiModa"
            initial={{ opacity: 0, scale: 0.7, filter: "blur(16px) brightness(0) invert(1)" }}
            animate={{
              opacity: [0, 1, 1, 1, 1],
              scale: [0.7, 1.05, 1, 1, 1],
              filter: [
                "blur(16px) brightness(0) invert(1)",
                "blur(0px) brightness(0) invert(1)",
                "blur(0px) brightness(0) invert(1)",
                "blur(0px) brightness(0) invert(1)",
                "blur(0px) brightness(0) invert(1)",
              ],
            }}
            transition={{ duration: 3.4, times: [0, 0.3, 0.55, 0.85, 1], ease: "easeOut" }}
            onAnimationComplete={onDone}
            className="w-[80vw] max-w-[900px]"
          />
          {/* Gold light sweep across the letters */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 w-1/3"
            style={{
              background:
                "linear-gradient(115deg, transparent, color-mix(in oklab, var(--gold) 60%, transparent), transparent)",
              mixBlendMode: "screen",
            }}
            initial={{ x: "-120%" }}
            animate={{ x: ["-120%", "350%"] }}
            transition={{ duration: 1.6, delay: 1.4, ease: "easeInOut" }}
          />
        </div>
        <motion.div
          className="mt-8 flex flex-col items-center gap-2 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.6 }}
        >
          <div className="font-mono text-[0.65rem] uppercase tracking-[0.45em] text-[var(--gold)]">
            Live giveaway
          </div>
          <div className="font-display text-2xl text-foreground md:text-3xl">
            Win €100 · 3 winners
          </div>
        </motion.div>
      </div>
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center, color-mix(in oklab, var(--gold) 18%, transparent) 0%, transparent 55%)",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.8, 0.4, 0] }}
        transition={{ duration: 3.4, times: [0, 0.4, 0.75, 1] }}
      />
    </motion.div>
  );
}