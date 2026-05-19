import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const projects = [
  {
    title: "Glucose Roller Coaster",
    description:
      "An animated daily glucose visualization with physics-based car movement, carb/bolus markers, and Finch goal integration.",
    tags: ["Next.js", "Canvas API", "Nightscout"],
    href: "/diabetes",
    dotColor: "bg-glucose-green",
    borderAccent: "hover:border-glucose-green/40",
    emoji: "🎢",
  },
  {
    title: "Health × Glucose Correlations",
    description:
      "Pearson correlation analysis between mood, steps, goal completion and glucose metrics — finding what actually moves the needle.",
    tags: ["TypeScript", "Statistics", "Data Viz"],
    href: "/diabetes",
    dotColor: "bg-glucose-blue",
    borderAccent: "hover:border-glucose-blue/40",
    emoji: "📊",
  },
  {
    title: "Finch Wellness Tracker",
    description:
      "Daily mood, goal completion streaks, and mental health check-ins — synced from the Finch app via Firebase.",
    tags: ["Firebase", "Cloud Functions", "React"],
    href: "/finch",
    dotColor: "bg-glucose-purple",
    borderAccent: "hover:border-glucose-purple/40",
    emoji: "🐦",
  },
  {
    title: "Apple Health Pipeline",
    description:
      "Automated ingestion of steps, weight, and body composition from Apple Health into Firestore with daily rollups.",
    tags: ["Cloud Functions", "Firestore", "HealthKit"],
    href: "/health",
    dotColor: "bg-glucose-orange",
    borderAccent: "hover:border-glucose-orange/40",
    emoji: "🏃",
  },
];

export function ProjectsSection() {
  return (
    <section>
      <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest mb-6">
        Projects
      </h2>
      <div className="grid md:grid-cols-2 gap-4">
        {projects.map((project) => (
          <Link key={project.title} href={project.href}>
            <Card
              className={`transition-all duration-300 cursor-pointer group h-full ${project.borderAccent}`}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xl">{project.emoji}</span>
                  <div className={`w-2 h-2 rounded-full ${project.dotColor}`} />
                </div>
                <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {project.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {project.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="font-mono text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
