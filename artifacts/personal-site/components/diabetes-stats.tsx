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
    <div className="space-y-4">
      {/* Row 1: current BG + key metrics */}
      <div
        className="card-glass p-6 md:p-8 border transition-all duration-300"
        style={{ borderColor: `${color}33` }}
      >
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          {/* Big glucose number */}
          <div className="shrink-0">
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
                <div className="text-4xl font-bold" style={{ color }}>{arrow}</div>
                <div className="text-sm text-gray-500 mt-1">mmol/L</div>
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

          {/* Key metrics — right side */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* A1C — hero stat */}
            <div
              className="rounded-2xl p-4 text-center border"
              style={{ backgroundColor: `${a1cColor}0d`, borderColor: `${a1cColor}30` }}
            >
              <div className="text-xs font-mono text-gray-600 mb-2 uppercase tracking-wider">
                Est. A1C
              </div>
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
            <div className="rounded-2xl p-4 text-center bg-green-500/5 border border-green-500/20">
              <div className="text-xs font-mono text-gray-600 mb-2 uppercase tracking-wider">
                Time in Range
              </div>
              <div className="text-4xl font-black font-mono text-green-400 leading-none mb-1">
                {stats.timeInRange > 0 ? `${stats.timeInRange}` : "—"}
                <span className="text-xl font-semibold">%</span>
              </div>
              <div className="text-xs text-gray-600 mt-1">3.9–10.0 mmol/L</div>
            </div>

            {/* 90-day avg */}
            <div className="rounded-2xl p-4 text-center bg-white/3 border border-white/8">
              <div className="text-xs font-mono text-gray-600 mb-2 uppercase tracking-wider">
                90d Avg
              </div>
              <div className="text-4xl font-black font-mono text-white leading-none mb-1">
                {avgMmol}
              </div>
              <div className="text-xs text-gray-600 mt-1">mmol/L mean</div>
            </div>

            {/* Std dev */}
            <div className="rounded-2xl p-4 text-center bg-purple-500/5 border border-purple-500/20">
              <div className="text-xs font-mono text-gray-600 mb-2 uppercase tracking-wider">
                Variability
              </div>
              <div className="text-4xl font-black font-mono text-purple-400 leading-none mb-1">
                {stats.stdDev > 0 ? toMmol(stats.stdDev).toFixed(1) : "—"}
              </div>
              <div className="text-xs text-gray-600 mt-1">std dev mmol/L</div>
            </div>
          </div>
        </div>

        {/* A1C scale meter */}
        {stats.a1c > 0 && (
          <div className="mt-6 pt-6 border-t border-white/5">
            <A1CMeter a1c={stats.a1c} />
          </div>
        )}
      </div>

      {/* Row 2: TIR bars + weekly link */}
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
        <div className="text-xs font-mono text-gray-600 uppercase tracking-widest">A1C Scale</div>
        <div className="text-xs text-gray-600">Based on 90-day glucose average (ADAG formula)</div>
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
        {/* Pointer */}
        <div
          className="absolute top-0 w-1 h-4 rounded-full"
          style={{
            left: `calc(${pct}% - 2px)`,
            backgroundColor: "white",
            boxShadow: "0 0 8px rgba(255,255,255,0.8)",
          }}
        />
        {/* Labels */}
        <div className="flex mt-1.5 gap-0.5">
          {zones.map((z) => (
            <div key={z.label} style={{ width: `${z.width}%` }} className="text-center overflow-hidden">
              <div className="text-xs text-gray-600 truncate" style={{ fontSize: 10 }}>{z.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
