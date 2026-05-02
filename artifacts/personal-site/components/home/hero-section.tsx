import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function HeroSection() {
  return (
    <section className="text-center py-8">
      <div className="flex justify-center mb-8">
        <Badge variant="outline" className="gap-2 px-4 py-2 text-sm">
          <span className="w-2 h-2 rounded-full bg-glucose-green animate-pulse inline-block" />
          available for cool projects
        </Badge>
      </div>

      <h1 className="text-6xl md:text-7xl font-black tracking-tight mb-4">
        <span className="gradient-text">hgjaustin</span>
      </h1>

      <p className="text-xl text-muted-foreground mb-6 font-light">
        Developer · T1D Warrior · Builder of Things
      </p>

      <p className="max-w-xl mx-auto text-muted-foreground leading-relaxed mb-10">
        I write code, manage my blood sugars, and occasionally do both at once.
        Living with Type 1 Diabetes since birth — this site has real-time glucose
        data to prove it.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Button asChild variant="glow" size="lg">
          <Link href="/diabetes">View my glucose data</Link>
        </Button>
        <Button asChild variant="glass" size="lg">
          <a href="https://github.com/hgjaustin" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </Button>
      </div>
    </section>
  );
}
