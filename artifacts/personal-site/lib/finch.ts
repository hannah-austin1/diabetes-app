import { promises as fs } from "node:fs";
import path from "node:path";
import JSZip from "jszip";

export interface MovementSession {
  movementGroupType: string;
  dt: string;
  durationInMins: number;
  ts: number;
}

export interface BreathingSession {
  breathing_type: string;
  duration: number;
  start_time: string;
  completed_time: string;
  ts: number;
}

export interface TimerSession {
  timerTypeIndex: number;
  selectedDurationSeconds: number;
  startTime: string;
  completedTime: string;
  ts: number;
}

export interface FinchDayEntry {
  dt: string;
  date_string: string;
  energy: number;
  affection: number;
  rainbow_stones: number;
  checked_in: boolean;
  achieve_full_energy: boolean;
  ts: number;
}

export interface SelfCareArea {
  name: string;
  emoji_char: string;
  status: string;
  total_stars: number;
  total_weeks_with_three_stars: number;
}

export interface FinchData {
  movements: MovementSession[];
  breathing: BreathingSession[];
  timers: TimerSession[];
  days: FinchDayEntry[];
  areas: SelfCareArea[];
  exportPath: string;
  parsedAt: number;
}

const DEFAULT_PATH = path.join(process.cwd(), "data", "finch-export.zip");

function parseRfc1123(s: string): number {
  // "Fri, 3 Apr 2026 12:59:09" — JS Date can parse this
  const t = Date.parse(s);
  return isNaN(t) ? 0 : t;
}

function parseIsoLoose(s: string): number {
  if (!s) return 0;
  const t = Date.parse(s);
  return isNaN(t) ? parseRfc1123(s) : t;
}

async function readJson<T>(zip: JSZip, name: string): Promise<T[]> {
  const file = zip.file(name);
  if (!file) return [];
  const text = await file.async("string");
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed?.data) ? parsed.data : [];
  } catch {
    return [];
  }
}

export async function loadFinchExport(zipPath = DEFAULT_PATH): Promise<FinchData | null> {
  let buf: Buffer;
  try {
    buf = await fs.readFile(zipPath);
  } catch {
    return null;
  }

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(buf);
  } catch {
    return null;
  }

  let rawMove: Omit<MovementSession, "ts">[];
  let rawBreath: Omit<BreathingSession, "ts">[];
  let rawTimer: Omit<TimerSession, "ts">[];
  let rawDays: Omit<FinchDayEntry, "ts">[];
  let rawAreas: SelfCareArea[];
  try {
    [rawMove, rawBreath, rawTimer, rawDays, rawAreas] = await Promise.all([
      readJson<Omit<MovementSession, "ts">>(zip, "MovementSession.json"),
      readJson<Omit<BreathingSession, "ts">>(zip, "BreathingSession.json"),
      readJson<Omit<TimerSession, "ts">>(zip, "TimerSession.json"),
      readJson<Omit<FinchDayEntry, "ts">>(zip, "FinchDay.json"),
      readJson<SelfCareArea>(zip, "SelfCareArea.json"),
    ]);
  } catch {
    return null;
  }

  const movements: MovementSession[] = rawMove
    .map((m) => ({ ...m, ts: parseIsoLoose(m.dt) }))
    .filter((m) => m.ts > 0)
    .sort((a, b) => a.ts - b.ts);

  const breathing: BreathingSession[] = rawBreath
    .map((b) => ({ ...b, ts: parseRfc1123(b.start_time) }))
    .filter((b) => b.ts > 0)
    .sort((a, b) => a.ts - b.ts);

  const timers: TimerSession[] = rawTimer
    .map((t) => ({ ...t, ts: parseRfc1123(t.startTime) }))
    .filter((t) => t.ts > 0)
    .sort((a, b) => a.ts - b.ts);

  const days: FinchDayEntry[] = rawDays
    .map((d) => ({ ...d, ts: parseIsoLoose(d.dt) }))
    .filter((d) => d.ts > 0)
    .sort((a, b) => a.ts - b.ts);

  return {
    movements,
    breathing,
    timers,
    days,
    areas: rawAreas,
    exportPath: zipPath,
    parsedAt: Date.now(),
  };
}

// ── Derived stats ────────────────────────────────────────────────────────────

export interface FinchSummary {
  totalDays: number;
  checkedInDays: number;
  fullEnergyDays: number;
  avgEnergy: number;
  totalRainbowStones: number;
  movementCount: number;
  movementMinutes: number;
  breathingCount: number;
  breathingMinutes: number;
  timerCount: number;
  timerMinutes: number;
  longestStreak: number;
  currentStreak: number;
  movementByType: { type: string; count: number; minutes: number }[];
  breathingByType: { type: string; count: number; minutes: number }[];
  firstDay: number;
  lastDay: number;
}

