import { computeStats, type NightscoutReading } from "@/lib/nightscout";

function makeReading(sgv: number, date: number = Date.now(), direction = "Flat"): NightscoutReading {
  return {
    _id: `test-${date}`,
    sgv,
    date,
    dateString: new Date(date).toISOString(),
    trend: 4,
    direction,
    device: "test",
    type: "sgv",
  };
}

describe("computeStats", () => {
  it("returns default stats for empty readings", () => {
    const stats = computeStats([]);
    expect(stats.totalReadings).toBe(0);
    expect(stats.a1c).toBe(0);
    expect(stats.currentSgv).toBeNull();
  });

  it("computes correct average glucose", () => {
    const readings = [
      makeReading(100),
      makeReading(200),
      makeReading(150),
    ];
    const stats = computeStats(readings);
    expect(stats.avgGlucose).toBe(150);
  });

  it("computes time in range correctly", () => {
    const readings = [
      makeReading(100), // in range
      makeReading(120), // in range
      makeReading(200), // above
      makeReading(50),  // below
    ];
    const stats = computeStats(readings);
    expect(stats.timeInRange).toBe(50); // 2/4 = 50%
    expect(stats.timeAbove).toBe(25);   // 1/4 = 25%
    expect(stats.timeBelow).toBe(25);   // 1/4 = 25%
  });

  it("computes A1C using ADAG formula", () => {
    // All readings at 154 mg/dL → A1C ≈ 7.0
    const readings = Array.from({ length: 10 }, () => makeReading(154));
    const stats = computeStats(readings);
    expect(stats.a1c).toBeCloseTo(7.0, 0);
  });

  it("returns current SGV from first reading", () => {
    const readings = [
      makeReading(120, Date.now()),
      makeReading(100, Date.now() - 300000),
    ];
    const stats = computeStats(readings);
    expect(stats.currentSgv).toBe(120);
  });

  it("computes standard deviation", () => {
    // All same value → stdDev = 0
    const readings = Array.from({ length: 5 }, () => makeReading(100));
    const stats = computeStats(readings);
    expect(stats.stdDev).toBe(0);
  });

  it("handles 100% in range", () => {
    const readings = [
      makeReading(80),
      makeReading(120),
      makeReading(170),
    ];
    const stats = computeStats(readings);
    expect(stats.timeInRange).toBe(100);
    expect(stats.timeAbove).toBe(0);
    expect(stats.timeBelow).toBe(0);
  });

  it("handles single reading", () => {
    const stats = computeStats([makeReading(100)]);
    expect(stats.totalReadings).toBe(1);
    expect(stats.avgGlucose).toBe(100);
    expect(stats.timeInRange).toBe(100);
  });
});
