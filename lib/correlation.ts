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

// ── Cohort / tertile analysis ────────────────────────────────────────────────

export interface CohortStats {
  /** Human label for this bucket, e.g. "Low (≤6.2k)" */
  label: string;
  /** Range of the bucketing metric covered by this bucket. */
  rangeText: string;
  n: number;
  meanTir: number;
  meanAvg: number; // mg/dL
  meanCv: number;
}

export interface CohortAnalysis {
  id: string;
  /** Metric the days were bucketed by, e.g. "Steps". */
  metric: string;
  /** What each bucket looked like, ordered low → high. */
  buckets: CohortStats[];
  /** TIR gap between top and bottom buckets (top − bottom). Positive = more in-range on high-metric days. */
  tirDelta: number;
  /** Avg glucose gap (top − bottom), mg/dL. */
  avgDelta: number;
  /** Plain-English summary of the strongest gap. */
  takeaway: string;
}

interface MetricSpec {
  id: string;
  metric: string;
  /** Returns the metric value for a given day, or null if missing. */
  getValue: (j: JoinedDay) => number | null;
  /** Format the metric value for the bucket label. */
  formatValue: (v: number) => string;
  /** Whether higher metric values are expected to improve glucose (used for takeaway phrasing). */
  higherIsBetter: boolean;
}

function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

/**
 * Split `values` (already sorted ascending) into 3 buckets of roughly equal size.
 * Returns the cut points [c1, c2] such that bucket 0 = v ≤ c1, bucket 1 = c1 < v ≤ c2, bucket 2 = v > c2.
 */
function tertileCutpoints(sorted: number[]): [number, number] {
  const n = sorted.length;
  const i1 = Math.floor(n / 3);
  const i2 = Math.floor((2 * n) / 3);
  return [sorted[Math.max(0, i1 - 1)], sorted[Math.max(0, i2 - 1)]];
}

function bucketDays(
  joined: JoinedDay[],
  spec: MetricSpec,
): CohortAnalysis | null {
  const withValue = joined
    .map((j) => {
      const v = spec.getValue(j);
      return v === null ? null : { j, v };
    })
    .filter((x): x is { j: JoinedDay; v: number } => x !== null);

  // Need at least 6 days so each tertile has ≥2 days worth talking about.
  if (withValue.length < 6) return null;

  const sortedVals = withValue.map((x) => x.v).slice().sort((a, b) => a - b);
  const [c1, c2] = tertileCutpoints(sortedVals);
  if (c1 === c2 && sortedVals[0] === sortedVals[sortedVals.length - 1]) {
    // No variance in the metric — nothing to say.
    return null;
  }

  const low: JoinedDay[] = [];
  const mid: JoinedDay[] = [];
  const high: JoinedDay[] = [];
  for (const { j, v } of withValue) {
    if (v <= c1) low.push(j);
    else if (v <= c2) mid.push(j);
    else high.push(j);
  }

  const lowVals = withValue.filter((x) => x.v <= c1).map((x) => x.v);
  const midVals = withValue.filter((x) => x.v > c1 && x.v <= c2).map((x) => x.v);
  const highVals = withValue.filter((x) => x.v > c2).map((x) => x.v);

  function statsFor(days: JoinedDay[], vals: number[], label: string): CohortStats {
    const tirs = days.map((j) => j.glucose.tir);
    const avgs = days.map((j) => j.glucose.avg);
    const cvs = days.map((j) => j.glucose.cv);
    const lo = vals.length > 0 ? Math.min(...vals) : 0;
    const hi = vals.length > 0 ? Math.max(...vals) : 0;
    const rangeText =
      vals.length === 0
        ? "—"
        : lo === hi
          ? spec.formatValue(lo)
          : `${spec.formatValue(lo)}–${spec.formatValue(hi)}`;
    return {
      label,
      rangeText,
      n: days.length,
      meanTir: Math.round(mean(tirs)),
      meanAvg: Math.round(mean(avgs)),
      meanCv: Math.round(mean(cvs) * 10) / 10,
    };
  }

  const buckets: CohortStats[] = [
    statsFor(low, lowVals, "Low"),
    statsFor(mid, midVals, "Mid"),
    statsFor(high, highVals, "High"),
  ];

  const tirDelta = buckets[2].meanTir - buckets[0].meanTir;
  const avgDelta = buckets[2].meanAvg - buckets[0].meanAvg;

  // Phrase the strongest direction. For metrics where higher is better we
  // expect tirDelta > 0; for metrics where higher is worse (none today) we'd
  // flip it. We use TIR as the primary outcome.
  const absTir = Math.abs(tirDelta);
  const direction = tirDelta >= 0 ? "more" : "less";
  const verdict =
    absTir >= 10
      ? "clear gap"
      : absTir >= 5
        ? "modest gap"
        : "small gap";

  const takeaway = spec.higherIsBetter
    ? `${verdict}: your high-${spec.metric.toLowerCase()} days average ${buckets[2].meanTir}% TIR vs ${buckets[0].meanTir}% on low-${spec.metric.toLowerCase()} days (${direction} time in range on the high side).`
    : `${verdict}: high-${spec.metric.toLowerCase()} days average ${buckets[2].meanTir}% TIR vs ${buckets[0].meanTir}% on low-${spec.metric.toLowerCase()} days.`;

  return {
    id: spec.id,
    metric: spec.metric,
    buckets,
    tirDelta,
    avgDelta,
    takeaway,
  };
}

export function buildCohortAnalyses(joined: JoinedDay[]): CohortAnalysis[] {
  const specs: MetricSpec[] = [
    {
      id: "steps",
      metric: "Steps",
      getValue: (j) => dailySteps(j.finch),
      formatValue: (v) =>
        v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${Math.round(v)}`,
      higherIsBetter: true,
    },
    {
      id: "mood",
      metric: "Mood",
      getValue: (j) =>
        j.finch.mood && typeof j.finch.mood.score === "number"
          ? j.finch.mood.score
          : null,
      formatValue: (v) => v.toFixed(1),
      higherIsBetter: true,
    },
    {
      id: "goals",
      metric: "Goals %",
      getValue: (j) =>
        j.finch.scheduled_goals_count > 0
          ? j.finch.completed_goals_count / j.finch.scheduled_goals_count
          : null,
      formatValue: (v) => `${Math.round(v * 100)}%`,
      higherIsBetter: true,
    },
  ];

  return specs
    .map((s) => bucketDays(joined, s))
    .filter((x): x is CohortAnalysis => x !== null);
}
