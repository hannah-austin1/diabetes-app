import { Suspense } from "react";
import Link from "next/link";
import { DiabetesStats } from "@/components/diabetes/stats";
import { RollerCoasterViz } from "@/components/diabetes/roller-coaster-viz";
import { DiabetesStatsLoading } from "@/components/diabetes/stats-loading";
import { fetchNightscoutData, fetchNightscoutStats, type NightscoutReading } from "@/lib/nightscout";
import { fmtMmol, toMmol } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const revalidate = 300;

export default async function DiabetesPage() {
  const [readings, stats] = await Promise.all([
    fetchNightscoutData(48),
    fetchNightscoutStats(),
  ]);

  const hourlyStats = computeHourlyStats(readings);

  return (
    <div className="max-w-6xl mx-auto px-6 pt-28 pb-16">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-glucose-green animate-pulse" />
            <span className="text-sm text-muted-foreground font-mono">LIVE DATA FROM NIGHTSCOUT</span>
          </div>
          <Link
            href="/diabetes/weekly"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all duration-200"
          >
            <span>📅</span>
            Weekly Reports
          </Link>
        </div>
        <h1 className="text-5xl font-bold gradient-text mb-3">My Glucose Journey</h1>
        <p className="text-muted-foreground max-w-2xl">
          T1D since day one — real-time data from Nightscout. Every dip, climb, and in-range stretch.
        </p>
      </div>

      {/* 1. Roller Coaster */}
      <div className="mb-8">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-xl font-bold text-foreground">48-Hour Roller Coaster</h2>
          <span className="text-xs text-muted-foreground font-mono">last 12h animated · mmol/L</span>
        </div>
        <RollerCoasterViz readings={readings} />
      </div>

      {/* 2. Stats */}
      <Suspense fallback={<DiabetesStatsLoading />}>
        <DiabetesStats readings={readings} stats={stats} />
      </Suspense>

      {/* 3. Fun Stats */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-foreground mb-6">Fun Stats</h2>
        <FunStats readings={readings} a1c={stats.a1c} />
      </div>

      {/* 4. Hourly Patterns */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-foreground mb-2">When is Your Glucose Highest?</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Average glucose by hour of day over the last 48h — spot your personal peaks and valleys.
        </p>
        <HourlyPatterns hourly={hourlyStats} />
      </div>
    </div>
  );
}

// ── Hourly stats ──────────────────────────────────────────────────────────────

interface HourlyStat {
  hour: number;
  avg: number;
  count: number;
  min: number;
  max: number;
}

function computeHourlyStats(readings: NightscoutReading[]): HourlyStat[] {
  const buckets: { sum: number; count: number; min: number; max: number }[] = Array.from(
    { length: 24 },
    () => ({ sum: 0, count: 0, min: Infinity, max: -Infinity })
  );
  for (const r of readings) {
    const hour = new Date(r.date).getHours();
    buckets[hour].sum += r.sgv;
    buckets[hour].count++;
    if (r.sgv < buckets[hour].min) buckets[hour].min = r.sgv;
    if (r.sgv > buckets[hour].max) buckets[hour].max = r.sgv;
  }
  return buckets.map((b, hour) => ({
    hour,
    avg: b.count > 0 ? Math.round(b.sum / b.count) : 0,
    count: b.count,
    min: b.min === Infinity ? 0 : b.min,
    max: b.max === -Infinity ? 0 : b.max,
  }));
}

function fmt(h: number) {
  const ampm = h < 12 ? "am" : "pm";
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}${ampm}`;
}

// ── Hourly patterns ───────────────────────────────────────────────────────────

function HourlyPatterns({ hourly }: { hourly: HourlyStat[] }) {
  const withData = hourly.filter((h) => h.count > 0);
  if (withData.length === 0) return null;

  const maxAvg = Math.max(...withData.map((h) => h.avg));
  const minAvg = Math.min(...withData.map((h) => h.avg));
  const peakHour = hourly.find((h) => h.avg === maxAvg)!;
  const valleyHour = hourly.find((h) => h.avg === minAvg)!;
  const topHours = [...withData].sort((a, b) => b.avg - a.avg).slice(0, 3);
  const bottomHours = [...withData].sort((a, b) => a.avg - b.avg).slice(0, 3);
  const globalMax = Math.max(...hourly.map((h) => h.avg), 180);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-red-500/20">
          <CardContent className="p-5">
            <div className="text-2xl mb-2">🌅</div>
            <div className="text-2xl font-black font-mono text-red-400 mb-0.5">{fmt(peakHour.hour)}</div>
            <div className="text-xs font-semibold text-foreground mb-1">Highest Hour</div>
            <div className="text-xs text-muted-foreground">
              avg {fmtMmol(peakHour.avg)} mmol/L · {peakHour.count} readings
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20">
          <CardContent className="p-5">
            <div className="text-2xl mb-2">🌙</div>
            <div className="text-2xl font-black font-mono text-blue-400 mb-0.5">{fmt(valleyHour.hour)}</div>
            <div className="text-xs font-semibold text-foreground mb-1">Lowest Hour</div>
            <div className="text-xs text-muted-foreground">
              avg {fmtMmol(valleyHour.avg)} mmol/L · {valleyHour.count} readings
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-500/20">
          <CardContent className="p-5">
            <div className="text-2xl mb-2">🔥</div>
            <p className="text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">Top 3 Spiky Hours</p>
            <div className="space-y-1">
              {topHours.map((h) => (
                <div key={h.hour} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-mono">{fmt(h.hour)}</span>
                  <span className="font-bold font-mono text-glucose-orange">{fmtMmol(h.avg)} mmol</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-500/20">
          <CardContent className="p-5">
            <div className="text-2xl mb-2">😌</div>
            <p className="text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">3 Calmest Hours</p>
            <div className="space-y-1">
              {bottomHours.map((h) => (
                <div key={h.hour} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-mono">{fmt(h.hour)}</span>
                  <span className="font-bold font-mono text-glucose-green">{fmtMmol(h.avg)} mmol</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 24-hour bar chart */}
      <Card>
        <CardContent className="p-6">
          <p className="text-xs font-mono text-muted-foreground mb-5 uppercase tracking-widest">
            Average Glucose by Hour · 3.9–10.0 mmol/L target
          </p>
          <div className="flex items-end gap-1 h-28">
            {hourly.map((h) => {
              if (h.count === 0) {
                return (
                  <div key={h.hour} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t bg-secondary/30" style={{ height: "4px" }} />
                    {h.hour % 6 === 0 && (
                      <span className="text-muted-foreground font-mono" style={{ fontSize: 9 }}>{fmt(h.hour)}</span>
                    )}
                  </div>
                );
              }
              const heightPct = (h.avg / globalMax) * 100;
              const barColor =
                h.avg < 70 ? "#f97316"
                : h.avg <= 180 ? "#22c55e"
                : h.avg <= 250 ? "#eab308" : "#ef4444";
              const isPeak = h.hour === peakHour.hour;

              return (
                <div key={h.hour} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-popover border border-border rounded-lg px-2 py-1.5 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <div className="font-bold text-foreground font-mono">{fmt(h.hour)}</div>
                    <div style={{ color: barColor }}>{fmtMmol(h.avg)} mmol/L avg</div>
                    <div className="text-muted-foreground">{h.count} readings</div>
                  </div>
                  <div
                    className="w-full rounded-t transition-all duration-300"
                    style={{
                      height: `${heightPct}%`,
                      backgroundColor: barColor,
                      opacity: isPeak ? 1 : 0.6,
                      boxShadow: isPeak ? `0 0 8px ${barColor}` : "none",
                    } as React.CSSProperties}
                  />
                  {h.hour % 6 === 0 && (
                    <span className="text-muted-foreground font-mono" style={{ fontSize: 9 }}>{fmt(h.hour)}</span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded bg-glucose-green opacity-60" />
              In range (3.9–10.0)
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded bg-glucose-yellow opacity-60" />
              High (&gt;10.0)
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded bg-glucose-orange opacity-60" />
              Low (&lt;3.9)
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Fun stats ─────────────────────────────────────────────────────────────────

function FunStats({ readings, a1c }: { readings: NightscoutReading[]; a1c: number }) {
  const inRangeCount = readings.filter((r) => r.sgv >= 70 && r.sgv <= 180).length;
  const highCount = readings.filter((r) => r.sgv > 180).length;
  const lowCount = readings.filter((r) => r.sgv < 70).length;
  const total = readings.length;
  const inRangePct = total > 0 ? Math.round((inRangeCount / total) * 100) : 0;
  const highPct = total > 0 ? Math.round((highCount / total) * 100) : 0;
  const lowPct = total > 0 ? Math.round((lowCount / total) * 100) : 0;
  const values = readings.map((r) => r.sgv);
  const peak = values.length > 0 ? Math.max(...values) : 0;
  const valley = values.length > 0 ? Math.min(...values) : 0;
  const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;

  let rides = 0;
  let wasInRange = readings[0]?.sgv >= 70 && readings[0]?.sgv <= 180;
  for (let i = 1; i < readings.length; i++) {
    const isInRange = readings[i].sgv >= 70 && readings[i].sgv <= 180;
    if (isInRange !== wasInRange) { rides++; wasInRange = isInRange; }
  }

  const funFacts = [
    { emoji: "🎢", label: "Coaster Rides", value: rides.toString(), sub: "in/out of range crossings", color: "text-glucose-purple" },
    { emoji: "🏔️", label: "Peak Summit", value: `${fmtMmol(peak)} mmol`, sub: "highest in 48h", color: "text-red-400" },
    { emoji: "🕳️", label: "Deepest Valley", value: `${fmtMmol(valley)} mmol`, sub: "lowest in 48h", color: "text-glucose-blue" },
    { emoji: "🎯", label: "In Range", value: `${inRangePct}%`, sub: `${inRangeCount} of ${total} readings`, color: "text-glucose-green" },
    { emoji: "🚀", label: "High Launches", value: `${highPct}%`, sub: "above 10.0 mmol/L", color: "text-glucose-orange" },
    { emoji: "📉", label: "Low Dips", value: `${lowPct}%`, sub: "below 3.9 mmol/L", color: "text-glucose-yellow" },
    { emoji: "📊", label: "48h Average", value: `${toMmol(avg).toFixed(1)} mmol`, sub: "mean over 48 hours", color: "text-glucose-blue" },
    { emoji: "🩸", label: "Est. A1C", value: a1c > 0 ? `${a1c.toFixed(1)}%` : "—", sub: "estimated · 90-day avg", color: "text-glucose-purple" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {funFacts.map((fact) => (
        <Card key={fact.label} className="hover:border-primary/30 transition-all duration-300 group">
          <CardContent className="p-5">
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform inline-block">
              {fact.emoji}
            </div>
            <div className={`text-2xl font-bold font-mono ${fact.color} mb-1`}>{fact.value}</div>
            <div className="text-xs font-semibold text-foreground mb-1">{fact.label}</div>
            <div className="text-xs text-muted-foreground">{fact.sub}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
