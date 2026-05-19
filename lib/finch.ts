// Finch + Apple Health data, fetched from the Firebase Cloud Function
// `getFinchData`. The function returns one aggregated DailySummary per
// calendar day (see attached_assets/types_*.ts for the canonical shape).

const ENDPOINT =
  process.env.FINCH_ENDPOINT

// ── Wire types ────────────────────────────────────────────────────────────────

export interface CompletedGoal {
  text: string;
  emoji: string | null;
  areas: string[] | null;
  date: string;
  /** Forward-compatible: present once the Firebase function emits per-goal timestamps. */
  ts?: number;
  /** Forward-compatible: optional ISO-8601 completion time. */
  completedAt?: string;
}

export interface HealthMetric {
  value: number;
  unit: string;
  count: number;
}

export interface DailySummary {
  date: string;
  mood: { score: number; label: string } | null;
  scheduled_goals_count: number;
  completed_goals_count: number;
  completed_goals: CompletedGoal[];
  completed_reflections_count: number;
  completed_reflections: CompletedGoal[];
  good_vibes_count: number;
  breathing_sessions_count: number;
  /** Apple Health metrics keyed by HKQuantityType identifier (e.g. "Steps"). */
  health: Record<string, HealthMetric>;
  /** Firestore timestamp of when this day was last written. */
  uploadedAt?: { _seconds: number; _nanoseconds: number };
}

interface FinchResponse {
  ok: boolean;
  from: string;
  to: string;
  days: number;
  data: DailySummary[];
}

// ── Fetch ────────────────────────────────────────────────────────────────────

function isValidDay(x: unknown): x is DailySummary {
  if (!x || typeof x !== "object") return false;
  const d = x as Record<string, unknown>;
  return (
    typeof d.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(d.date) &&
    typeof d.scheduled_goals_count === "number" &&
    typeof d.completed_goals_count === "number" &&
    Array.isArray(d.completed_goals) &&
    Array.isArray(d.completed_reflections) &&
    typeof d.good_vibes_count === "number" &&
    typeof d.breathing_sessions_count === "number" &&
    typeof d.health === "object" && d.health !== null
  );
}

