"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Genmoji } from "./genmoji";

const projects = [
  {
    title: "Glucose Roller Coaster",
    description:
      "An animated daily glucose visualization with physics-based car movement, carb/bolus markers, and Finch goal integration.",
    tags: ["Next.js", "Canvas API", "Nightscout"],
    href: "/diabetes",
    emoji: "🎢",
    color: "glucose-green",
    gradient: "from-emerald-500/20 to-teal-500/20",
  },
  {
    title: "Health Correlations",
    description:
      "Pearson correlation analysis between mood, steps, goal completion and glucose metrics — finding what actually moves the needle.",
    tags: ["TypeScript", "Statistics", "Data Viz"],
    href: "/diabetes",
    emoji: "📊",
    color: "glucose-blue",
    gradient: "from-blue-500/20 to-cyan-500/20",
  },
  {
    title: "Finch Wellness",
    description:
      "Daily mood, goal completion streaks, and mental health check-ins — synced from the Finch app via Firebase.",
    tags: ["Firebase", "Cloud Functions", "React"],
    href: "/finch",
    emoji: "🐦",
    color: "glucose-purple",
    gradient: "from-purple-500/20 to-pink-500/20",
  },
  {
    title: "Apple Health Pipeline",
    description:
      "Automated ingestion of steps, weight, and body composition from Apple Health into Firestore with daily rollups.",
    tags: ["Cloud Functions", "Firestore", "HealthKit"],
    href: "/health",
    emoji: "🏃",
    color: "glucose-orange",
    gradient: "from-orange-500/20 to-amber-500/20",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
};

export function ProjectsSection() {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex items-center gap-3 mb-8">
        <Genmoji emoji="🚀" size="md" animation="bounce" />
        <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest">
          Projects
        </h2>
      </div>

      <motion.div
        className="grid md:grid-cols-2 gap-6"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
      >
        {projects.map((project, index) => (
          <motion.div key={project.title} variants={cardVariants}>
            <Link href={project.href} className="block h-full">
              <Card className="h-full overflow-hidden group card-interactive border-2 border-transparent hover:border-primary/20">
                <CardContent className="p-0">
                  {/* Gradient header */}
                  <div className={`bg-gradient-to-br ${project.gradient} p-6 relative overflow-hidden`}>
                    <div className="absolute top-2 right-2 opacity-20 group-hover:opacity-40 transition-opacity">
                      <Genmoji
                        emoji={project.emoji}
                        size="xl"
                        animation="float"
                        delay={index * 0.1}
                        interactive={false}
                      />
                    </div>
                    <div className="relative z-10">
                      <motion.div
                        className="inline-block mb-3"
                        whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                        transition={{ duration: 0.4 }}
                      >
                        <Genmoji emoji={project.emoji} size="lg" animation="none" />
                      </motion.div>
                      <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                        {project.title}
                      </h3>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 bg-card">
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      {project.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="font-mono text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    {/* Hover arrow */}
                    <motion.div
                      className="mt-4 flex items-center gap-2 text-sm text-muted-foreground group-hover:text-primary transition-colors"
                      initial={{ x: 0 }}
                      whileHover={{ x: 5 }}
                    >
                      <span>View project</span>
                      <Genmoji emoji="👉" size="sm" animation="none" />
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  );
}
