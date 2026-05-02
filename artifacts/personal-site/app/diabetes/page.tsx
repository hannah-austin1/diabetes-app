import { Suspense } from "react";
import Link from "next/link";
import { DiabetesStats } from "@/components/diabetes-stats";
import { RollerCoasterViz } from "@/components/roller-coaster-viz";
import { DiabetesStatsLoading } from "@/components/diabetes-stats-loading";
import { fetchNightscoutData, fetchNightscoutStats } from "@/lib/nightscout";
import { fmtMmol, toMmol } from "@/lib/utils";

export const revalidate = 300;

export default async function DiabetesPage() {
  const [readings, stats] = await Promise.all([
    fetchNightscoutData(48),
    fetchNightscoutStats(),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-6 pt-28 pb-16">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center justify-between flex-wrap gap-4">
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
        <h1 className="text-5xl font-bold gradient-text mt-6 mb-4">My Glucose Journey</h1>
        <p className="text-gray-400 text-lg max-w-2xl">
          T1D since day one — here&apos;s a real-time look at life on the metabolic roller coaster.
          Every dip, every climb, every perfect in-range stretch.
        </p>
      </div>

      {/* Current BG + quick stats */}
      <Suspense fallback={<DiabetesStatsLoading />}>
        <DiabetesStats readings={readings} stats={stats} />
      </Suspense>

      {/* Roller coaster animation */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-white mb-2">48-Hour Roller Coaster</h2>
        <p className="text-gray-500 text-sm mb-6">
          Your blood sugars animated as a roller coaster — buckle up.
        </p>
        <RollerCoasterViz readings={readings} />
      </div>

      {/* Fun stats grid */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-white mb-8">Fun Stats</h2>
        <FunStats readings={readings} a1c={stats.a1c} />
      </div>
    </div>
  );
}

function FunStats({
  readings,
  a1c,
}: {
  readings: Awaited<ReturnType<typeof fetchNightscoutData>>;
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
      sub: `${peak} mg/dL · highest in 48h`,
      color: "text-accent-red",
    },
    {
      emoji: "🕳️",
      label: "Deepest Valley",
      value: `${fmtMmol(valley)} mmol`,
      sub: `${valley} mg/dL · lowest in 48h`,
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
      label: "Average",
      value: `${toMmol(avg).toFixed(1)} mmol`,
      sub: "48-hour mean",
      color: "text-accent-blue",
    },
    {
      emoji: "🩸",
      label: "Est. A1C",
      value: a1c > 0 ? `${a1c.toFixed(1)}%` : "—",
      sub: "estimated from 90-day avg",
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
