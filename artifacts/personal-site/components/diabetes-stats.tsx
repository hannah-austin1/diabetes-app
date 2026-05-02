import type { NightscoutReading, NightscoutStats } from "@/lib/nightscout";
import { glucoseColor, glucoseLabel, trendArrow, minutesAgo, fmtMmol, toMmol, a1cLabel } from "@/lib/utils";
import Link from "next/link";

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

  return (
    <div className="space-y-6">
      {/* Current reading — hero card */}
      <div
        className="card-glass p-8 border transition-all duration-300"
        style={{ borderColor: `${color}33` }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          {/* Big glucose number */}
          <div>
            <div className="text-xs font-mono text-gray-600 mb-3 uppercase tracking-widest">
              Current Glucose
            </div>
            <div className="flex items-baseline gap-4">
              <span
                className="text-8xl font-black font-mono leading-none"
                style={{ color, textShadow: `0 0 40px ${color}60` }}
              >
                {mmol}
              </span>
              <div>
                <div className="text-4xl font-bold" style={{ color }}>
                  {arrow}
                </div>
                <div className="text-sm text-gray-500">mmol/L</div>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <span
                className="text-sm font-bold px-3 py-1 rounded-full font-mono"
                style={{
                  color,
                  backgroundColor: `${color}18`,
                  border: `1px solid ${color}40`,
                }}
              >
                {label}
              </span>
              <span className="text-sm text-gray-600">{ago}</span>
            </div>
          </div>

          {/* Key metrics */}
          <div className="flex flex-wrap gap-0 divide-x divide-white/5">
            {/* A1C — expanded */}
            <div className="px-6 first:pl-0 text-center">
              <div
                className="text-3xl font-black font-mono mb-1"
                style={{ color: a1cColor }}
              >
                {stats.a1c > 0 ? stats.a1c.toFixed(1) : "—"}
                <span className="text-base font-normal text-gray-600 ml-1">%</span>
              </div>
              <div className="text-xs text-gray-600 font-mono">Est. A1C</div>
              <div
                className="text-xs font-semibold mt-1 px-2 py-0.5 rounded-full"
                style={{ color: a1cColor, backgroundColor: `${a1cColor}18` }}
              >
                {a1cCat}
              </div>
            </div>

            <div className="px-6 text-center">
              <div className="text-3xl font-black font-mono text-accent-green mb-1">
                {stats.timeInRange > 0 ? `${stats.timeInRange}%` : "—"}
              </div>
              <div className="text-xs text-gray-600 font-mono">Time in Range</div>
              <div className="text-xs text-gray-700 mt-1">3.9–10.0 mmol/L</div>
            </div>

            <div className="px-6 text-center">
              <div className="text-3xl font-black font-mono text-white mb-1">
                {avgMmol}
              </div>
              <div className="text-xs text-gray-600 font-mono">Avg mmol/L</div>
              <div className="text-xs text-gray-700 mt-1">90-day mean</div>
            </div>

            <div className="px-6 last:pr-0 text-center">
              <div className="text-3xl font-black font-mono text-accent-purple mb-1">
                {stats.stdDev > 0 ? toMmol(stats.stdDev).toFixed(1) : "—"}
              </div>
              <div className="text-xs text-gray-600 font-mono">Std Dev</div>
              <div className="text-xs text-gray-700 mt-1">mmol/L</div>
            </div>
          </div>
        </div>

        {/* A1C visual meter */}
        {stats.a1c > 0 && (
          <div className="mt-6 pt-6 border-t border-white/5">
            <A1CMeter a1c={stats.a1c} />
          </div>
        )}
      </div>

      {/* TIR breakdown */}
      <div className="card-glass p-6 flex flex-col md:flex-row gap-6 items-start">
        <div className="flex-1">
          <div className="text-xs font-mono text-gray-600 mb-4 uppercase tracking-widest">
            Time Distribution (48h)
          </div>
          <div className="space-y-3">
            <TirBar label="IN RANGE (3.9–10.0 mmol/L)" pct={stats.timeInRange} color="#22c55e" />
            <TirBar label="ABOVE (>10.0 mmol/L)" pct={stats.timeAbove} color="#eab308" />
            <TirBar label="BELOW (<3.9 mmol/L)" pct={stats.timeBelow} color="#f97316" />
          </div>
        </div>

        {/* Quick link to weekly reports */}
        <Link
          href="/diabetes/weekly"
          className="shrink-0 flex items-center gap-3 px-5 py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 hover:border-white/20 transition-all duration-200 group"
        >
          <div className="text-2xl">📅</div>
          <div>
            <div className="text-sm font-semibold text-white group-hover:text-accent-blue transition-colors">
              Weekly Reports
            </div>
            <div className="text-xs text-gray-600">View & export 13-week history</div>
          </div>
          <div className="text-gray-600 group-hover:text-accent-blue transition-colors ml-2">→</div>
        </Link>
      </div>
    </div>
  );
}

function TirBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-gray-500 font-mono">{label}</span>
        <span className="font-bold font-mono" style={{ color }}>{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.8 }}
        />
      </div>
    </div>
  );
}

function A1CMeter({ a1c }: { a1c: number }) {
  // A1C scale: 4–14%
  const min = 4;
  const max = 14;
  const pct = Math.min(100, Math.max(0, ((a1c - min) / (max - min)) * 100));
  const zones = [
    { label: "Normal", range: "< 5.7%", width: ((5.7 - min) / (max - min)) * 100, color: "#22c55e" },
    { label: "Pre-DM", range: "5.7–6.4%", width: ((6.5 - 5.7) / (max - min)) * 100, color: "#eab308" },
    { label: "Good", range: "6.5–6.9%", width: ((7.0 - 6.5) / (max - min)) * 100, color: "#4f8ef7" },
    { label: "Fair", range: "7–7.9%", width: ((8.0 - 7.0) / (max - min)) * 100, color: "#f97316" },
    { label: "High", range: "≥ 8%", width: ((max - 8.0) / (max - min)) * 100, color: "#ef4444" },
  ];

  return (
    <div>
      <div className="text-xs font-mono text-gray-600 mb-3 uppercase tracking-widest">
        A1C Scale
      </div>
      <div className="relative">
        {/* Zone segments */}
        <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
          {zones.map((z) => (
            <div key={z.label} style={{ width: `${z.width}%`, backgroundColor: z.color, opacity: 0.35 }} />
          ))}
        </div>
        {/* Pointer */}
        <div
          className="absolute top-0 w-0.5 h-3 rounded-full"
          style={{ left: `${pct}%`, backgroundColor: "white", boxShadow: "0 0 6px white" }}
        />
        {/* Labels */}
        <div className="flex mt-2 gap-0.5">
          {zones.map((z) => (
            <div key={z.label} style={{ width: `${z.width}%` }} className="text-center">
              <div className="text-xs text-gray-700 truncate">{z.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
