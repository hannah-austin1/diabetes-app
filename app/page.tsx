import { HeroSection } from "@/components/home/hero-section";
import { AboutSection } from "@/components/home/about-section";
import { ProjectsSection } from "@/components/home/projects-section";

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto px-6 pt-28 pb-16 space-y-6">
      <HeroSection />
      <AboutSection />
      <ProjectsSection />
    </div>
  );
}

function PreviewSkeleton({ emoji }: { emoji: string }) {
  return (
    <div className="rounded-2xl border-2 border-border bg-card p-8 animate-pulse">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">{emoji}</span>
        <div className="h-4 w-24 bg-secondary rounded" />
      </div>
      <div className="space-y-4">
        <div className="h-16 w-48 bg-secondary rounded-xl" />
        <div className="h-3 w-64 bg-secondary/60 rounded" />
        <div className="h-12 w-full bg-secondary/40 rounded-lg" />
      </div>
    </div>
  );
}
