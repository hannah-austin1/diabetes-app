"use server";

import { fetchNightscoutData } from "@/lib/nightscout";

/**
 * Lightweight server action for client components (e.g. LiveGlucoseBadge).
 * Returns only the latest glucose reading to minimise payload size.
 */
export async function getLatestGlucose() {
  const readings = await fetchNightscoutData(1);
  if (readings.length === 0) return null;
  const latest = readings[readings.length - 1];
  return { sgv: latest.sgv, direction: latest.direction ?? "Flat", date: latest.date };
}
