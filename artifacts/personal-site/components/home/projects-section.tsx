import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const projects = [
  {
    title: "Nightscout Dashboard",
    description: "A custom glucose monitoring dashboard with animated visualizations and real-time alerts.",
    tags: ["Next.js", "Nightscout", "React"],
    dotColor: "bg-glucose-green",
    borderAccent: "hover:border-glucose-green/40",
  },
  {
    title: "CGM Analytics",
    description: "Statistical analysis of CGM data — TIR trends, A1C estimation, and pattern detection.",
    tags: ["TypeScript", "Data Viz", "Health"],
    dotColor: "bg-glucose-blue",
    borderAccent: "hover:border-glucose-blue/40",
  },
  {
    title: "Open Source Stuff",
    description: "Various open-source contributions and personal tooling projects on GitHub.",
    tags: ["Open Source", "Community"],
    dotColor: "bg-glucose-purple",
    borderAccent: "hover:border-glucose-purple/40",
  },
];

export function ProjectsSection() {
  return (
    <section>
      <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest mb-6">
        Projects
      </h2>
      <div className="grid md:grid-cols-3 gap-4">
        {projects.map((project) => (
          <Card
            key={project.title}
            className={`transition-all duration-300 cursor-pointer group ${project.borderAccent}`}
          >
            <CardContent className="p-6">
              <div className={`w-2 h-2 rounded-full ${project.dotColor} mb-4`} />
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
        ))}
      </div>
    </section>
  );
}
