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
  { name: "Tailwind CSS", emoji: "🎨" },
  { name: "Nightscout", emoji: "🌙" },
  { name: "T1D Life", emoji: "💉" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.8 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 15,
    },
  },
};

export function AboutSection() {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <Genmoji emoji="🧑‍💻" size="md" animation="bounce" />
        <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest">
          About Me
        </h2>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <p className="text-lg text-muted-foreground leading-relaxed mb-4">
            <Genmoji emoji="👋" size="sm" animation="wiggle" className="mr-1" />
            {"I'm a developer passionate about building tools that matter. Living with "}
            <span className="text-glucose-green font-medium">Type 1 Diabetes</span>
            {" has given me a unique perspective on data, health tech, and the power of open-source tools like Nightscout."}
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed">
            <Genmoji emoji="🎢" size="sm" animation="float" className="mr-1" />
            {"When I'm not writing code, I'm watching my CGM, adjusting my basals, and trying to keep that roller coaster "}
            <span className="text-glucose-green font-medium">in range</span>.
          </p>
        </motion.div>

        <motion.div
          className="flex flex-wrap gap-2"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {skills.map((skill, index) => (
            <motion.div key={skill.name} variants={itemVariants}>
              <Badge
                variant="outline"
                className="font-mono text-sm px-3 py-1.5 bg-card hover:bg-secondary transition-colors cursor-default group"
              >
                <span className="mr-1.5 group-hover:scale-125 transition-transform inline-block">
                  {skill.emoji}
                </span>
                {skill.name}
              </Badge>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Fun stats */}
      <motion.div
        className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        {[
          { emoji: "💉", label: "Years with T1D", value: "25+" },
          { emoji: "📊", label: "Daily glucose checks", value: "288" },
          { emoji: "☕", label: "Coffees coded with", value: "∞" },
          { emoji: "🚀", label: "Projects shipped", value: "10+" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            className="bg-card rounded-xl p-4 text-center border border-border card-interactive"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Genmoji emoji={stat.emoji} size="lg" animation="bounce" delay={i * 0.1} />
            <div className="text-2xl font-black gradient-text mt-2">{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  );
}
