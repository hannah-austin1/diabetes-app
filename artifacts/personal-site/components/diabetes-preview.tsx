import Link from "next/link";
import { fetchNightscoutData } from "@/lib/nightscout";
import { glucoseColor, glucoseLabel, trendArrow, minutesAgo } from "@/lib/utils";

export async function DiabetesPreview() {
  const readings = await fetchNightscoutData(3);
  const latest = readings[0];

  if (!latest) {
    return null;
  }

  const color = glucoseColor(latest.sgv);
  const label = glucoseLabel(latest.sgv);
  const arrow = trendArrow(latest.direction);
  const ago = minutesAgo(latest.date);

  return (
    <section>
      <h2 className="text-sm font-mono text-gray-600 uppercase tracking-widest mb-6">
        Live Glucose
      </h2>
      <Link href="/diabetes" className="block">
        <div className="card-glass p-8 border border-white/8 hover:border-white/16 transition-all duration-300 group cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-3 mb-2">
                <span
                  className="text-6xl font-black font-mono"
                  style={{ color }}
                >
                  {latest.sgv}
                </span>
                <span className="text-3xl font-bold" style={{ color }}>
                  {arrow}
                </span>
                <span className="text-sm text-gray-600 self-end mb-1">mg/dL</span>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full font-mono"
                  style={{
                    color,
                    backgroundColor: `${color}22`,
                    border: `1px solid ${color}44`,
                  }}
                >
                  {label}
                </span>
                <span className="text-xs text-gray-600">{ago}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-2 group-hover:text-gray-300 transition-colors">
                View full dashboard →
              </div>
              <div className="text-xs text-gray-700 font-mono">48h roller coaster</div>
            </div>
          </div>

          {/* Mini sparkline from recent readings */}
          <div className="mt-6">
            <MiniSparkline readings={readings} />
          </div>
        </div>
      </Link>
    </section>
  );
}

function MiniSparkline({
  readings,
}: {
  readings: Awaited<ReturnType<typeof fetchNightscoutData>>;
}) {
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
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        className="w-full h-12"
      >
        {/* In-range band */}
        <rect
          x={0}
          y={h - ((180 - min) / range) * h}
          width={w}
          height={((180 - 70) / range) * h}
          fill="rgba(34, 197, 94, 0.06)"
        />
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke="rgba(79,142,247,0.7)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-bg-card/60 pointer-events-none" />
    </div>
  );
}
