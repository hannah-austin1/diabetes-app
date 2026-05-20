import Link from "next/link";
import { connection } from "next/server";
import { type NightscoutReading } from "@/lib/nightscout";
import { glucoseColor, glucoseLabel, trendArrow, minutesAgo, fmtMmol } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getNightscoutData } from "@/lib/actions";

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
      <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest mb-6">
        Live Glucose
      </h2>
      <Link href="/diabetes" className="block">
        <Card className="hover:border-border/80 hover:bg-card/80 transition-all duration-300 group cursor-pointer">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-6xl font-black font-mono" style={{ color }}>
                    {mmol}
                  </span>
                  <span className="text-3xl font-bold" style={{ color }}>{arrow}</span>
                  <span className="text-sm text-muted-foreground self-end mb-1">mmol/L</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={labelVariant as "success" | "warning" | "danger"}>{label}</Badge>
                  <span className="text-xs text-muted-foreground">{ago}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground mb-2 group-hover:text-foreground transition-colors">
                  View full dashboard →
                </div>
                <div className="text-xs text-muted-foreground font-mono">24h roller coaster</div>
              </div>
            </div>
            <div className="mt-6">
              <MiniSparkline readings={readings} />
            </div>
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
  const h = 40;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-12">
        <rect
          x={0}
          y={h - ((180 - min) / range) * h}
          width={w}
          height={((180 - 70) / range) * h}
          fill="rgba(34, 197, 94, 0.06)"
        />
        <polyline
          points={points}
          fill="none"
          stroke="rgba(79,142,247,0.7)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
