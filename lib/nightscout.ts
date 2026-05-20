const NIGHTSCOUT_URL =
  process.env.NIGHTSCOUT_URL

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

export async function fetchNightscoutData(hours = 24): Promise<NightscoutReading[]> {
  if (!NIGHTSCOUT_URL) {
    console.log('No Nightscout URL found');
    return getMockReadings(hours);
  }
  try {
    const count = Math.min(hours * 12, 10000); // ~5-min intervals
    const url = `${NIGHTSCOUT_URL}/api/v1/entries/sgv.json?count=${count}`;
    const res = await fetch(url, {
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

/** A single Nightscout treatment (carb correction, bolus, etc.) */
export interface NightscoutTreatment {
  _id: string;
  eventType: string;
  created_at: string;
  mills: number;
  carbs: number | null;
  insulin: number | null;
  enteredBy?: string;
}

/**
 * Fetch treatments (carbs, boluses) from Nightscout.
 * Returns only entries that have carbs or insulin values.
 */
export async function fetchTreatments(hours = 48): Promise<NightscoutTreatment[]> {
  if (!NIGHTSCOUT_URL) return [];
  try {
    const count = Math.min(hours * 4, 10000);
    const url = `${NIGHTSCOUT_URL}/api/v1/treatments.json?count=${count}`;
    const res = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    // Filter to only carb/bolus entries
    return (data as NightscoutTreatment[]).filter(
      (t) => (t.carbs != null && t.carbs > 0) || (t.insulin != null && t.insulin > 0),
    );
  } catch {
    return [];
  }
}

export function computeStats(readings: NightscoutReading[]): NightscoutStats {
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
// emitted by their iOS shortcut). The server typically runs in UTC, so
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
