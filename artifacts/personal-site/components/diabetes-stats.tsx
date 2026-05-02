import type { NightscoutReading, NightscoutStats } from "@/lib/nightscout";
import { glucoseColor, glucoseLabel, trendArrow, minutesAgo } from "@/lib/utils";

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

  return (
    <div className="space-y-6">
      {/* Current reading — hero card */}
      <div
        className="card-glass p-8 border transition-all duration-300"
        style={{ borderColor: `${color}33` }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="text-xs font-mono text-gray-600 mb-3 uppercase tracking-widest">
              Current Glucose
            </div>
            <div className="flex items-baseline gap-4">
              <span
                className="text-8xl font-black font-mono leading-none"
                style={{ color, textShadow: `0 0 40px ${color}60` }}
              >
                {stats.currentSgv ?? "—"}
              </span>
              <div>
                <div className="text-4xl font-bold" style={{ color }}>
                  {arrow}
                </div>
                <div className="text-sm text-gray-500">mg/dL</div>
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

          {/* A1C + TIR */}
          <div className="flex gap-6">
            <div className="text-center">
              <div className="text-3xl font-black font-mono text-accent-blue mb-1">
                {stats.a1c > 0 ? stats.a1c.toFixed(1) : "—"}
              </div>
              <div className="text-xs text-gray-600 font-mono">Est. A1C</div>
            </div>
            <div className="w-px bg-white/5" />
            <div className="text-center">
              <div className="text-3xl font-black font-mono text-accent-green mb-1">
                {stats.timeInRange > 0 ? `${stats.timeInRange}%` : "—"}
              </div>
              <div className="text-xs text-gray-600 font-mono">Time in Range</div>
            </div>
            <div className="w-px bg-white/5" />
            <div className="text-center">
              <div className="text-3xl font-black font-mono text-white mb-1">
                {stats.avgGlucose > 0 ? stats.avgGlucose : "—"}
              </div>
              <div className="text-xs text-gray-600 font-mono">Avg mg/dL</div>
            </div>
          </div>
        </div>
      </div>

      {/* TIR breakdown */}
      <div className="card-glass p-6">
        <div className="text-xs font-mono text-gray-600 mb-4 uppercase tracking-widest">
          Time Distribution (48h)
        </div>
        <div className="space-y-3">
          <TirBar label="IN RANGE (70–180)" pct={stats.timeInRange} color="#22c55e" />
          <TirBar label="ABOVE (180+)" pct={stats.timeAbove} color="#eab308" />
          <TirBar label="BELOW (70–)" pct={stats.timeBelow} color="#f97316" />
        </div>
      </div>
    </div>
  );
}

function TirBar({
  label,
  pct,
  color,
}: {
  label: string;
  pct: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-gray-500 font-mono">{label}</span>
        <span className="font-bold font-mono" style={{ color }}>
          {pct}%
        </span>
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
