import { Suspense } from "react";
import { HeroSection } from "@/components/home/hero-section";
import { AboutSection } from "@/components/home/about-section";
import { ProjectsSection } from "@/components/home/projects-section";
import { DiabetesPreview } from "@/components/diabetes/preview";
import { FinchPreview } from "@/components/finch/preview";
import { HealthPreview } from "@/components/health/preview";

export const revalidate = 300;

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto px-6 pt-28 pb-16 space-y-28">
      <HeroSection />
      <AboutSection />
      <ProjectsSection />
      <Suspense fallback={<PreviewSkeleton />}>
        <DiabetesPreview />
      </Suspense>
      <Suspense fallback={<PreviewSkeleton />}>
        <FinchPreview />
      </Suspense>
      <Suspense fallback={<PreviewSkeleton />}>
        <HealthPreview />
      </Suspense>
    </div>
  );
}

function PreviewSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card/50 p-8 animate-pulse">
      <div className="h-4 w-24 bg-secondary rounded mb-6" />
      <div className="h-16 w-48 bg-secondary rounded mb-4" />
      <div className="h-3 w-64 bg-secondary/60 rounded" />
    </div>
  );
}
