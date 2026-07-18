"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Genmoji } from "@/components/shared/genmoji";
import homeData from "@/data/home.json";

const { hero } = homeData;

export function HeroSection() {
  return (
    <section className="relative text-center py-16 min-h-[75vh] flex flex-col justify-center">
      {/* Main heading */}
      <motion.div
        className="relative mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight">
          <span className="text-foreground/90">{hero.greeting}</span>
          <br />
          <span className="gradient-text">{hero.name}</span>
        </h1>
      </motion.div>

      {/* Subtitle */}
      <motion.div
        className="flex flex-wrap items-center justify-center gap-4 mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        {hero.roles.map((role, index) => (
          <span key={role.label}>
            {index > 0 && <span className="text-muted-foreground/30 mr-4">|</span>}
            <span className="text-lg text-muted-foreground inline-flex items-center gap-2">
              <Genmoji emoji={role.emoji} size="sm" />
              {role.label}
            </span>
          </span>
        ))}
      </motion.div>

      {/* Description */}
      <motion.p
        className="max-w-xl mx-auto text-muted-foreground leading-relaxed mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        {hero.description.before}
        <span className="text-primary font-medium">{hero.description.highlight}</span>
        {hero.description.after}
      </motion.p>

      {/* CTA buttons */}
      <motion.div
        className="flex flex-wrap items-center justify-center gap-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        {hero.cta.map((button) => (
          <Button
            key={button.label}
            asChild
            size="lg"
            variant={button.variant as "default" | "outline"}
            className="gap-2"
          >
            {button.external ? (
              <a href={button.href} target="_blank" rel="noopener noreferrer">
                <Genmoji emoji={button.emoji} size="sm" interactive={false} />
                {button.label}
              </a>
            ) : (
              <Link href={button.href}>
                <Genmoji emoji={button.emoji} size="sm" interactive={false} />
                {button.label}
              </Link>
            )}
          </Button>
        ))}
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-2 left-1/2 -translate-x-1/2 text-muted-foreground/50"
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
