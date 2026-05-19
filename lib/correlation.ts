import type { DayGlucoseStats } from "./nightscout";
import type { DailySummary } from "./finch";

export interface PearsonResult {
  r: number;
  n: number;
}

/** Pearson correlation coefficient. Returns r=0 / n=0 for unusable input. */
export function pearson(xs: number[], ys: number[]): PearsonResult {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return { r: 0, n };
  let sx = 0, sy = 0;
  for (let i = 0; i < n; i++) {
    sx += xs[i];
    sy += ys[i];
  }
  const mx = sx / n;
  const my = sy / n;
  let num = 0;
  let dx2 = 0;
  let dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }
  const denom = Math.sqrt(dx2 * dy2);
  if (denom === 0) return { r: 0, n };
  return { r: num / denom, n };
}

/**
 * Pull the daily Steps value (in steps, not km) from a DailySummary,
 * regardless of which HealthKit identifier the Cloud Function used.
 */
export function dailySteps(d: DailySummary): number | null {
  const h = d.health ?? {};
  const candidates = [
    "Steps",
    "StepCount",
    "HKQuantityTypeIdentifierStepCount",
  ];
  for (const k of candidates) {
    const m = h[k];
    if (m && typeof m.value === "number" && m.value >= 0) return m.value;
  }
  return null;
}

export interface JoinedDay {
  date: string;
  glucose: DayGlucoseStats;
  finch: DailySummary;
}

/** Inner-join glucose days with Finch days on the `YYYY-MM-DD` date key. */
export function joinDays(
  glucoseDays: DayGlucoseStats[],
  finchDays: DailySummary[],
): JoinedDay[] {
  const finchByDate = new Map(finchDays.map((d) => [d.date, d] as const));
  const out: JoinedDay[] = [];
  for (const g of glucoseDays) {
    const f = finchByDate.get(g.date);
    if (f) out.push({ date: g.date, glucose: g, finch: f });
  }
  return out;
}

export interface CorrelationPair {
  id: string;
  title: string;
  xLabel: string;
  yLabel: string;
  /** Points kept after filtering missing values. */
  points: { x: number; y: number; date: string }[];
  r: number;
  n: number;
  /** Plain-English takeaway, rendered when the card is shown. */
  takeaway: string;
}

/**
 * Build the four correlation pairings the UI wants. Days where the X-axis
 * signal is missing for that day are dropped (rather than zero-filled).
 */
export function buildCorrelations(joined: JoinedDay[]): CorrelationPair[] {
  // Mood ↔ TIR
  const moodPoints = joined
    .filter((j) => j.finch.mood && typeof j.finch.mood.score === "number")
    .map((j) => ({ x: j.finch.mood!.score, y: j.glucose.tir, date: j.date }));

  // Steps ↔ avg glucose
  const stepPoints = joined
    .map((j) => {
      const s = dailySteps(j.finch);
      return s === null
        ? null
        : { x: s, y: j.glucose.avg, date: j.date };
    })
    .filter((p): p is { x: number; y: number; date: string } => p !== null);

  // Completion rate ↔ TIR  (skip days where nothing was scheduled)
  const completionTirPoints = joined
    .filter((j) => j.finch.scheduled_goals_count > 0)
    .map((j) => ({
      x: j.finch.completed_goals_count / j.finch.scheduled_goals_count,
      y: j.glucose.tir,
      date: j.date,
    }));

  // Completion rate ↔ CV
  const completionCvPoints = joined
    .filter((j) => j.finch.scheduled_goals_count > 0)
    .map((j) => ({
      x: j.finch.completed_goals_count / j.finch.scheduled_goals_count,
      y: j.glucose.cv,
      date: j.date,
    }));

  const moodR = pearson(moodPoints.map((p) => p.x), moodPoints.map((p) => p.y));
  const stepR = pearson(stepPoints.map((p) => p.x), stepPoints.map((p) => p.y));
  const compTirR = pearson(
    completionTirPoints.map((p) => p.x),
    completionTirPoints.map((p) => p.y),
  );
  const compCvR = pearson(
    completionCvPoints.map((p) => p.x),
    completionCvPoints.map((p) => p.y),
  );

  return [
    {
      id: "mood-tir",
      title: "Mood × Time-in-Range",
      xLabel: "Mood score (1–5)",
      yLabel: "TIR %",
      points: moodPoints,
      r: moodR.r,
      n: moodR.n,
      takeaway: phraseTakeaway(moodR.r, "better mood days", "higher TIR", "lower TIR"),
    },
    {
      id: "steps-avg",
      title: "Steps × Average Glucose",
      xLabel: "Daily steps",
      yLabel: "Avg glucose (mg/dL)",
      points: stepPoints,
      r: stepR.r,
      n: stepR.n,
      // For steps↔avg glucose, NEGATIVE r is the "good" direction
      takeaway: phraseTakeaway(
        -stepR.r,
        "higher-step days",
        "lower average glucose",
        "higher average glucose",
      ),
    },
    {
      id: "completion-tir",
      title: "Goal Completion × TIR",
      xLabel: "Goals completed %",
      yLabel: "TIR %",
      points: completionTirPoints,
      r: compTirR.r,
      n: compTirR.n,
      takeaway: phraseTakeaway(
        compTirR.r,
        "days with more goals completed",
        "higher TIR",
        "lower TIR",
      ),
    },
    {
      id: "completion-cv",
      title: "Goal Completion × Variability",
      xLabel: "Goals completed %",
      yLabel: "CV %",
      points: completionCvPoints,
      r: compCvR.r,
      n: compCvR.n,
      // For CV, NEGATIVE r is the "good" direction
      takeaway: phraseTakeaway(
        -compCvR.r,
        "days with more goals completed",
        "more stable glucose",
        "more glucose swings",
      ),
    },
  ];
}

function phraseTakeaway(
  directionalR: number,
  cohort: string,
  positivePhrase: string,
  negativePhrase: string,
): string {
  const strength =
    Math.abs(directionalR) >= 0.5
      ? "strong"
      : Math.abs(directionalR) >= 0.3
        ? "moderate"
        : "slight";
  if (directionalR > 0) {
    return `${strength} link: on ${cohort}, you see ${positivePhrase}.`;
  }
  return `${strength} link: on ${cohort}, you see ${negativePhrase}.`;
}
