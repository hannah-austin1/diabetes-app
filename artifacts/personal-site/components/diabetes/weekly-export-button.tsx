"use client";

import type { WeeklyReport } from "@/lib/nightscout";
import { fmtMmol, toMmol } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface Props {
  weeks: WeeklyReport[];
  label: string;
  variant: "all" | "single";
}

export function WeeklyExportButton({ weeks, label, variant }: Props) {
  function handleExport() {
    const header = [
      "Week Start", "Week End", "Avg Glucose (mmol/L)", "Est A1C (%)",
      "Time in Range (%)", "Time Above (%)", "Time Below (%)",
      "Std Dev (mmol/L)", "Peak (mmol/L)", "Valley (mmol/L)", "Coaster Rides", "Readings",
    ].join(",");

    const rows = weeks.map((w) => {
      const fmt = (ts: number) =>
        new Date(ts).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
      return [
        fmt(w.weekStart), fmt(w.weekEnd), fmtMmol(w.avgGlucose), w.a1c.toFixed(1),
        w.timeInRange, w.timeAbove, w.timeBelow, toMmol(w.stdDev).toFixed(1),
        fmtMmol(w.peakSgv), fmtMmol(w.valleySgv), w.rides, w.readingCount,
      ].join(",");
    });

    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      weeks.length === 1
        ? `glucose-week-${new Date(weeks[0].weekStart).toISOString().slice(0, 10)}.csv`
        : `glucose-weekly-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (variant === "single") {
    return (
      <Button size="sm" variant="glass" onClick={handleExport}>
        {label}
      </Button>
    );
  }

  return (
    <Button variant="glass" onClick={handleExport}>
      <Download className="size-4" />
      {label}
    </Button>
  );
}
