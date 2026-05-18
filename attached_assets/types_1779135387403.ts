/** Shared types for Finch daily summary data. */

/** A single goal or reflection completed (or scheduled) on a given day. */
export interface CompletedGoal {
  text: string;
  emoji: string | null;
  areas: string[] | null; // Finch self-care area categories
  date: string;
}

/** One aggregated Apple Health metric for a day. */
export interface HealthMetric {
  value: number; // sum for cumulative types; average for rate types
  unit: string;
  count: number; // number of samples aggregated
}

/** Full per-day summary stored in Firestore under finch-daily/{YYYY-MM-DD}. */
export interface DailySummary {
  date: string;
  mood: { score: number; label: string } | null;
  scheduled_goals_count: number; // total goals for the day (completed + not)
  completed_goals_count: number;
  completed_goals: CompletedGoal[];
  completed_reflections_count: number;
  completed_reflections: CompletedGoal[];
  good_vibes_count: number;
  breathing_sessions_count: number;
  /** Apple Health metrics keyed by HKQuantityTypeIdentifier name */
  health: Record<string, HealthMetric>;
}

/**
 * Map a numeric Finch mood score (1–5) to a human-readable label.
 * @param {number} score - Finch mood score, 1 = very bad, 5 = very good.
 * @return {string} Human-readable mood label.
 */
export function moodLabel(score: number): string {
  return (
    ["", "very bad", "bad", "okay", "good", "very good"][score] ?? "unknown"
  );
}

/**
 * Strip leading # characters from Finch hashtag-style goal text.
 * @param {string} raw - Raw goal text, potentially with #tags.
 * @return {string} Cleaned text with # prefixes removed from each word.
 */
export function cleanGoalText(raw: string): string {
  const cleaned = raw
    .split(" ")
    .map((w) => (w.startsWith("#") ? w.slice(1) : w))
    .join(" ")
    .trim();
  return cleaned || raw;
}

/**
 * Parse a date string into YYYY-MM-DD format.
 * Accepts ISO-8601 and RFC-2822-style dates (e.g. "Mon, 18 May 2026 14:00:00").
 * @param {unknown} s - Input value to parse.
 * @return {string | null} Date string or null if unparseable.
 */
export function extractDate(s: unknown): string | null {
  if (typeof s !== "string" || !s) return null;
  const iso = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (iso) return iso[1];
  const rfc = s.match(/^[A-Za-z]{3},\s+(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/);
  if (rfc) {
    const months: Record<string, string> = {
      Jan: "01", Feb: "02", Mar: "03", Apr: "04",
      May: "05", Jun: "06", Jul: "07", Aug: "08",
      Sep: "09", Oct: "10", Nov: "11", Dec: "12",
    };
    return `${rfc[3]}-${months[rfc[2]]}-${rfc[1].padStart(2, "0")}`;
  }
  return null;
}

/**
 * Retrieve (or lazily create) a DailySummary for the given date.
 * @param {Map<string, DailySummary>} daily - Date-keyed summary map.
 * @param {string} date - YYYY-MM-DD key.
 * @return {DailySummary} Existing or newly created summary for that date.
 */
export function getDay(
  daily: Map<string, DailySummary>,
  date: string
): DailySummary {
  if (!daily.has(date)) {
    daily.set(date, {
      date,
      mood: null,
      scheduled_goals_count: 0,
      completed_goals_count: 0,
      completed_goals: [],
      completed_reflections_count: 0,
      completed_reflections: [],
      good_vibes_count: 0,
      breathing_sessions_count: 0,
      health: {},
    });
  }
  // We just set the value above if absent, so it is always defined here.
  return daily.get(date) as DailySummary;
}

/**
 * Sort a Map<date, DailySummary> into a chronological array.
 * @param {Map<string, DailySummary>} daily - Date-keyed summary map.
 * @return {DailySummary[]} Array sorted by date ascending.
 */
export function sortedSummaries(daily: Map<string, DailySummary>): DailySummary[] {
  return [...daily.values()].sort((a, b) => a.date.localeCompare(b.date));
}
