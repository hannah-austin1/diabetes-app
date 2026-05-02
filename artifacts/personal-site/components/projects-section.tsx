const projects = [
  {
    title: "Nightscout Dashboard",
    description: "A custom glucose monitoring dashboard with animated visualizations and real-time alerts.",
    tags: ["Next.js", "Nightscout", "React"],
    color: "border-accent-green/30 hover:border-accent-green/60",
    dot: "bg-accent-green",
  },
  {
    title: "CGM Analytics",
    description: "Statistical analysis of CGM data — TIR trends, A1C estimation, and pattern detection.",
    tags: ["TypeScript", "Data Viz", "Health"],
    color: "border-accent-blue/30 hover:border-accent-blue/60",
    dot: "bg-accent-blue",
  },
  {
    title: "Open Source Stuff",
    description: "Various open-source contributions and personal tooling projects on GitHub.",
    tags: ["Open Source", "Community"],
    color: "border-accent-purple/30 hover:border-accent-purple/60",
    dot: "bg-accent-purple",
  },
];

export function ProjectsSection() {
  return (
    <section>
      <h2 className="text-sm font-mono text-gray-600 uppercase tracking-widest mb-6">
        Projects
      </h2>
      <div className="grid md:grid-cols-3 gap-4">
        {projects.map((project) => (
          <div
            key={project.title}
            className={`card-glass p-6 border transition-all duration-300 cursor-pointer group ${project.color}`}
          >
            <div className={`w-2 h-2 rounded-full ${project.dot} mb-4`} />
            <h3 className="font-semibold text-white mb-2 group-hover:text-white">
              {project.title}
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-4">
              {project.description}
            </p>
            <div className="flex flex-wrap gap-1">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded bg-white/5 text-gray-600 font-mono"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
