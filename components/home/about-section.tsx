"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Genmoji } from "./genmoji";

const skills = [
  { name: "TypeScript", emoji: "🔷" },
  { name: "React", emoji: "⚛️" },
  { name: "Next.js", emoji: "▲" },
  { name: "Node.js", emoji: "🟢" },
  { name: "Python", emoji: "🐍" },
  { name: "PostgreSQL", emoji: "🐘" },
  { name: "Docker", emoji: "🐳" },
  { name: "Tailwind", emoji: "🎨" },
  { name: "Nightscout", emoji: "🌙" },
  { name: "T1D Life", emoji: "💉" },
];

const stats = [
  { emoji: "💉", label: "Years with T1D", value: "25+" },
  { emoji: "📊", label: "Daily readings", value: "288" },
  { emoji: "☕", label: "Coffees consumed", value: "∞" },
  { emoji: "🚀", label: "Projects shipped", value: "10+" },
];

export function AboutSection() {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex items-center gap-3 mb-8">
        <Genmoji emoji="👤" size="md" />
        <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest">
          About
        </h2>
      </div>

      <div className="grid md:grid-cols-2 gap-10 items-start">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <p className="text-lg text-muted-foreground leading-relaxed mb-4">
            {"I'm a developer who builds tools that matter. Living with "}
            <span className="text-primary font-medium">Type 1 Diabetes</span>
            {" has shaped how I think about data, health tech, and open-source tools like Nightscout."}
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {"When I'm not coding, I'm watching my CGM, adjusting basals, and keeping that line "}
            <span className="text-primary font-medium">in range</span>.
          </p>
        </motion.div>

        <motion.div
          className="flex flex-wrap gap-2"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {skills.map((skill, index) => (
            <motion.div
              key={skill.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Badge
                variant="secondary"
                className="font-mono text-sm px-3 py-1.5 bg-secondary/50 hover:bg-secondary transition-colors cursor-default"
              >
                <span className="mr-1.5">{skill.emoji}</span>
                {skill.name}
              </Badge>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Stats */}
      <motion.div
        className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-card/50 rounded-xl p-5 text-center border border-border/50 card-interactive"
          >
            <Genmoji emoji={stat.emoji} size="lg" />
            <div className="text-2xl font-bold text-foreground mt-2">{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
          </div>
        ))}
      </motion.div>
    </motion.section>
  );
}
