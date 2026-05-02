export function HeroSection() {
  return (
    <section className="text-center py-8">
      {/* Avatar / badge */}
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-gray-400 mb-8">
        <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
        available for cool projects
      </div>

      {/* Name */}
      <h1 className="text-6xl md:text-7xl font-black tracking-tight mb-4">
        <span className="gradient-text">hgjaustin</span>
      </h1>

      {/* Title */}
      <p className="text-xl text-gray-400 mb-6 font-light">
        Developer · T1D Warrior · Builder of Things
      </p>

      {/* Description */}
      <p className="max-w-xl mx-auto text-gray-500 leading-relaxed mb-10">
        I write code, manage my blood sugars, and occasionally do both at once.
        Living with Type 1 Diabetes since birth — this site has real-time glucose
        data to prove it.
      </p>

      {/* CTA buttons */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        <a
          href="/diabetes"
          className="px-6 py-3 bg-accent-green/10 border border-accent-green/30 text-accent-green rounded-xl font-medium hover:bg-accent-green/20 transition-all duration-200 text-sm"
        >
          View my glucose data
        </a>
        <a
          href="https://github.com/hgjaustin"
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 bg-white/5 border border-white/10 text-gray-300 rounded-xl font-medium hover:bg-white/10 hover:text-white transition-all duration-200 text-sm"
        >
          GitHub
        </a>
      </div>
    </section>
  );
}
