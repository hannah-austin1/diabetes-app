import { cacheLife } from "next/cache";
import { fetchFinchData, type DailySummary } from "@/lib/finch";
import {
  fetchNightscoutData,
  fetchTreatments,
  type NightscoutReading,
  type NightscoutTreatment,
} from "@/lib/nightscout";

// ── Finch (cached remotely for 1 day — shared across all Vercel instances) ───
// The `dateKey` argument is today's date in YYYY-MM-DD format. Because "use cache"
// uses function arguments as the cache key, a new cache entry is created each
// calendar day — yesterday's stale entry is simply never hit again.

export async function getFinchData(
  dateKey: string = new Date().toISOString().slice(0, 10),
): Promise<DailySummary[]> {
  "use cache";
  cacheLife({ revalidate: 64800, stale: 0 });
  return fetchFinchData();
}

// ── Nightscout (cached remotely for 5 minutes) ──────────────────────────────

export async function getNightscoutData(
  hours = 48,
): Promise<NightscoutReading[]> {
  "use cache";
  cacheLife({ revalidate: 300, stale: 0 });
  return fetchNightscoutData(hours);
}

export async function getNightscoutTreatments(
  hours = 48,
): Promise<NightscoutTreatment[]> {
  "use cache";
  cacheLife({ revalidate: 300, stale: 0 });
  return fetchTreatments(hours);
}
