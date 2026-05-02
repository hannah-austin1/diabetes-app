import { Badge } from "@/components/ui/badge";

const skills = [
  "TypeScript", "React", "Next.js", "Node.js", "Python",
  "PostgreSQL", "Docker", "Tailwind CSS", "Nightscout", "T1D Life",
];

export function AboutSection() {
  return (
    <section>
      <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest mb-6">
        About
      </h2>
      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div>
          <p className="text-muted-foreground leading-relaxed mb-4">
            I&apos;m a developer passionate about building tools that matter. Living with
            Type 1 Diabetes has given me a unique perspective on data, health tech, and
            the power of open-source tools like Nightscout.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            When I&apos;m not writing code, I&apos;m watching my CGM, adjusting my basals,
            and trying to keep that roller coaster in range.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <Badge key={skill} variant="outline" className="font-mono">
              {skill}
            </Badge>
          ))}
        </div>
      </div>
    </section>
  );
}
