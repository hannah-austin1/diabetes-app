const NIGHTSCOUT_URL = "https://hgjaustin-nightscout.fly.dev";

export interface NightscoutReading {
  _id: string;
  sgv: number; // always mg/dL internally
  date: number;
  dateString: string;
  trend: number;
  direction: string;
  device: string;
  type: string;
}

export interface NightscoutStats {
  a1c: number;
  avgGlucose: number; // mg/dL
  timeInRange: number; // %
  timeAbove: number;   // %
  timeBelow: number;   // %
  stdDev: number;      // mg/dL
  totalReadings: number;
  currentSgv: number | null;    // mg/dL
  currentTrend: string | null;
  currentDate: number | null;
}

export interface WeeklyReport {
  weekStart: number;       // unix ms
  weekEnd: number;
  avgGlucose: number;      // mg/dL
  a1c: number;
  timeInRange: number;     // %
  timeAbove: number;       // %
  timeBelow: number;       // %
  stdDev: number;
  readingCount: number;
  peakSgv: number;
  valleySgv: number;
  rides: number;           // in/out range crossings
}

export async function fetchNightscoutData(hours = 24): Promise<NightscoutReading[]> {
  try {
    const count = Math.min(hours * 12, 10000); // ~5-min intervals
    const url = `${NIGHTSCOUT_URL}/api/v1/entries/sgv.json?count=${count}`;
    const res = await fetch(url, {
      next: { revalidate: 60 },
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      return getMockReadings(hours);
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return getMockReadings(hours);
    }

    return data as NightscoutReading[];
  } catch {
    return getMockReadings(hours);
  }
}

export async function fetchNightscoutStats(): Promise<NightscoutStats> {
  try {
    const readings = await fetchNightscoutData(90 * 24); // 90 days for A1C
    return computeStats(readings);
  } catch {
    return getDefaultStats();
  }
}

export async function fetchWeeklyReports(): Promise<WeeklyReport[]> {
  try {
    // Fetch 90 days of readings and bucket into weeks
    const readings = await fetchNightscoutData(90 * 24);
    if (readings.length === 0) return [];

    // Sort oldest first
    const sorted = [...readings].sort((a, b) => a.date - b.date);

    // Bucket by ISO week (Mon–Sun)
    const weekMap = new Map<number, NightscoutReading[]>();
    for (const r of sorted) {
      const d = new Date(r.date);
      // Get Monday of this week
      const day = d.getDay(); // 0=Sun
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const mon = new Date(d);
      mon.setDate(diff);
      mon.setHours(0, 0, 0, 0);
      const key = mon.getTime();
      if (!weekMap.has(key)) weekMap.set(key, []);
      weekMap.get(key)!.push(r);
    }

    const weeks: WeeklyReport[] = [];
    for (const [weekStart, wReadings] of weekMap.entries()) {
      if (wReadings.length < 10) continue; // skip incomplete weeks with tiny data
      const values = wReadings.map((r) => r.sgv);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const inRange = wReadings.filter((r) => r.sgv >= 70 && r.sgv <= 180).length;
      const above = wReadings.filter((r) => r.sgv > 180).length;
      const below = wReadings.filter((r) => r.sgv < 70).length;
      const total = wReadings.length;
      const variance = values.reduce((s, v) => s + (v - avg) ** 2, 0) / values.length;
      const a1c = (avg + 46.7) / 28.7;

      let rides = 0;
      let wasInRange = wReadings[0].sgv >= 70 && wReadings[0].sgv <= 180;
      for (let i = 1; i < wReadings.length; i++) {
        const isIn = wReadings[i].sgv >= 70 && wReadings[i].sgv <= 180;
        if (isIn !== wasInRange) { rides++; wasInRange = isIn; }
      }

      weeks.push({
        weekStart,
        weekEnd: weekStart + 7 * 24 * 60 * 60 * 1000 - 1,
        avgGlucose: Math.round(avg),
        a1c: Math.round(a1c * 10) / 10,
        timeInRange: Math.round((inRange / total) * 100),
        timeAbove: Math.round((above / total) * 100),
        timeBelow: Math.round((below / total) * 100),
        stdDev: Math.round(Math.sqrt(variance)),
        readingCount: total,
        peakSgv: Math.max(...values),
        valleySgv: Math.min(...values),
        rides,
      });
    }

    // Return most recent first
    return weeks.sort((a, b) => b.weekStart - a.weekStart);
  } catch {
    return [];
  }
}

function computeStats(readings: NightscoutReading[]): NightscoutStats {
  if (readings.length === 0) return getDefaultStats();

  const values = readings.map((r) => r.sgv);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const inRange = readings.filter((r) => r.sgv >= 70 && r.sgv <= 180).length;
  const above = readings.filter((r) => r.sgv > 180).length;
  const below = readings.filter((r) => r.sgv < 70).length;
  const total = readings.length;
  const variance = values.reduce((s, v) => s + (v - avg) ** 2, 0) / values.length;
  const a1c = (avg + 46.7) / 28.7;
  const latest = readings[0];

  return {
    a1c: Math.round(a1c * 10) / 10,
    avgGlucose: Math.round(avg),
    timeInRange: Math.round((inRange / total) * 100),
    timeAbove: Math.round((above / total) * 100),
    timeBelow: Math.round((below / total) * 100),
    stdDev: Math.round(Math.sqrt(variance)),
    totalReadings: total,
    currentSgv: latest?.sgv ?? null,
    currentTrend: latest?.direction ?? null,
    currentDate: latest?.date ?? null,
  };
}

function getDefaultStats(): NightscoutStats {
  return {
    a1c: 0, avgGlucose: 0, timeInRange: 0, timeAbove: 0,
    timeBelow: 0, stdDev: 0, totalReadings: 0,
    currentSgv: null, currentTrend: null, currentDate: null,
  };
}

// ── Per-day roll-up ──────────────────────────────────────────────────────────

export interface DayGlucoseStats {
  date: string; // YYYY-MM-DD (server-local)
  startTs: number; // unix ms of local midnight
  avg: number; // mg/dL
  tir: number; // % in 70–180 (3.9–10.0 mmol/L)
  timeAbove: number; // %
  timeBelow: number; // %
  stdDev: number; // mg/dL
  cv: number; // % (stdDev / avg)
  peak: number; // mg/dL
  valley: number; // mg/dL
  readingCount: number;
  /** ~24-point downsampled sparkline (mg/dL). */
  sparkline: number[];
}

// Finch's `DailySummary.date` is bucketed in the user's local TZ (Europe/London,
// emitted by their iOS shortcut). The site runs on Replit's UTC servers, so
// using `new Date(ts).getDate()` would shift glucose days by up to 1h every
// night and silently mis-align the join. We pin the date key to Europe/London
// so both pipelines agree on what "today" means.
const TZ = "Europe/London";
const dateFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function localDateKey(ts: number): { key: string; midnight: number } {
  const key = dateFmt.format(new Date(ts)); // YYYY-MM-DD in Europe/London
  // Approximate midnight: parse the YYYY-MM-DD as if it were the wall clock
  // moment. Good enough for sparkline bucketing (24 equal slots across the day
  // — a 1h DST drift just shifts one bucket).
  const midnight = Date.parse(key + "T00:00:00Z");
  return { key, midnight };
}

/**
 * Roll a flat list of readings into per-calendar-day stats.
 * Days with fewer than `minReadings` are dropped to keep noise out of correlations.
 */
export function perDayStats(
  readings: NightscoutReading[],
  minReadings = 50,
): DayGlucoseStats[] {
  if (readings.length === 0) return [];
  const byDay = new Map<string, { startTs: number; rs: NightscoutReading[] }>();
  for (const r of readings) {
    const { key, midnight } = localDateKey(r.date);
    const cur = byDay.get(key) ?? { startTs: midnight, rs: [] };
    cur.rs.push(r);
    byDay.set(key, cur);
  }

  const out: DayGlucoseStats[] = [];
  for (const [date, { startTs, rs }] of byDay.entries()) {
    if (rs.length < minReadings) continue;
    const sorted = [...rs].sort((a, b) => a.date - b.date);
    const vals = sorted.map((r) => r.sgv);
    const sum = vals.reduce((a, b) => a + b, 0);
    const avg = sum / vals.length;
    const inRange = vals.filter((v) => v >= 70 && v <= 180).length;
    const above = vals.filter((v) => v > 180).length;
    const below = vals.filter((v) => v < 70).length;
    const variance = vals.reduce((s, v) => s + (v - avg) ** 2, 0) / vals.length;
    const stdDev = Math.sqrt(variance);
    const cv = avg > 0 ? (stdDev / avg) * 100 : 0;

    // ~24-point sparkline by bucketing into 24 equal time slots across the day
    const bucketCount = 24;
    const buckets: { sum: number; n: number }[] = Array.from(
      { length: bucketCount },
      () => ({ sum: 0, n: 0 }),
    );
    const dayMs = 24 * 60 * 60 * 1000;
    for (const r of sorted) {
      const offset = Math.max(0, Math.min(dayMs - 1, r.date - startTs));
      const idx = Math.min(bucketCount - 1, Math.floor((offset / dayMs) * bucketCount));
      buckets[idx].sum += r.sgv;
      buckets[idx].n++;
    }
    const sparkline = buckets.map((b) => (b.n > 0 ? b.sum / b.n : avg));

    out.push({
      date,
      startTs,
      avg: Math.round(avg),
      tir: Math.round((inRange / vals.length) * 100),
      timeAbove: Math.round((above / vals.length) * 100),
      timeBelow: Math.round((below / vals.length) * 100),
      stdDev: Math.round(stdDev),
      cv: Math.round(cv * 10) / 10,
      peak: Math.max(...vals),
      valley: Math.min(...vals),
      readingCount: vals.length,
      sparkline,
    });
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

function getMockReadings(hours: number): NightscoutReading[] {
  const count = Math.min(hours * 12, 5000);
  const readings: NightscoutReading[] = [];
  const now = Date.now();

  // Deterministic mock — no Math.random() to avoid hydration issues
  for (let i = 0; i < count; i++) {
    const t = now - i * 5 * 60 * 1000;
    const wave =
      40 * Math.sin(i * 0.15) +
      20 * Math.sin(i * 0.07) +
      10 * Math.sin(i * 0.31);
    const sgv = Math.max(55, Math.min(350, Math.round(120 + wave)));
    readings.push({
      _id: `mock_${i}`, sgv, date: t,
      dateString: new Date(t).toISOString(),
      trend: 4, direction: "Flat", device: "mock", type: "sgv",
    });
  }

  return readings;
}
