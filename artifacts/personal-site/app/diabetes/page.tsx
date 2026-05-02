import { Suspense } from "react";
import Link from "next/link";
import { DiabetesStats } from "@/components/diabetes-stats";
import { RollerCoasterViz } from "@/components/roller-coaster-viz";
import { DiabetesStatsLoading } from "@/components/diabetes-stats-loading";
import { fetchNightscoutData, fetchNightscoutStats, type NightscoutReading } from "@/lib/nightscout";
import { fmtMmol, toMmol } from "@/lib/utils";

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
            <div className="w-3 h-3 rounded-full bg-accent-green animate-pulse" />
            <span className="text-sm text-gray-500 font-mono">LIVE DATA FROM NIGHTSCOUT</span>
          </div>
          <Link
            href="/diabetes/weekly"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-400 hover:text-white hover:bg-white/8 hover:border-white/20 transition-all duration-200"
          >
            <span>📅</span>
            Weekly Reports
          </Link>
        </div>
        <h1 className="text-5xl font-bold gradient-text mb-3">My Glucose Journey</h1>
        <p className="text-gray-500 max-w-2xl">
          T1D since day one — real-time data from Nightscout. Every dip, climb, and in-range stretch.
        </p>
      </div>

      {/* 1. ROLLER COASTER — first thing you see */}
      <div className="mb-8">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-xl font-bold text-white">48-Hour Roller Coaster</h2>
          <span className="text-xs text-gray-600 font-mono">last 12h animated · mmol/L</span>
        </div>
        <RollerCoasterViz readings={readings} />
      </div>

      {/* 2. CURRENT BG + A1C + TIR stats */}
      <Suspense fallback={<DiabetesStatsLoading />}>
        <DiabetesStats readings={readings} stats={stats} />
      </Suspense>

      {/* 3. FUN STATS */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-white mb-6">Fun Stats</h2>
        <FunStats readings={readings} a1c={stats.a1c} />
      </div>

      {/* 4. HOURLY PATTERNS — when is glucose highest? */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-white mb-2">When is Your Glucose Highest?</h2>
        <p className="text-gray-500 text-sm mb-6">
          Average glucose by hour of day over the last 48h — spot your personal peaks and valleys.
        </p>
        <HourlyPatterns hourly={hourlyStats} />
      </div>
    </div>
  );
}

// ── Hourly stats computation (server-side) ───────────────────────────────────

