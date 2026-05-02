const skills = [
  "TypeScript", "React", "Next.js", "Node.js", "Python",
  "PostgreSQL", "Docker", "Tailwind CSS", "Nightscout", "T1D Life",
];

export function AboutSection() {
  return (
    <section>
      <h2 className="text-sm font-mono text-gray-600 uppercase tracking-widest mb-6">
        About
      </h2>
      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div>
          <p className="text-gray-400 leading-relaxed mb-4">
            I&apos;m a developer passionate about building tools that matter. Living with
            Type 1 Diabetes has given me a unique perspective on data, health tech, and
            the power of open-source tools like Nightscout.
          </p>
          <p className="text-gray-500 leading-relaxed">
            When I&apos;m not writing code, I&apos;m watching my CGM, adjusting my basals,
            and trying to keep that roller coaster in range.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span
              key={skill}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/8 text-sm text-gray-400 font-mono"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
