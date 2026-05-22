"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface GenmojiProps {
  emoji: string;
  size?: "sm" | "md" | "lg" | "xl";
  animation?: "float" | "bounce" | "wiggle" | "spin" | "none";
  delay?: number;
  className?: string;
  interactive?: boolean;
}

const sizeMap = {
  sm: "text-2xl",
  md: "text-4xl",
  lg: "text-6xl",
  xl: "text-8xl",
};

const animationVariants = {
  float: {
    y: [0, -15, 0],
    rotate: [0, 5, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
  bounce: {
    y: [0, -20, 0],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
  wiggle: {
    rotate: [-5, 5, -5],
    transition: {
      duration: 0.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
  spin: {
    rotate: [0, 360],
    transition: {
      duration: 8,
      repeat: Infinity,
      ease: "linear",
    },
  },
  none: {},
};

export function Genmoji({
  emoji,
  size = "md",
  animation = "float",
  delay = 0,
  className = "",
  interactive = true,
}: GenmojiProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.span
      className={`inline-block cursor-pointer select-none ${sizeMap[size]} ${className}`}
      animate={animationVariants[animation]}
      initial={{ scale: 0, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      viewport={{ once: true }}
      transition={{
        delay,
        type: "spring",
        stiffness: 200,
        damping: 15,
      }}
      whileHover={
        interactive
          ? {
              scale: 1.3,
              rotate: [0, -10, 10, -10, 0],
              transition: { duration: 0.4 },
            }
          : undefined
      }
      whileTap={interactive ? { scale: 0.9 } : undefined}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      style={{
        filter: isHovered ? "drop-shadow(0 0 20px rgba(16, 185, 129, 0.5))" : "none",
      }}
    >
      {emoji}
    </motion.span>
  );
}

export function GenmojiCluster({
  emojis,
  className = "",
}: {
  emojis: { emoji: string; x: number; y: number; animation?: "float" | "bounce" | "wiggle" | "spin" | "none" }[];
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      {emojis.map((item, index) => (
        <motion.span
          key={index}
          className="absolute text-3xl cursor-pointer select-none"
          style={{ left: `${item.x}%`, top: `${item.y}%` }}
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{
            delay: index * 0.1,
            type: "spring",
            stiffness: 200,
          }}
          animate={animationVariants[item.animation || "float"]}
          whileHover={{
            scale: 1.5,
            rotate: 15,
            zIndex: 10,
          }}
        >
          {item.emoji}
        </motion.span>
      ))}
    </div>
  );
}
