import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Unit conversion ──────────────────────────────────────────────────────────
export const MMOL_FACTOR = 18.0182;

/** Convert mg/dL to mmol/L, 1 decimal place */
export function toMmol(mgdl: number): number {
  return Math.round((mgdl / MMOL_FACTOR) * 10) / 10;
}

/** Format mmol/L value as a string (e.g. "8.2") */
export function fmtMmol(mgdl: number): string {
  return toMmol(mgdl).toFixed(1);
}

// ── Glucose colour (still keyed on mg/dL internally) ────────────────────────
export function glucoseColor(sgv: number): string {
  if (sgv < 55) return "#ef4444"; // urgent low  < 3.0 mmol
  if (sgv < 70) return "#f97316"; // low         < 3.9 mmol
  if (sgv <= 180) return "#22c55e"; // in range  3.9–10.0 mmol
  if (sgv <= 250) return "#eab308"; // high       10.0–13.9 mmol
  return "#ef4444"; // urgent high > 13.9 mmol
}

export function glucoseLabel(sgv: number): string {
  if (sgv < 55) return "URGENT LOW";
  if (sgv < 70) return "LOW";
  if (sgv <= 180) return "IN RANGE";
  if (sgv <= 250) return "HIGH";
  return "URGENT HIGH";
}

// ── Trend arrows ─────────────────────────────────────────────────────────────
export function trendArrow(direction: string | null): string {
  const map: Record<string, string> = {
    DoubleUp: "↑↑",
    SingleUp: "↑",
    FortyFiveUp: "↗",
    Flat: "→",
    FortyFiveDown: "↘",
    SingleDown: "↓",
    DoubleDown: "↓↓",
    NONE: "—",
    NOT_COMPUTABLE: "?",
    RATE_OUT_OF_RANGE: "?",
  };
  return direction ? (map[direction] ?? "→") : "→";
}

// ── Time formatting ──────────────────────────────────────────────────────────
export function minutesAgo(timestamp: number): string {
  const mins = Math.round((Date.now() - timestamp) / 60000);
  if (mins < 1) return "just now";
  if (mins === 1) return "1 min ago";
  if (mins < 60) return `${mins} mins ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m ago`;
}

// ── A1C helpers ──────────────────────────────────────────────────────────────
/** Estimated A1C from average mg/dL using the ADAG formula */
export function eAGtoA1C(avgMgdl: number): number {
  return Math.round(((avgMgdl + 46.7) / 28.7) * 10) / 10;
}

/** A1C category label */
export function a1cLabel(a1c: number): { label: string; color: string } {
  if (a1c < 5.7) return { label: "Normal", color: "#22c55e" };
  if (a1c < 6.5) return { label: "Pre-diabetes", color: "#eab308" };
  if (a1c < 7.0) return { label: "Good control", color: "#4f8ef7" };
  if (a1c < 8.0) return { label: "Fair control", color: "#f97316" };
  return { label: "Needs attention", color: "#ef4444" };
}

// ── Date helpers ─────────────────────────────────────────────────────────────
export function startOfDayTs(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
