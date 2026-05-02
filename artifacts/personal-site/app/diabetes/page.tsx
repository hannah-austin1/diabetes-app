import { Suspense } from "react";
import { DiabetesStats } from "@/components/diabetes-stats";
import { RollerCoasterViz } from "@/components/roller-coaster-viz";
import { DiabetesStatsLoading } from "@/components/diabetes-stats-loading";
import { fetchNightscoutData, fetchNightscoutStats } from "@/lib/nightscout";

export const revalidate = 300; // revalidate every 5 minutes

export default async function DiabetesPage() {
  const [readings, stats] = await Promise.all([
    fetchNightscoutData(48), // last 48 hours of readings
    fetchNightscoutStats(),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-6 pt-28 pb-16">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-3 h-3 rounded-full bg-accent-green animate-pulse" />
          <span className="text-sm text-gray-500 font-mono">LIVE DATA FROM NIGHTSCOUT</span>
        </div>
        <h1 className="text-5xl font-bold gradient-text mb-4">My Glucose Journey</h1>
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
        <FunStats stats={stats} readings={readings} />
      </div>
    </div>
  );
}

function FunStats({
  stats,
  readings,
}: {
  stats: Awaited<ReturnType<typeof fetchNightscoutStats>>;
  readings: Awaited<ReturnType<typeof fetchNightscoutData>>;
}) {
  const inRangeCount = readings.filter(
    (r) => r.sgv >= 70 && r.sgv <= 180
  ).length;
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
    ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
    : 0;

  // How many "rides" (crossings from in-range to out-of-range or vice versa)
  let rides = 0;
  let wasInRange = readings[0]?.sgv >= 70 && readings[0]?.sgv <= 180;
  for (let i = 1; i < readings.length; i++) {
    const isInRange = readings[i].sgv >= 70 && readings[i].sgv <= 180;
    if (isInRange !== wasInRange) {
      rides++;
      wasInRange = isInRange;
    }
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
      value: `${peak} mg/dL`,
      sub: "highest reading in 48h",
      color: "text-accent-red",
    },
    {
      emoji: "🕳️",
      label: "Deepest Valley",
      value: `${valley} mg/dL`,
      sub: "lowest reading in 48h",
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
      sub: "above 180 mg/dL",
      color: "text-accent-orange",
    },
    {
      emoji: "📉",
      label: "Low Dips",
      value: `${lowPct}%`,
      sub: "below 70 mg/dL",
      color: "text-accent-yellow",
    },
    {
      emoji: "📊",
      label: "Average",
      value: `${avg} mg/dL`,
      sub: "48-hour mean",
      color: "text-accent-blue",
    },
    {
      emoji: "📍",
      label: "Data Points",
      value: total.toLocaleString(),
      sub: "readings collected",
      color: "text-gray-400",
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
