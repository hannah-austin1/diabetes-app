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

  const moodEmoji = 
    label === "IN RANGE" ? "😊" 
    : label === "LOW" || label === "URGENT LOW" ? "😰"
    : "😅";

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">🩸</span>
        <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest">
          Live Glucose
        </h2>
      </div>
      <Link href="/diabetes" className="block">
        <Card className="hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group cursor-pointer card-interactive overflow-hidden">
          <CardContent className="p-0">
            {/* Gradient header based on glucose status */}
            <div className={`p-6 bg-gradient-to-br ${
              label === "IN RANGE" 
                ? "from-emerald-500/10 to-teal-500/10" 
                : label === "LOW" || label === "URGENT LOW"
                ? "from-orange-500/10 to-red-500/10"
                : "from-amber-500/10 to-orange-500/10"
            }`}>
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
                <div className="text-right flex flex-col items-end gap-2">
                  <span className="text-5xl">{moodEmoji}</span>
                  <div className="text-sm text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                    <span>View dashboard</span>
                    <span className="group-hover:translate-x-1 transition-transform">👉</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Sparkline */}
            <div className="p-6 bg-card">
              <MiniSparkline readings={readings} />
              <div className="mt-3 text-xs text-muted-foreground font-mono text-center">
                🎢 24h roller coaster visualization
              </div>
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
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-16">
        {/* In-range zone */}
        <rect
          x={0}
          y={h - ((180 - min) / range) * h}
          width={w}
          height={((180 - 70) / range) * h}
          fill="rgba(16, 185, 129, 0.08)"
          rx="2"
        />
        {/* Gradient line */}
        <defs>
          <linearGradient id="glucoseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <polyline
          points={points}
          fill="none"
          stroke="url(#glucoseGradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