export async function fetchFinchData(): Promise<DailySummary[]> {
  if (!ENDPOINT) {
    console.log('No Finch endpoint found');
    return [];
  }
  try {
    const res = await fetch(ENDPOINT, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json: unknown = await res.json();
    if (!json || typeof json !== "object") return [];
    const r = json as Partial<FinchResponse>;
    if (r.ok !== true || !Array.isArray(r.data)) return [];
    const valid = r.data.filter(isValidDay);
    return valid.sort((a, b) => a.date.localeCompare(b.date));
  } catch {
    return [];
  }
}

/** A day is considered "active" if any wellness signal was logged. */
function isActiveDay(d: DailySummary): boolean {
  return (
    d.completed_goals_count > 0 ||
    d.completed_reflections_count > 0 ||
    d.good_vibes_count > 0 ||
    d.breathing_sessions_count > 0 ||
    d.mood !== null
  );
}

// ── Mood helper ──────────────────────────────────────────────────────────────

export function moodLabel(score: number): string {
  return (
    ["", "very bad", "bad", "okay", "good", "very good"][score] ?? "unknown"
  );
}

// ── Derived summary stats ────────────────────────────────────────────────────

export interface AreaCount {
  area: string;
  count: number;
}

export interface TopGoal {
  text: string;
  emoji: string | null;
  count: number;
}

export interface FinchSummary {
  totalDays: number;
  daysWithCheckIn: number;
  totalGoalsCompleted: number;
  totalGoalsScheduled: number;
  completionRate: number; // 0..1
  totalGoodVibes: number;
  totalBreathingSessions: number;
  totalReflections: number;
  avgGoalsPerDay: number;
  longestStreak: number;
  currentStreak: number;
  avgMoodScore: number | null;
  daysWithMood: number;
  areaCounts: AreaCount[];
  topGoals: TopGoal[];
  firstDate: string | null;
  lastDate: string | null;
  lastUpdatedTs: number;
}

export function summarizeFinch(days: DailySummary[]): FinchSummary {
  const total = days.length;
  const daysWithCheckIn = days.filter(isActiveDay).length;
  const totalCompleted = days.reduce((s, d) => s + d.completed_goals_count, 0);
  const totalScheduled = days.reduce((s, d) => s + d.scheduled_goals_count, 0);
  const totalGoodVibes = days.reduce((s, d) => s + d.good_vibes_count, 0);
  const totalBreathing = days.reduce((s, d) => s + d.breathing_sessions_count, 0);
  const totalReflections = days.reduce(
    (s, d) => s + d.completed_reflections_count,
    0,
  );

  const moodDays = days.filter((d) => d.mood && typeof d.mood.score === "number");
  const avgMoodScore =
    moodDays.length > 0
      ? moodDays.reduce((s, d) => s + (d.mood!.score ?? 0), 0) / moodDays.length
      : null;

  // streaks: consecutive calendar days with any wellness signal logged
  const checkInDates = new Set(
    days.filter(isActiveDay).map((d) => d.date),
  );
  const sortedDates = [...checkInDates].sort();
  let longest = 0;
  let running = 0;
  let prev: number | null = null;
  for (const dStr of sortedDates) {
    const t = Date.parse(dStr + "T00:00:00Z");
    if (prev !== null && t - prev === 86_400_000) {
      running++;
    } else {
      running = 1;
    }
    if (running > longest) longest = running;
    prev = t;
  }

  // current streak = trailing run ending at the last date in the dataset that
  // actually had a check-in (so it represents recency, not a gap to "today")
  let current = 0;
  if (sortedDates.length > 0) {
    current = 1;
    for (let i = sortedDates.length - 1; i > 0; i--) {
      const a = Date.parse(sortedDates[i - 1] + "T00:00:00Z");
      const b = Date.parse(sortedDates[i] + "T00:00:00Z");
      if (b - a === 86_400_000) current++;
      else break;
    }
  }

  // area counts across all completed goals
  const areaMap = new Map<string, number>();
  for (const day of days) {
    for (const g of day.completed_goals) {
      for (const a of g.areas ?? []) {
        areaMap.set(a, (areaMap.get(a) ?? 0) + 1);
      }
    }
  }
  const areaCounts = [...areaMap.entries()]
    .map(([area, count]) => ({ area, count }))
    .sort((a, b) => b.count - a.count);

  // top recurring goal texts
  const goalMap = new Map<string, { emoji: string | null; count: number }>();
  for (const day of days) {
    for (const g of day.completed_goals) {
      const key = g.text;
      const cur = goalMap.get(key) ?? { emoji: g.emoji, count: 0 };
      cur.count++;
      if (!cur.emoji && g.emoji) cur.emoji = g.emoji;
      goalMap.set(key, cur);
    }
  }
  const topGoals = [...goalMap.entries()]
    .map(([text, v]) => ({ text, emoji: v.emoji, count: v.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const firstDate = days[0]?.date ?? null;
  const lastDate = days[days.length - 1]?.date ?? null;
  const lastUpdatedTs = days.reduce(
    (m, d) => Math.max(m, (d.uploadedAt?._seconds ?? 0) * 1000),
    0,
  );

  return {
    totalDays: total,
    daysWithCheckIn,
    totalGoalsCompleted: totalCompleted,
    totalGoalsScheduled: totalScheduled,
    completionRate:
      totalScheduled > 0 ? totalCompleted / totalScheduled : 0,
    totalGoodVibes,
    totalBreathingSessions: totalBreathing,
    totalReflections,
    avgGoalsPerDay: total > 0 ? totalCompleted / total : 0,
    longestStreak: longest,
    currentStreak: current,
    avgMoodScore,
    daysWithMood: moodDays.length,
    areaCounts,
    topGoals,
    firstDate,
    lastDate,
    lastUpdatedTs,
  };
}

// ── Coaster event overlay ────────────────────────────────────────────────────
// Goal completions get plotted on the roller-coaster when (and only when) the
// upstream function provides a timestamp. Until then this returns []
// gracefully.

// Only `goal` and `reflection` are emittable: both share the CompletedGoal shape
// which can carry an optional `ts` / `completedAt` timestamp from the upstream
// Cloud Function. `breathing_sessions_count` is a daily count with no
// per-session timestamp, so breathing events are intentionally omitted here
// until the upstream schema gains per-session times.
export interface FinchEvent {
  ts: number;
  kind: "goal" | "reflection";
  label: string;
  emoji: string | null;
}

function goalTs(g: CompletedGoal): number | null {
  if (typeof g.ts === "number" && g.ts > 0) return g.ts;
  if (typeof g.completedAt === "string") {
    const t = Date.parse(g.completedAt);
    if (!Number.isNaN(t)) return t;
  }
  return null;
}

export function eventsForWindow(
  days: DailySummary[],
  sinceTs: number,
  untilTs: number,
): FinchEvent[] {
  const out: FinchEvent[] = [];
  for (const day of days) {
    // Day boundaries for distributing goals without individual timestamps
    const dayStart = Date.parse(day.date + "T08:00:00"); // 8am
    const dayEnd = Date.parse(day.date + "T21:00:00");   // 9pm
    if (isNaN(dayStart)) continue;

    // Skip days entirely outside the window
    if (dayEnd < sinceTs || dayStart > untilTs) continue;

    const goals = day.completed_goals;
    for (let i = 0; i < goals.length; i++) {
      const g = goals[i];
      let ts = goalTs(g);
      // If no per-goal timestamp, distribute evenly across the day
      if (ts === null) {
        ts = goals.length > 1
          ? dayStart + (i / (goals.length - 1)) * (dayEnd - dayStart)
          : dayStart + (dayEnd - dayStart) / 2;
      }
      if (ts >= sinceTs && ts <= untilTs) {
        out.push({ ts, kind: "goal", label: g.text, emoji: g.emoji });
      }
    }

    for (const r of day.completed_reflections) {
      let ts = goalTs(r);
      if (ts === null) {
        // Place reflections at midday
        ts = dayStart + (dayEnd - dayStart) / 2;
      }
      if (ts >= sinceTs && ts <= untilTs) {
        out.push({ ts, kind: "reflection", label: r.text, emoji: r.emoji });
      }
    }
  }
  return out.sort((a, b) => a.ts - b.ts);
}

// ── Apple Health helpers ─────────────────────────────────────────────────────

/** Friendly label + emoji for a HealthKit identifier key. */
export function healthLabel(key: string): { label: string; emoji: string } {
  const trimmed = key.replace(/^HKQuantityTypeIdentifier/, "");
  const table: Record<string, { label: string; emoji: string }> = {
    Steps: { label: "Steps", emoji: "🚶" },
    StepCount: { label: "Steps", emoji: "🚶" },
    DistanceWalkingRunning: { label: "Distance", emoji: "📏" },
    ActiveEnergyBurned: { label: "Active Energy", emoji: "🔥" },
    BasalEnergyBurned: { label: "Resting Energy", emoji: "🛋️" },
    AppleExerciseTime: { label: "Exercise Minutes", emoji: "🏋️" },
    AppleStandTime: { label: "Stand Time", emoji: "🧍" },
    HeartRate: { label: "Heart Rate", emoji: "❤️" },
    RestingHeartRate: { label: "Resting HR", emoji: "💗" },
    HeartRateVariabilitySDNN: { label: "HRV", emoji: "💓" },
    FlightsClimbed: { label: "Flights Climbed", emoji: "🪜" },
    SleepAnalysis: { label: "Sleep", emoji: "😴" },
  };
  return table[trimmed] ?? { label: trimmed, emoji: "📊" };
}

export interface HealthRollup {
  key: string;
  label: string;
  emoji: string;
  unit: string;
  total: number; // sum across days (for cumulative metrics)
  avg: number; // per-day average over days that had data
  daysWithData: number;
  perDay: { date: string; value: number }[];
}

/** Roll Apple Health metrics across days into a per-metric summary. */
export function rollupHealth(days: DailySummary[]): HealthRollup[] {
  const byKey = new Map<
    string,
    { unit: string; total: number; days: number; perDay: { date: string; value: number }[] }
  >();
  for (const day of days) {
    for (const [key, m] of Object.entries(day.health ?? {})) {
      const cur = byKey.get(key) ?? {
        unit: m.unit,
        total: 0,
        days: 0,
        perDay: [],
      };
      cur.total += m.value;
      cur.days++;
      cur.perDay.push({ date: day.date, value: m.value });
      if (!cur.unit && m.unit) cur.unit = m.unit;
      byKey.set(key, cur);
    }
  }
  return [...byKey.entries()]
    .map(([key, v]) => {
      const meta = healthLabel(key);
      return {
        key,
        label: meta.label,
        emoji: meta.emoji,
        unit: v.unit,
        total: v.total,
        avg: v.days > 0 ? v.total / v.days : 0,
        daysWithData: v.days,
        perDay: v.perDay.sort((a, b) => a.date.localeCompare(b.date)),
      };
    })
    .sort((a, b) => b.daysWithData - a.daysWithData);
}
