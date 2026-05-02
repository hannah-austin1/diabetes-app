const NIGHTSCOUT_URL = "https://hgjaustin-nightscout.fly.dev";

export interface NightscoutReading {
  _id: string;
  sgv: number;
  date: number;
  dateString: string;
  trend: number;
  direction: string;
  device: string;
  type: string;
}

export interface NightscoutStats {
  a1c: number;
  avgGlucose: number;
  timeInRange: number;
  timeAbove: number;
  timeBelow: number;
  stdDev: number;
  totalReadings: number;
  currentSgv: number | null;
  currentTrend: string | null;
  currentDate: number | null;
}

export async function fetchNightscoutData(hours = 24): Promise<NightscoutReading[]> {
  try {
    const count = hours * 12; // ~5-min intervals
    const url = `${NIGHTSCOUT_URL}/api/v1/entries/sgv.json?count=${count}&token=`;
    const res = await fetch(url, {
      next: { revalidate: 60 },
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      console.error("Nightscout fetch failed:", res.status);
      return getMockReadings(hours);
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      return getMockReadings(hours);
    }

    return data;
  } catch (err) {
    console.error("Error fetching Nightscout data:", err);
    return getMockReadings(hours);
  }
}

export async function fetchNightscoutStats(): Promise<NightscoutStats> {
  try {
    const readings = await fetchNightscoutData(90); // 90 days for A1C calc
    return computeStats(readings);
  } catch {
    return getDefaultStats();
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

  const variance = values.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  // eAG to A1C
  const a1c = (avg + 46.7) / 28.7;

  const latest = readings[0];

  return {
    a1c: Math.round(a1c * 10) / 10,
    avgGlucose: Math.round(avg),
    timeInRange: Math.round((inRange / total) * 100),
    timeAbove: Math.round((above / total) * 100),
    timeBelow: Math.round((below / total) * 100),
    stdDev: Math.round(stdDev),
    totalReadings: total,
    currentSgv: latest?.sgv ?? null,
    currentTrend: latest?.direction ?? null,
    currentDate: latest?.date ?? null,
  };
}

function getDefaultStats(): NightscoutStats {
  return {
    a1c: 0,
    avgGlucose: 0,
    timeInRange: 0,
    timeAbove: 0,
    timeBelow: 0,
    stdDev: 0,
    totalReadings: 0,
    currentSgv: null,
    currentTrend: null,
    currentDate: null,
  };
}

// Fallback mock data if Nightscout is unreachable
function getMockReadings(hours: number): NightscoutReading[] {
  const count = hours * 12;
  const readings: NightscoutReading[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const t = now - i * 5 * 60 * 1000;
    const base = 120;
    const wave =
      40 * Math.sin(i * 0.15) +
      20 * Math.sin(i * 0.07) +
      10 * Math.sin(i * 0.31) +
      (Math.random() - 0.5) * 15;
    const sgv = Math.max(55, Math.min(350, Math.round(base + wave)));

    readings.push({
      _id: `mock_${i}`,
      sgv,
      date: t,
      dateString: new Date(t).toISOString(),
      trend: 4,
      direction: "Flat",
      device: "mock",
      type: "sgv",
    });
  }

  return readings;
}
