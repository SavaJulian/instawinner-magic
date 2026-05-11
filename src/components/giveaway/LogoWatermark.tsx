import { motion } from "framer-motion";
import logo from "@/assets/emimoda-logo.png";

export function LogoWatermark() {
  return (
    <motion.img
      src={logo}
      alt="EmiModa"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 0.85, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="pointer-events-none fixed left-5 top-5 z-40 h-10 w-auto select-none md:h-12"
    />
  );
}