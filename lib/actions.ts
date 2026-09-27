import { cacheLife } from "next/cache";
import { fetchFinchData, type DailySummary } from "@/lib/finch";
import {
  fetchNightscoutData,
  fetchTreatments,
  type NightscoutReading,
  type NightscoutTreatment,
} from "@/lib/nightscout";

// Finch + Apple Health: cache the Firebase request for one day.
// The dateKey makes the cache key change each calendar day.
export async function getFinchData(
  dateKey: string = new Date().toISOString().slice(0, 10),
): Promise<DailySummary[]> {
  "use cache: remote";
  cacheLife({ revalidate: 86400, expire: 86400, stale: 0 });
  void dateKey;
  return fetchFinchData();
}

// Nightscout: deliberately uncached because glucose data needs to stay live.
export async function getNightscoutData(
  hours = 48,
): Promise<NightscoutReading[]> {
  return fetchNightscoutData(hours);
}

export async function getNightscoutTreatments(
  hours = 48,
): Promise<NightscoutTreatment[]> {
  return fetchTreatments(hours);
}
