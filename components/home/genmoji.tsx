"use client";

import { motion } from "framer-motion";

interface GenmojiProps {
  emoji: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  interactive?: boolean;
}

const sizeMap = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-4xl",
  xl: "text-6xl",
};

export function Genmoji({
  emoji,
  size = "md",
  className = "",
  interactive = true,
}: GenmojiProps) {
  return (
    <motion.span
      className={`inline-block select-none ${sizeMap[size]} ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={interactive ? { scale: 1.1 } : undefined}
    >
      {emoji}
    </motion.span>
  );
}
