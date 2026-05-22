"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Genmoji } from "./genmoji";

export function HeroSection() {
  return (
    <section className="relative text-center py-16 min-h-[75vh] flex flex-col justify-center">
      {/* Status badge */}
      <motion.div
        className="flex justify-center mb-10"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Badge variant="outline" className="gap-2 px-4 py-2 text-sm bg-card/50 backdrop-blur-sm border-border/50">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse inline-block" />
          available for projects
        </Badge>
      </motion.div>

      {/* Main heading */}
      <motion.div
        className="relative mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight">
          <span className="text-foreground/90">Hey, I&apos;m</span>
          <br />
          <span className="gradient-text">Hannah Austin</span>
        </h1>
      </motion.div>

      {/* Subtitle */}
      <motion.div
        className="flex flex-wrap items-center justify-center gap-4 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <span className="text-lg text-muted-foreground flex items-center gap-2">
          <Genmoji emoji="💻" size="sm" /> Developer
        </span>
        <span className="text-muted-foreground/30">|</span>
        <span className="text-lg text-muted-foreground flex items-center gap-2">
          <Genmoji emoji="🩸" size="sm" /> T1D Warrior
        </span>
        <span className="text-muted-foreground/30">|</span>
        <span className="text-lg text-muted-foreground flex items-center gap-2">
          <Genmoji emoji="🛠️" size="sm" /> Builder
        </span>
      </motion.div>

      {/* Description */}
      <motion.p
        className="max-w-xl mx-auto text-muted-foreground leading-relaxed mb-12"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        I build things with code and manage my blood sugars — sometimes at the same time.
        Living with Type 1 Diabetes since birth, this site features{" "}
        <span className="text-primary font-medium">real-time glucose data</span> from my CGM.
      </motion.p>

      {/* CTA buttons */}
      <motion.div
        className="flex flex-wrap items-center justify-center gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <Button asChild size="lg" className="gap-2">
          <Link href="/diabetes">
            <Genmoji emoji="📊" size="sm" interactive={false} />
            View Glucose Data
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="gap-2">
          <a href="https://github.com/hannah-austin1" target="_blank" rel="noopener noreferrer">
            <Genmoji emoji="🐙" size="sm" interactive={false} />
            GitHub
          </a>
        </Button>
        <Button asChild variant="outline" size="lg" className="gap-2">
          <a href="https://www.linkedin.com/in/hannahaustin" target="_blank" rel="noopener noreferrer">
            <Genmoji emoji="💼" size="sm" interactive={false} />
            LinkedIn
          </a>
        </Button>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-muted-foreground/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </motion.div>
      </motion.div>
    </section>
  );
}