export function summarizeFinch(d: FinchData): FinchSummary {
  const days = d.days;
  const checkedIn = days.filter((x) => x.checked_in).length;
  const fullEnergy = days.filter((x) => x.achieve_full_energy).length;
  const avgEnergy =
    days.length > 0 ? days.reduce((s, x) => s + (x.energy ?? 0), 0) / days.length : 0;
  const stones = days.length > 0 ? Math.max(...days.map((x) => x.rainbow_stones ?? 0)) : 0;

  // streaks computed from check-ins on consecutive calendar days
  const checkInDates = new Set(days.filter((x) => x.checked_in).map((x) => x.date_string));
  let longest = 0;
  let current = 0;
  let running = 0;
  let prev: number | null = null;
  for (const dStr of [...checkInDates].sort()) {
    const t = Date.parse(dStr);
    if (prev !== null && t - prev === 86_400_000) {
      running++;
    } else {
      running = 1;
    }
    if (running > longest) longest = running;
    prev = t;
  }
  current = running;

  const moveMinutes = d.movements.reduce((s, m) => s + (m.durationInMins ?? 0), 0);
  const breathSec = d.breathing.reduce((s, b) => s + (b.duration ?? 0), 0);
  const timerSec = d.timers.reduce((s, t) => s + (t.selectedDurationSeconds ?? 0), 0);

  const moveByMap = new Map<string, { count: number; minutes: number }>();
  for (const m of d.movements) {
    const key = m.movementGroupType;
    const cur = moveByMap.get(key) ?? { count: 0, minutes: 0 };
    cur.count++;
    cur.minutes += m.durationInMins;
    moveByMap.set(key, cur);
  }
  const breathByMap = new Map<string, { count: number; minutes: number }>();
  for (const b of d.breathing) {
    const cur = breathByMap.get(b.breathing_type) ?? { count: 0, minutes: 0 };
    cur.count++;
    cur.minutes += b.duration / 60;
    breathByMap.set(b.breathing_type, cur);
  }

  return {
    totalDays: days.length,
    checkedInDays: checkedIn,
    fullEnergyDays: fullEnergy,
    avgEnergy: Math.round(avgEnergy),
    totalRainbowStones: stones,
    movementCount: d.movements.length,
    movementMinutes: moveMinutes,
    breathingCount: d.breathing.length,
    breathingMinutes: Math.round(breathSec / 60),
    timerCount: d.timers.length,
    timerMinutes: Math.round(timerSec / 60),
    longestStreak: longest,
    currentStreak: current,
    movementByType: [...moveByMap.entries()]
      .map(([type, v]) => ({ type, count: v.count, minutes: v.minutes }))
      .sort((a, b) => b.minutes - a.minutes),
    breathingByType: [...breathByMap.entries()]
      .map(([type, v]) => ({ type, count: v.count, minutes: Math.round(v.minutes) }))
      .sort((a, b) => b.minutes - a.minutes),
    firstDay: days[0]?.ts ?? 0,
    lastDay: days[days.length - 1]?.ts ?? 0,
  };
}

// Plain-JSON shape safe to pass from server → client component
export interface FinchEvent {
  ts: number;
  kind: "movement" | "breathing" | "timer";
  label: string;
  durationMin: number;
}

export function eventsForWindow(d: FinchData, sinceTs: number, untilTs: number): FinchEvent[] {
  const out: FinchEvent[] = [];
  for (const m of d.movements) {
    if (m.ts >= sinceTs && m.ts <= untilTs) {
      out.push({
        ts: m.ts,
        kind: "movement",
        label: humanizeMovement(m.movementGroupType),
        durationMin: m.durationInMins,
      });
    }
  }
  for (const b of d.breathing) {
    if (b.ts >= sinceTs && b.ts <= untilTs) {
      out.push({
        ts: b.ts,
        kind: "breathing",
        label: b.breathing_type,
        durationMin: Math.max(1, Math.round(b.duration / 60)),
      });
    }
  }
  for (const t of d.timers) {
    if (t.ts >= sinceTs && t.ts <= untilTs) {
      out.push({
        ts: t.ts,
        kind: "timer",
        label: "session",
        durationMin: Math.max(1, Math.round(t.selectedDurationSeconds / 60)),
      });
    }
  }
  return out.sort((a, b) => a.ts - b.ts);
}

export function humanizeMovement(t: string): string {
  return t
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}
