import { HeroSection } from "@/components/home/hero-section";
import { AboutSection } from "@/components/home/about-section";
import { ProjectsSection } from "@/components/home/projects-section";
import { DiabetesPreview } from "@/components/diabetes/preview";
import { FinchPreview } from "@/components/finch/preview";
import { HealthPreview } from "@/components/health/preview";

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto px-6 pt-28 pb-16 space-y-28">
      <HeroSection />
      <AboutSection />
      <ProjectsSection />
      <DiabetesPreview />
      <FinchPreview />
      <HealthPreview />
    </div>
  );
}
