import { cacheLife } from "next/cache";
import { fetchFinchData, type DailySummary } from "@/lib/finch";
import {
  fetchNightscoutData,
  fetchTreatments,
  type NightscoutReading,
  type NightscoutTreatment,
} from "@/lib/nightscout";

// ── Finch (cached remotely for 1 day — shared across all Vercel instances) ───

export async function getFinchData(): Promise<DailySummary[]> {
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
