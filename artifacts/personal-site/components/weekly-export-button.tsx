"use client";

import type { WeeklyReport } from "@/lib/nightscout";
import { fmtMmol, toMmol } from "@/lib/utils";

interface Props {
  weeks: WeeklyReport[];
  label: string;
  variant: "all" | "single";
}

export function WeeklyExportButton({ weeks, label, variant }: Props) {
  function handleExport() {
    const header = [
      "Week Start",
      "Week End",
      "Avg Glucose (mmol/L)",
      "Est A1C (%)",
      "Time in Range (%)",
      "Time Above (%)",
      "Time Below (%)",
      "Std Dev (mmol/L)",
      "Peak (mmol/L)",
      "Valley (mmol/L)",
      "Coaster Rides",
      "Readings",
    ].join(",");

    const rows = weeks.map((w) => {
      const fmt = (ts: number) =>
        new Date(ts).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      return [
        fmt(w.weekStart),
        fmt(w.weekEnd),
        fmtMmol(w.avgGlucose),
        w.a1c.toFixed(1),
        w.timeInRange,
        w.timeAbove,
        w.timeBelow,
        toMmol(w.stdDev).toFixed(1),
        fmtMmol(w.peakSgv),
        fmtMmol(w.valleySgv),
        w.rides,
        w.readingCount,
      ].join(",");
    });

    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const filename =
      weeks.length === 1
        ? `glucose-week-${new Date(weeks[0].weekStart).toISOString().slice(0, 10)}.csv`
        : `glucose-weekly-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (variant === "single") {
    return (
      <button
        onClick={handleExport}
        className="text-xs px-2 py-1 rounded bg-white/5 border border-white/10 text-gray-500 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200 font-mono"
      >
        {label}
      </button>
    );
  }

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-blue/10 border border-accent-blue/30 text-accent-blue text-sm font-medium hover:bg-accent-blue/20 hover:border-accent-blue/50 transition-all duration-200"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      {label}
    </button>
  );
}
