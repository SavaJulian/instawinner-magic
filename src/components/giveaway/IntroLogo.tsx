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
      <motion.img
        src={logo}
        alt="EmiModa"
        initial={{ opacity: 0, scale: 0.7, filter: "blur(16px)" }}
        animate={{
          opacity: [0, 1, 1, 1],
          scale: [0.7, 1.05, 1, 1],
          filter: ["blur(16px)", "blur(0px)", "blur(0px)", "blur(0px)"],
        }}
        transition={{ duration: 2.4, times: [0, 0.45, 0.7, 1], ease: "easeOut" }}
        onAnimationComplete={onDone}
        className="h-44 w-auto md:h-64"
      />
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center, color-mix(in oklab, var(--gold) 18%, transparent) 0%, transparent 55%)",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.8, 0] }}
        transition={{ duration: 2.4, times: [0, 0.5, 1] }}
      />
    </motion.div>
  );
}