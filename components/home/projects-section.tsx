"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Genmoji } from "./genmoji";
import { ArrowRight } from "lucide-react";

const projects = [
  {
    title: "Glucose Roller Coaster",
    description:
      "An animated daily glucose visualization with physics-based car movement, carb/bolus markers, and Finch goal integration.",
    tags: ["Next.js", "Canvas API", "Nightscout"],
    href: "/diabetes",
    emoji: "🎢",
    accentColor: "text-emerald-400",
  },
  {
    title: "Health Correlations",
    description:
      "Pearson correlation analysis between mood, steps, goal completion and glucose metrics.",
    tags: ["TypeScript", "Statistics", "Data Viz"],
    href: "/diabetes",
    emoji: "📊",
    accentColor: "text-blue-400",
  },
  {
    title: "Finch Wellness",
    description:
      "Daily mood, goal completion streaks, and mental health check-ins synced from Finch via Firebase.",
    tags: ["Firebase", "Cloud Functions", "React"],
    href: "/finch",
    emoji: "🐦",
    accentColor: "text-violet-400",
  },
  {
    title: "Apple Health Pipeline",
    description:
      "Automated ingestion of steps, weight, and body composition from Apple Health into Firestore.",
    tags: ["Cloud Functions", "Firestore", "HealthKit"],
    href: "/health",
    emoji: "🏃",
    accentColor: "text-orange-400",
  },
];

export function ProjectsSection() {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex items-center gap-3 mb-8">
        <Genmoji emoji="🚀" size="md" />
        <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest">
          Projects
        </h2>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {projects.map((project, index) => (
          <motion.div
            key={project.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <Link href={project.href} className="block h-full group">
              <Card className="h-full bg-card/50 border-border/50 card-interactive hover:border-border">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <Genmoji emoji={project.emoji} size="lg" />
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  
                  <h3 className={`text-lg font-semibold mb-2 ${project.accentColor} group-hover:brightness-110 transition-all`}>
                    {project.title}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {project.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-1.5">
                    {project.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="font-mono text-xs border-border/50 text-muted-foreground"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
