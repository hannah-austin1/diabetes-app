import { HeroSection } from "@/components/hero-section";
import { AboutSection } from "@/components/about-section";
import { ProjectsSection } from "@/components/projects-section";
import { DiabetesPreview } from "@/components/diabetes-preview";

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto px-6 pt-28 pb-16 space-y-28">
      <HeroSection />
      <AboutSection />
      <ProjectsSection />
      <DiabetesPreview />
    </div>
  );
}
