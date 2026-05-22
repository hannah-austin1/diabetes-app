"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Genmoji } from "./genmoji";

const floatingEmojis = [
  { emoji: "💉", x: 5, y: 10, delay: 0 },
  { emoji: "📊", x: 85, y: 15, delay: 0.2 },
  { emoji: "🎢", x: 10, y: 70, delay: 0.4 },
  { emoji: "💻", x: 90, y: 65, delay: 0.6 },
  { emoji: "🦾", x: 3, y: 40, delay: 0.8 },
  { emoji: "✨", x: 92, y: 40, delay: 1 },
];

export function HeroSection() {
  return (
    <section className="relative text-center py-12 min-h-[70vh] flex flex-col justify-center">
      {/* Floating genmojis in background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floatingEmojis.map((item, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{ left: `${item.x}%`, top: `${item.y}%` }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.6, scale: 1 }}
            transition={{ delay: item.delay, duration: 0.5 }}
          >
            <Genmoji
              emoji={item.emoji}
              size="lg"
              animation="float"
              delay={item.delay}
              interactive={false}
            />
          </motion.div>
        ))}
      </div>

      {/* Status badge */}
      <motion.div
        className="flex justify-center mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Badge variant="outline" className="gap-2 px-4 py-2 text-sm bg-card/80 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-glucose-green animate-pulse inline-block" />
          available for cool projects
        </Badge>
      </motion.div>

      {/* Main heading with genmojis */}
      <motion.div
        className="relative mb-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
      >
        <h1 className="text-6xl md:text-8xl font-black tracking-tight">
          <span className="inline-flex items-center gap-2">
            <Genmoji emoji="👋" size="lg" animation="wiggle" delay={0.5} />
          </span>
          <br />
          <span className="gradient-text">hgjaustin</span>
        </h1>
      </motion.div>

      {/* Subtitle with animated emojis */}
      <motion.div
        className="flex flex-wrap items-center justify-center gap-3 mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <span className="text-xl text-muted-foreground font-light flex items-center gap-2">
          <Genmoji emoji="💻" size="sm" animation="bounce" delay={0.4} /> Developer
        </span>
        <span className="text-muted-foreground/50">|</span>
        <span className="text-xl text-muted-foreground font-light flex items-center gap-2">
          <Genmoji emoji="🩸" size="sm" animation="bounce" delay={0.5} /> T1D Warrior
        </span>
        <span className="text-muted-foreground/50">|</span>
        <span className="text-xl text-muted-foreground font-light flex items-center gap-2">
          <Genmoji emoji="🔨" size="sm" animation="bounce" delay={0.6} /> Builder
        </span>
      </motion.div>

      {/* Description */}
      <motion.p
        className="max-w-2xl mx-auto text-lg text-muted-foreground leading-relaxed mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        I write code, manage my blood sugars, and occasionally do both at once.
        Living with Type 1 Diabetes since birth — this site has{" "}
        <span className="text-glucose-green font-medium">real-time glucose data</span> to prove it.
        <Genmoji emoji="📈" size="sm" animation="float" delay={0.7} className="ml-1" />
      </motion.p>

      {/* CTA buttons */}
      <motion.div
        className="flex flex-wrap items-center justify-center gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <Button asChild variant="glow" size="lg" className="group">
          <Link href="/diabetes" className="flex items-center gap-2">
            <Genmoji emoji="🎢" size="sm" animation="none" />
            <span>View my glucose data</span>
          </Link>
        </Button>
        <Button asChild variant="glass" size="lg">
          <a
            href="https://github.com/hannah-austin1"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            <Genmoji emoji="🐙" size="sm" animation="none" />
            <span>GitHub</span>
          </a>
        </Button>
        <Button asChild variant="glass" size="lg">
          <a
            href="https://www.linkedin.com/in/hannahaustin"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            <Genmoji emoji="💼" size="sm" animation="none" />
            <span>LinkedIn</span>
          </a>
        </Button>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-4 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 10, 0] }}
        transition={{
          opacity: { delay: 1, duration: 0.5 },
          y: { delay: 1.5, duration: 1.5, repeat: Infinity },
        }}
      >
        <Genmoji emoji="👇" size="md" animation="none" />
      </motion.div>
    </section>
  );
}
