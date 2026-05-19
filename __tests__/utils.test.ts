import {
  toMmol,
  fmtMmol,
  glucoseColor,
  glucoseLabel,
  trendArrow,
  minutesAgo,
  eAGtoA1C,
  a1cLabel,
  startOfDayTs,
  MMOL_FACTOR,
} from "@/lib/utils";

describe("toMmol", () => {
  it("converts 100 mg/dL correctly", () => {
    expect(toMmol(100)).toBeCloseTo(5.5, 1);
  });

  it("converts 180 mg/dL (upper in-range boundary)", () => {
    expect(toMmol(180)).toBeCloseTo(10.0, 1);
  });

  it("converts 70 mg/dL (lower in-range boundary)", () => {
    expect(toMmol(70)).toBeCloseTo(3.9, 1);
  });

  it("converts 0 mg/dL to 0", () => {
    expect(toMmol(0)).toBe(0);
  });

  it("handles high values", () => {
    expect(toMmol(400)).toBeCloseTo(22.2, 1);
  });
});

describe("fmtMmol", () => {
  it("returns a string with 1 decimal place", () => {
    expect(fmtMmol(100)).toBe("5.5");
  });

  it("pads single digit decimals", () => {
    expect(fmtMmol(180)).toMatch(/^\d+\.\d$/);
  });
});

describe("glucoseColor", () => {
  it("returns red for urgent low (<55)", () => {
    expect(glucoseColor(40)).toBe("#ef4444");
  });

  it("returns orange for low (55-69)", () => {
    expect(glucoseColor(60)).toBe("#f97316");
  });

  it("returns green for in-range (70-180)", () => {
    expect(glucoseColor(100)).toBe("#22c55e");
    expect(glucoseColor(70)).toBe("#22c55e");
    expect(glucoseColor(180)).toBe("#22c55e");
  });

  it("returns yellow for high (181-250)", () => {
    expect(glucoseColor(200)).toBe("#eab308");
  });

  it("returns red for urgent high (>250)", () => {
    expect(glucoseColor(300)).toBe("#ef4444");
  });
});

describe("glucoseLabel", () => {
  it("labels urgent low", () => {
    expect(glucoseLabel(40)).toBe("URGENT LOW");
  });

  it("labels low", () => {
    expect(glucoseLabel(60)).toBe("LOW");
  });

  it("labels in range", () => {
    expect(glucoseLabel(120)).toBe("IN RANGE");
  });

  it("labels high", () => {
    expect(glucoseLabel(200)).toBe("HIGH");
  });

  it("labels urgent high", () => {
    expect(glucoseLabel(300)).toBe("URGENT HIGH");
  });
});

describe("trendArrow", () => {
  it("maps known directions", () => {
    expect(trendArrow("Flat")).toBe("→");
    expect(trendArrow("SingleUp")).toBe("↑");
    expect(trendArrow("DoubleDown")).toBe("↓↓");
    expect(trendArrow("FortyFiveUp")).toBe("↗");
  });

  it("defaults to → for null", () => {
    expect(trendArrow(null)).toBe("→");
  });

  it("defaults to → for unknown direction", () => {
    expect(trendArrow("UnknownTrend")).toBe("→");
  });
});

describe("minutesAgo", () => {
  it('returns "just now" for recent timestamps', () => {
    expect(minutesAgo(Date.now())).toBe("just now");
  });

  it('returns "1 min ago" for 1 minute', () => {
    expect(minutesAgo(Date.now() - 60000)).toBe("1 min ago");
  });

  it("returns minutes for <60 min", () => {
    expect(minutesAgo(Date.now() - 5 * 60000)).toBe("5 mins ago");
  });

  it("returns hours for >=60 min", () => {
    const result = minutesAgo(Date.now() - 90 * 60000);
    expect(result).toMatch(/^1h 30m ago$/);
  });
});

describe("eAGtoA1C", () => {
  it("calculates A1C from average glucose using ADAG formula", () => {
    // avg 154 mg/dL → ~7.0%
    expect(eAGtoA1C(154)).toBeCloseTo(7.0, 0);
  });

  it("returns correct result for normal glucose", () => {
    // avg 100 mg/dL → ~5.1%
    expect(eAGtoA1C(100)).toBeCloseTo(5.1, 0);
  });
});

describe("a1cLabel", () => {
  it("labels normal (<5.7)", () => {
    expect(a1cLabel(5.0).label).toBe("Normal");
    expect(a1cLabel(5.0).color).toBe("#22c55e");
  });

  it("labels pre-diabetes (5.7-6.4)", () => {
    expect(a1cLabel(6.0).label).toBe("Pre-diabetes");
  });

  it("labels good control (6.5-6.9)", () => {
    expect(a1cLabel(6.7).label).toBe("Good control");
  });

  it("labels fair control (7.0-7.9)", () => {
    expect(a1cLabel(7.5).label).toBe("Fair control");
  });

  it("labels needs attention (>=8.0)", () => {
    expect(a1cLabel(8.5).label).toBe("Needs attention");
  });
});

describe("startOfDayTs", () => {
  it("returns midnight timestamp for a given date", () => {
    const d = new Date(2026, 4, 19, 14, 30, 0); // May 19, 2:30pm
    const ts = startOfDayTs(d);
    const result = new Date(ts);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });

  it("does not mutate the original date", () => {
    const d = new Date(2026, 4, 19, 14, 30, 0);
    const originalHour = d.getHours();
    startOfDayTs(d);
    expect(d.getHours()).toBe(originalHour);
  });
});
