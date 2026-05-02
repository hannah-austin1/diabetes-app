import Link from "next/link";
import { fetchWeeklyReports } from "@/lib/nightscout";
import { fmtMmol, toMmol, a1cLabel } from "@/lib/utils";
import { WeeklyExportButton } from "@/components/weekly-export-button";

export const revalidate = 3600; // refresh every hour

export default async function WeeklyPage() {
  const weeks = await fetchWeeklyReports();

  return (
    <div className="max-w-6xl mx-auto px-6 pt-28 pb-16">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <Link href="/diabetes" className="hover:text-gray-300 transition-colors">
            ← Glucose
          </Link>
          <span>/</span>
          <span className="text-gray-400">Weekly Reports</span>
        </div>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Weekly Reports</h1>
            <p className="text-gray-500 max-w-xl">
              13-week breakdown of your glucose data — time in range, A1C estimate,
              averages, and more. Export any week as CSV.
            </p>
          </div>
          {/* Export all button */}
          {weeks.length > 0 && (
            <WeeklyExportButton weeks={weeks} label="Export All (CSV)" variant="all" />
          )}
        </div>
      </div>

      {weeks.length === 0 ? (
        <div className="card-glass p-12 text-center">
          <div className="text-4xl mb-4">📭</div>
          <div className="text-gray-400 font-medium">No weekly data available yet.</div>
          <div className="text-gray-600 text-sm mt-2">
            Data will appear here once Nightscout has enough readings.
          </div>
        </div>
      ) : (
        <>
          {/* Summary banner — most recent week */}
          <WeeklySummaryBanner week={weeks[0]} />

          {/* Table */}
          <div className="mt-8 card-glass overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-xs font-mono text-gray-600 uppercase tracking-wider">
                    <th className="text-left px-5 py-4">Week</th>
                    <th className="text-center px-4 py-4">Avg</th>
                    <th className="text-center px-4 py-4">A1C</th>
                    <th className="text-center px-4 py-4">TIR</th>
                    <th className="text-center px-4 py-4">High</th>
                    <th className="text-center px-4 py-4">Low</th>
                    <th className="text-center px-4 py-4">Peak</th>
                    <th className="text-center px-4 py-4">Valley</th>
                    <th className="text-center px-4 py-4">Std Dev</th>
                    <th className="text-center px-4 py-4">Rides</th>
                    <th className="text-center px-4 py-4">Export</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/4">
                  {weeks.map((week, i) => {
                    const { color: a1cColor } = a1cLabel(week.a1c);
                    const tirColor =
                      week.timeInRange >= 70 ? "#22c55e" :
                      week.timeInRange >= 50 ? "#eab308" : "#ef4444";
                    return (
                      <tr
                        key={week.weekStart}
                        className={`hover:bg-white/3 transition-colors ${i === 0 ? "bg-white/3" : ""}`}
                      >
                        <td className="px-5 py-4">
                          <div className="font-medium text-white">
                            {formatWeekRange(week.weekStart, week.weekEnd)}
                          </div>
                          {i === 0 && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-accent-blue/20 text-accent-blue font-mono">
                              Latest
                            </span>
                          )}
                          <div className="text-xs text-gray-600 mt-0.5 font-mono">
                            {week.readingCount} readings
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center font-mono font-bold text-white">
                          {fmtMmol(week.avgGlucose)}
                          <span className="text-gray-600 text-xs font-normal ml-1">mmol</span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="font-mono font-bold" style={{ color: a1cColor }}>
                            {week.a1c.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <TirPill pct={week.timeInRange} color={tirColor} />
                        </td>
                        <td className="px-4 py-4 text-center font-mono text-yellow-500">
                          {week.timeAbove}%
                        </td>
                        <td className="px-4 py-4 text-center font-mono text-orange-500">
                          {week.timeBelow}%
                        </td>
                        <td className="px-4 py-4 text-center font-mono text-red-400">
                          {fmtMmol(week.peakSgv)}
                        </td>
                        <td className="px-4 py-4 text-center font-mono text-blue-400">
                          {fmtMmol(week.valleySgv)}
                        </td>
                        <td className="px-4 py-4 text-center font-mono text-gray-400">
                          {toMmol(week.stdDev).toFixed(1)}
                        </td>
                        <td className="px-4 py-4 text-center font-mono text-purple-400">
                          {week.rides}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <WeeklyExportButton weeks={[week]} label="CSV" variant="single" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap gap-6 text-xs text-gray-600">
            <span><span className="text-white">TIR</span> — Time in Range (3.9–10.0 mmol/L)</span>
            <span><span className="text-white">Rides</span> — In/out of range boundary crossings</span>
            <span><span className="text-white">Std Dev</span> — Glucose variability in mmol/L</span>
            <span>All values in mmol/L unless noted</span>
          </div>
        </>
      )}
    </div>
  );
}

function WeeklySummaryBanner({ week }: { week: Awaited<ReturnType<typeof fetchWeeklyReports>>[0] }) {
  const { label: a1cCat, color: a1cColor } = a1cLabel(week.a1c);
  return (
    <div className="card-glass p-6 border border-accent-blue/20">
      <div className="text-xs font-mono text-gray-600 uppercase tracking-widest mb-4">
        Most Recent Week · {formatWeekRange(week.weekStart, week.weekEnd)}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Stat label="Avg Glucose" value={`${fmtMmol(week.avgGlucose)} mmol`} color="text-white" />
        <Stat label="Est. A1C" value={`${week.a1c.toFixed(1)}%`} sub={a1cCat} color="text-accent-blue" />
        <Stat label="Time in Range" value={`${week.timeInRange}%`} color={week.timeInRange >= 70 ? "text-accent-green" : "text-yellow-500"} />
        <Stat label="Variability" value={`${toMmol(week.stdDev).toFixed(1)} mmol`} color="text-accent-purple" />
        <Stat label="Coaster Rides" value={week.rides.toString()} color="text-accent-orange" />
      </div>
    </div>
  );
}

function Stat({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div>
      <div className={`text-2xl font-black font-mono ${color} mb-0.5`}>{value}</div>
      {sub && <div className="text-xs mb-0.5" style={{ color }}>{sub}</div>}
      <div className="text-xs text-gray-600 font-mono">{label}</div>
    </div>
  );
}

function TirPill({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="inline-flex items-center gap-1.5">
      <span className="font-mono font-bold" style={{ color }}>{pct}%</span>
      <div className="w-12 h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.7 }} />
      </div>
    </div>
  );
}

function formatWeekRange(start: number, end: number): string {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${s.toLocaleDateString("en-GB", opts)} – ${e.toLocaleDateString("en-GB", opts)}`;
}
