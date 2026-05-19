import { pearson, dailySteps, joinDays } from "@/lib/correlation";
import type { DailySummary } from "@/lib/finch";
import type { DayGlucoseStats } from "@/lib/nightscout";

describe("pearson", () => {
  it("returns r=1 for perfectly correlated data", () => {
    const result = pearson([1, 2, 3, 4, 5], [2, 4, 6, 8, 10]);
    expect(result.r).toBeCloseTo(1.0, 5);
    expect(result.n).toBe(5);
  });

  it("returns r=-1 for perfectly inversely correlated data", () => {
    const result = pearson([1, 2, 3, 4, 5], [10, 8, 6, 4, 2]);
    expect(result.r).toBeCloseTo(-1.0, 5);
  });

  it("returns r≈0 for uncorrelated data", () => {
    const result = pearson([1, 2, 3, 4, 5], [5, 1, 4, 2, 3]);
    expect(Math.abs(result.r)).toBeLessThan(0.5);
  });

  it("returns r=0 and n=0 for empty arrays", () => {
    const result = pearson([], []);
    expect(result.r).toBe(0);
    expect(result.n).toBe(0);
  });

  it("returns r=0 and n=1 for single-element arrays", () => {
    const result = pearson([1], [2]);
    expect(result.r).toBe(0);
    expect(result.n).toBe(1);
  });

  it("handles constant values (zero variance)", () => {
    const result = pearson([5, 5, 5], [1, 2, 3]);
    expect(result.r).toBe(0);
  });

  it("uses the shorter array length", () => {
    const result = pearson([1, 2, 3, 4], [2, 4]);
    expect(result.n).toBe(2);
  });
});

describe("dailySteps", () => {
  const baseSummary: DailySummary = {
    date: "2026-05-19",
    mood: null,
    scheduled_goals_count: 0,
    completed_goals_count: 0,
    completed_goals: [],
    completed_reflections_count: 0,
    completed_reflections: [],
    good_vibes_count: 0,
    breathing_sessions_count: 0,
    health: {},
  };

  it('extracts steps from "Steps" key', () => {
    const d = { ...baseSummary, health: { Steps: { value: 8000, unit: "count", count: 1 } } };
    expect(dailySteps(d)).toBe(8000);
  });

  it('extracts steps from "StepCount" key', () => {
    const d = { ...baseSummary, health: { StepCount: { value: 5000, unit: "count", count: 1 } } };
    expect(dailySteps(d)).toBe(5000);
  });

  it('extracts steps from HKQuantityTypeIdentifier key', () => {
    const d = {
      ...baseSummary,
      health: { HKQuantityTypeIdentifierStepCount: { value: 12000, unit: "count", count: 1 } },
    };
    expect(dailySteps(d)).toBe(12000);
  });

  it("returns null when no steps data", () => {
    expect(dailySteps(baseSummary)).toBeNull();
  });
});

describe("joinDays", () => {
  it("joins Finch and glucose data by date", () => {
    const finch: DailySummary[] = [
      {
        date: "2026-05-18",
        mood: { score: 4, label: "good" },
        scheduled_goals_count: 5,
        completed_goals_count: 3,
        completed_goals: [],
        completed_reflections_count: 0,
        completed_reflections: [],
        good_vibes_count: 0,
        breathing_sessions_count: 0,
        health: {},
      },
    ];
    const glucose: DayGlucoseStats[] = [
      { date: "2026-05-18", avg: 120, stdDev: 20, tir: 80, count: 288 },
    ];

    const result = joinDays(glucose, finch);
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe("2026-05-18");
    expect(result[0].finch.mood?.score).toBe(4);
    expect(result[0].glucose.avg).toBe(120);
  });

  it("only includes days present in both datasets", () => {
    const finch: DailySummary[] = [
      {
        date: "2026-05-18",
        mood: null,
        scheduled_goals_count: 0,
        completed_goals_count: 0,
        completed_goals: [],
        completed_reflections_count: 0,
        completed_reflections: [],
        good_vibes_count: 0,
        breathing_sessions_count: 0,
        health: {},
      },
    ];
    const glucose: DayGlucoseStats[] = [
      { date: "2026-05-17", avg: 100, stdDev: 15, tir: 90, count: 288 },
    ];

    const result = joinDays(glucose, finch);
    expect(result).toHaveLength(0);
  });
});
