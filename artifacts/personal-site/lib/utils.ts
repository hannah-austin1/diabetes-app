import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function glucoseColor(sgv: number): string {
  if (sgv < 55) return "#ef4444"; // urgent low
  if (sgv < 70) return "#f97316"; // low
  if (sgv <= 180) return "#22c55e"; // in range
  if (sgv <= 250) return "#eab308"; // high
  return "#ef4444"; // urgent high
}

export function glucoseLabel(sgv: number): string {
  if (sgv < 55) return "URGENT LOW";
  if (sgv < 70) return "LOW";
  if (sgv <= 180) return "IN RANGE";
  if (sgv <= 250) return "HIGH";
  return "URGENT HIGH";
}

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

export function minutesAgo(timestamp: number): string {
  const mins = Math.round((Date.now() - timestamp) / 60000);
  if (mins < 1) return "just now";
  if (mins === 1) return "1 min ago";
  if (mins < 60) return `${mins} mins ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m ago`;
}