interface HourlyStat {
  hour: number;
  avg: number;       // mg/dL
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

// ── Hourly patterns grid ─────────────────────────────────────────────────────

function HourlyPatterns({ hourly }: { hourly: HourlyStat[] }) {
  const withData = hourly.filter((h) => h.count > 0);
  if (withData.length === 0) return null;

  const maxAvg = Math.max(...withData.map((h) => h.avg));
  const minAvg = Math.min(...withData.map((h) => h.avg));
  const peakHour = hourly.find((h) => h.avg === maxAvg)!;
  const valleyHour = hourly.find((h) => h.avg === minAvg)!;

  // Top 3 highest hours
  const topHours = [...withData].sort((a, b) => b.avg - a.avg).slice(0, 3);
  // Top 3 lowest hours
  const bottomHours = [...withData].sort((a, b) => a.avg - b.avg).slice(0, 3);

  function fmt(h: number) {
    const ampm = h < 12 ? "am" : "pm";
    const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${display}${ampm}`;
  }

  // Bar chart: 24 hours
  const globalMax = Math.max(...hourly.map((h) => h.avg), 180);

  return (
    <div className="space-y-6">
      {/* Peak / valley callouts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-glass p-5 border border-red-500/20">
          <div className="text-2xl mb-2">🌅</div>
          <div className="text-2xl font-black font-mono text-red-400 mb-0.5">
            {fmt(peakHour.hour)}
          </div>
          <div className="text-xs font-semibold text-white mb-1">Highest Hour</div>
          <div className="text-xs text-gray-600">
            avg {fmtMmol(peakHour.avg)} mmol/L · {peakHour.count} readings
          </div>
        </div>

        <div className="card-glass p-5 border border-blue-500/20">
          <div className="text-2xl mb-2">🌙</div>
          <div className="text-2xl font-black font-mono text-blue-400 mb-0.5">
            {fmt(valleyHour.hour)}
          </div>
          <div className="text-xs font-semibold text-white mb-1">Lowest Hour</div>
          <div className="text-xs text-gray-600">
            avg {fmtMmol(valleyHour.avg)} mmol/L · {valleyHour.count} readings
          </div>
        </div>

        <div className="card-glass p-5 border border-orange-500/20 md:col-span-1">
          <div className="text-2xl mb-2">🔥</div>
          <div className="text-xs font-mono text-gray-600 mb-2 uppercase tracking-wider">Top 3 Spiky Hours</div>
          <div className="space-y-1">
            {topHours.map((h, i) => (
              <div key={h.hour} className="flex items-center justify-between text-xs">
                <span className="text-gray-400 font-mono">{fmt(h.hour)}</span>
                <span className="font-bold font-mono text-orange-400">{fmtMmol(h.avg)} mmol</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-glass p-5 border border-green-500/20">
          <div className="text-2xl mb-2">😌</div>
          <div className="text-xs font-mono text-gray-600 mb-2 uppercase tracking-wider">3 Calmest Hours</div>
          <div className="space-y-1">
            {bottomHours.map((h) => (
              <div key={h.hour} className="flex items-center justify-between text-xs">
                <span className="text-gray-400 font-mono">{fmt(h.hour)}</span>
                <span className="font-bold font-mono text-green-400">{fmtMmol(h.avg)} mmol</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 24-hour bar chart */}
      <div className="card-glass p-6">
        <div className="text-xs font-mono text-gray-600 mb-5 uppercase tracking-widest">
          Average Glucose by Hour · 3.9–10.0 mmol/L target
        </div>
        <div className="flex items-end gap-1 h-28">
          {hourly.map((h) => {
            if (h.count === 0) {
              return (
                <div key={h.hour} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t bg-white/3" style={{ height: "4px" }} />
                  {h.hour % 6 === 0 && (
                    <span className="text-xs text-gray-700 font-mono" style={{ fontSize: 9 }}>
                      {fmt(h.hour)}
                    </span>
                  )}
                </div>
              );
            }

            const heightPct = (h.avg / globalMax) * 100;
            // Color by zone
            const barColor =
              h.avg < 70 ? "#f97316" :
              h.avg <= 180 ? "#22c55e" :
              h.avg <= 250 ? "#eab308" : "#ef4444";

            const isPeak = h.hour === peakHour.hour;

            return (
              <div key={h.hour} className="flex-1 flex flex-col items-center gap-1 group relative">
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black/90 border border-white/10 rounded-lg px-2 py-1.5 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <div className="font-bold text-white font-mono">{fmt(h.hour)}</div>
                  <div style={{ color: barColor }}>{fmtMmol(h.avg)} mmol/L avg</div>
                  <div className="text-gray-500">{h.count} readings</div>
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
                  <span className="text-gray-700 font-mono" style={{ fontSize: 9 }}>
                    {fmt(h.hour)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {/* In-range zone indicator */}
        <div className="flex items-center gap-4 mt-4 text-xs text-gray-600">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-green-500 opacity-60" />
            In range (3.9–10.0)
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-yellow-500 opacity-60" />
            High (&gt;10.0)
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded bg-orange-500 opacity-60" />
            Low (&lt;3.9)
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Fun stats ────────────────────────────────────────────────────────────────

function FunStats({
  readings,
  a1c,
}: {
  readings: NightscoutReading[];
  a1c: number;
}) {
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
  const avg = values.length > 0
    ? values.reduce((a, b) => a + b, 0) / values.length
    : 0;

  let rides = 0;
  let wasInRange = readings[0]?.sgv >= 70 && readings[0]?.sgv <= 180;
  for (let i = 1; i < readings.length; i++) {
    const isInRange = readings[i].sgv >= 70 && readings[i].sgv <= 180;
    if (isInRange !== wasInRange) { rides++; wasInRange = isInRange; }
  }

  const funFacts = [
    {
      emoji: "🎢",
      label: "Coaster Rides",
      value: rides.toString(),
      sub: "in/out of range crossings",
      color: "text-accent-purple",
    },
    {
      emoji: "🏔️",
      label: "Peak Summit",
      value: `${fmtMmol(peak)} mmol`,
      sub: `highest in 48h`,
      color: "text-red-400",
    },
    {
      emoji: "🕳️",
      label: "Deepest Valley",
      value: `${fmtMmol(valley)} mmol`,
      sub: `lowest in 48h`,
      color: "text-accent-blue",
    },
    {
      emoji: "🎯",
      label: "In Range",
      value: `${inRangePct}%`,
      sub: `${inRangeCount} of ${total} readings`,
      color: "text-accent-green",
    },
    {
      emoji: "🚀",
      label: "High Launches",
      value: `${highPct}%`,
      sub: "above 10.0 mmol/L",
      color: "text-accent-orange",
    },
    {
      emoji: "📉",
      label: "Low Dips",
      value: `${lowPct}%`,
      sub: "below 3.9 mmol/L",
      color: "text-accent-yellow",
    },
    {
      emoji: "📊",
      label: "48h Average",
      value: `${toMmol(avg).toFixed(1)} mmol`,
      sub: "mean over 48 hours",
      color: "text-accent-blue",
    },
    {
      emoji: "🩸",
      label: "Est. A1C",
      value: a1c > 0 ? `${a1c.toFixed(1)}%` : "—",
      sub: "estimated · 90-day avg",
      color: "text-accent-purple",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {funFacts.map((fact) => (
        <div
          key={fact.label}
          className="card-glass p-5 hover:glow-blue transition-all duration-300 group"
        >
          <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">
            {fact.emoji}
          </div>
          <div className={`text-2xl font-bold font-mono ${fact.color} mb-1`}>
            {fact.value}
          </div>
          <div className="text-xs font-semibold text-white mb-1">{fact.label}</div>
          <div className="text-xs text-gray-600">{fact.sub}</div>
        </div>
      ))}
    </div>
  );
}
