import Link from "next/link";
import { connection } from "next/server";
import { type NightscoutReading } from "@/lib/nightscout";
import { glucoseColor, glucoseLabel, trendArrow, minutesAgo, fmtMmol } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getNightscoutData } from "@/lib/actions";
import { ArrowRight } from "lucide-react";

export async function DiabetesPreview() {
  await connection();
  const readings = await getNightscoutData(3);
  const latest = readings[0];

  if (!latest) return null;

  const color = glucoseColor(latest.sgv);
  const label = glucoseLabel(latest.sgv);
  const arrow = trendArrow(latest.direction);
  const ago = minutesAgo(latest.date);
  const mmol = fmtMmol(latest.sgv);

  const labelVariant =
    label === "IN RANGE" ? "success"
    : label === "LOW" || label === "URGENT LOW" ? "danger"
    : "warning";

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">📊</span>
        <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest">
          Live Glucose
        </h2>
      </div>
      <Link href="/diabetes" className="block group">
        <Card className="bg-card/50 border-border/50 card-interactive hover:border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-bold font-mono" style={{ color }}>
                  {mmol}
                </span>
                <span className="text-2xl" style={{ color }}>{arrow}</span>
                <span className="text-sm text-muted-foreground">mmol/L</span>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            
            <div className="flex items-center gap-3 mb-4">
              <Badge variant={labelVariant as "success" | "warning" | "danger"}>{label}</Badge>
              <span className="text-xs text-muted-foreground">{ago}</span>
            </div>
            
            <MiniSparkline readings={readings} />
          </CardContent>
        </Card>
      </Link>
    </section>
  );
}

function MiniSparkline({ readings }: { readings: NightscoutReading[] }) {
  if (readings.length < 2) return null;

  const sorted = [...readings].sort((a, b) => a.date - b.date);
  const values = sorted.map((r) => r.sgv);
  const min = Math.min(...values, 55);
  const max = Math.max(...values, 250);
  const range = max - min || 1;

  const w = 100;
  const h = 32;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-12">
      <rect
        x={0}
        y={h - ((180 - min) / range) * h}
        width={w}
        height={((180 - 70) / range) * h}
        fill="rgba(16, 185, 129, 0.1)"
        rx="1"
      />
      <polyline
        points={points}
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
