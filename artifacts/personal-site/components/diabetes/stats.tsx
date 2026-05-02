import Link from "next/link";
import type { NightscoutReading, NightscoutStats } from "@/lib/nightscout";
import { glucoseColor, glucoseLabel, trendArrow, minutesAgo, fmtMmol, toMmol, a1cLabel } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export function DiabetesStats({
  readings,
  stats,
}: {
  readings: NightscoutReading[];
  stats: NightscoutStats;
}) {
  const latest = readings[0];
  const color = latest ? glucoseColor(latest.sgv) : "#22c55e";
  const label = latest ? glucoseLabel(latest.sgv) : "—";
  const arrow = trendArrow(stats.currentTrend);
  const ago = stats.currentDate ? minutesAgo(stats.currentDate) : "—";
  const mmol = stats.currentSgv ? fmtMmol(stats.currentSgv) : "—";
  const avgMmol = stats.avgGlucose ? toMmol(stats.avgGlucose).toFixed(1) : "—";
  const { label: a1cCat, color: a1cColor } = a1cLabel(stats.a1c);

  const labelVariant =
    label === "IN RANGE" ? "success"
    : label === "LOW" || label === "URGENT LOW" ? "danger"
    : "warning";

  return (
    <div className="space-y-4">
      {/* Row 1: current BG + key metrics */}
      <Card style={{ borderColor: `${color}33` }}>
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
            {/* Big glucose number */}
            <div className="shrink-0">
              <p className="text-xs font-mono text-muted-foreground mb-3 uppercase tracking-widest">
                Current Glucose
              </p>
              <div className="flex items-baseline gap-4">
                <span
                  className="text-8xl font-black font-mono leading-none"
                  style={{ color, textShadow: `0 0 40px ${color}60` }}
                >
                  {mmol}
                </span>
                <div>
                  <div className="text-4xl font-bold" style={{ color }}>{arrow}</div>
                  <div className="text-sm text-muted-foreground mt-1">mmol/L</div>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <Badge variant={labelVariant as "success" | "warning" | "danger"}>{label}</Badge>
                <span className="text-sm text-muted-foreground">{ago}</span>
              </div>
            </div>

            {/* Key metrics */}
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* A1C */}
              <div
                className="rounded-xl p-4 text-center border"
                style={{ backgroundColor: `${a1cColor}0d`, borderColor: `${a1cColor}30` }}
              >
                <p className="text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">Est. A1C</p>
                <div
                  className="text-4xl font-black font-mono leading-none mb-1"
                  style={{ color: a1cColor, textShadow: `0 0 20px ${a1cColor}60` }}
                >
                  {stats.a1c > 0 ? stats.a1c.toFixed(1) : "—"}
                  <span className="text-xl font-semibold">%</span>
                </div>
                <div
                  className="text-xs font-bold px-2 py-0.5 rounded-full inline-block mt-1"
                  style={{ color: a1cColor, backgroundColor: `${a1cColor}20` }}
                >
                  {a1cCat}
                </div>
              </div>

              {/* TIR */}
              <div className="rounded-xl p-4 text-center bg-glucose-green/5 border border-glucose-green/20">
                <p className="text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">Time in Range</p>
                <div className="text-4xl font-black font-mono text-glucose-green leading-none mb-1">
                  {stats.timeInRange > 0 ? stats.timeInRange : "—"}
                  <span className="text-xl font-semibold">%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">3.9–10.0 mmol/L</p>
              </div>

              {/* 90-day avg */}
              <div className="rounded-xl p-4 text-center bg-secondary border border-border">
                <p className="text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">90d Avg</p>
                <div className="text-4xl font-black font-mono text-foreground leading-none mb-1">
                  {avgMmol}
                </div>
                <p className="text-xs text-muted-foreground mt-1">mmol/L mean</p>
              </div>

              {/* Variability */}
              <div className="rounded-xl p-4 text-center bg-glucose-purple/5 border border-glucose-purple/20">
                <p className="text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">Variability</p>
                <div className="text-4xl font-black font-mono text-glucose-purple leading-none mb-1">
                  {stats.stdDev > 0 ? toMmol(stats.stdDev).toFixed(1) : "—"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">std dev mmol/L</p>
              </div>
            </div>
          </div>

          {/* A1C scale meter */}
          {stats.a1c > 0 && (
            <div className="mt-6 pt-6 border-t border-border">
              <A1CMeter a1c={stats.a1c} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Row 2: TIR bars + weekly link */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-1">
              <p className="text-xs font-mono text-muted-foreground mb-4 uppercase tracking-widest">
                Time Distribution (48h)
              </p>
              <div className="space-y-3">
                <TirBar label="IN RANGE (3.9–10.0 mmol/L)" pct={stats.timeInRange} color="#22c55e" />
                <TirBar label="ABOVE (>10.0 mmol/L)" pct={stats.timeAbove} color="#eab308" />
                <TirBar label="BELOW (<3.9 mmol/L)" pct={stats.timeBelow} color="#f97316" />
              </div>
            </div>

            <Link
              href="/diabetes/weekly"
              className="shrink-0 flex items-center gap-3 px-5 py-4 rounded-xl bg-secondary border border-border hover:bg-secondary/80 hover:border-border/80 transition-all duration-200 group"
            >
              <div className="text-2xl">📅</div>
              <div>
                <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  Weekly Reports
                </div>
                <div className="text-xs text-muted-foreground">View & export 13-week history</div>
              </div>
              <div className="text-muted-foreground group-hover:text-primary transition-colors ml-2">→</div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TirBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-muted-foreground font-mono">{label}</span>
        <span className="font-bold font-mono" style={{ color }}>{pct}%</span>
      </div>
      <Progress value={pct} indicatorColor={color} className="h-2" />
    </div>
  );
}

function A1CMeter({ a1c }: { a1c: number }) {
  const min = 4;
  const max = 14;
  const pct = Math.min(100, Math.max(0, ((a1c - min) / (max - min)) * 100));
  const zones = [
    { label: "Normal <5.7%", width: ((5.7 - min) / (max - min)) * 100, color: "#22c55e" },
    { label: "Pre-DM 5.7–6.4%", width: ((6.5 - 5.7) / (max - min)) * 100, color: "#eab308" },
    { label: "Good 6.5–6.9%", width: ((7.0 - 6.5) / (max - min)) * 100, color: "#4f8ef7" },
    { label: "Fair 7–7.9%", width: ((8.0 - 7.0) / (max - min)) * 100, color: "#f97316" },
    { label: "High ≥8%", width: ((max - 8.0) / (max - min)) * 100, color: "#ef4444" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">A1C Scale</p>
        <p className="text-xs text-muted-foreground">Based on 90-day glucose average (ADAG formula)</p>
      </div>
      <div className="relative">
        <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
          {zones.map((z) => (
            <div
              key={z.label}
              style={{ width: `${z.width}%`, backgroundColor: z.color, opacity: 0.4 }}
            />
          ))}
        </div>
        <div
          className="absolute top-0 w-1 h-4 rounded-full"
          style={{ left: `calc(${pct}% - 2px)`, backgroundColor: "white", boxShadow: "0 0 8px rgba(255,255,255,0.8)" }}
        />
        <div className="flex mt-1.5 gap-0.5">
          {zones.map((z) => (
            <div key={z.label} style={{ width: `${z.width}%` }} className="text-center overflow-hidden">
              <p className="text-muted-foreground truncate" style={{ fontSize: 10 }}>{z.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
