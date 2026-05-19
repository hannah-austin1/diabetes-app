import type { DayGlucoseStats } from "@/lib/nightscout";
import type { DailySummary } from "@/lib/finch";
import { dailySteps, joinDays, buildCorrelations, type CorrelationPair } from "@/lib/correlation";
import { Card, CardContent } from "@/components/ui/card";
import { fmtMmol } from "@/lib/utils";

interface Props {
  glucoseDays: DayGlucoseStats[];
  finchDays: DailySummary[];
}

const MIN_N = 7;
const MIN_R = 0.2;

const MOOD_EMOJI: Record<number, string> = {
  1: "😖",
  2: "😟",
  3: "😐",
  4: "🙂",
  5: "😄",
};

function tirColor(tir: number): string {
  if (tir >= 70) return "text-glucose-green";
  if (tir >= 50) return "text-glucose-yellow";
  return "text-glucose-orange";
}

function formatShortDate(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function WellnessGlucose({ glucoseDays, finchDays }: Props) {
  const joined = joinDays(glucoseDays, finchDays);
  if (joined.length === 0) return null;

  // Cap at the trailing 30 days
  const recent = joined.slice(-30);
  const correlations = buildCorrelations(recent);
  const shown = correlations.filter(
    (c) => c.n >= MIN_N && Math.abs(c.r) >= MIN_R,
  );

  const maxSteps = Math.max(
    ...recent.map((j) => dailySteps(j.finch) ?? 0),
    1,
  );
  const maxGoals = Math.max(
    ...recent.map((j) => j.finch.completed_goals_count),
    1,
  );

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold text-foreground mb-2">
        Last 30 Days · Wellness vs Glucose
      </h2>
      <p className="text-muted-foreground text-sm mb-6">
        Mood, steps, and goal completions lined up against your daily
        time-in-range — {recent.length} day{recent.length === 1 ? "" : "s"} of overlap.
      </p>

      {/* Daily strip */}
      <Card className="mb-6 overflow-hidden">
        <CardContent className="p-0">
          <div className="sticky top-0 z-10 grid grid-cols-[120px_56px_1fr_64px_1fr_72px] gap-3 px-4 py-3 border-b border-border bg-card/95 backdrop-blur-sm text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            <span>Day</span>
            <span>Mood</span>
            <span>Steps</span>
            <span className="text-right">Goals</span>
            <span>Glucose</span>
            <span className="text-right">TIR</span>
          </div>
          <div className="divide-y divide-border/60">
            {recent.map((j) => {
              const steps = dailySteps(j.finch);
              const stepsPct = steps !== null ? (steps / maxSteps) * 100 : 0;
              const goalsPct =
                maxGoals > 0
                  ? (j.finch.completed_goals_count / maxGoals) * 100
                  : 0;
              const mood = j.finch.mood?.score ?? null;

              return (
                <div
                  key={j.date}
                  className="grid grid-cols-[120px_56px_1fr_64px_1fr_72px] gap-3 px-4 py-2.5 items-center hover:bg-card/60 transition-colors"
                >
                  <div className="text-xs font-mono text-foreground">
                    {formatShortDate(j.date)}
                  </div>
                  <div className="flex items-center justify-center gap-1 leading-none" title={j.finch.mood?.label ?? "no mood logged"}>
                    {mood !== null ? (
                      <>
                        <span className="text-lg">{MOOD_EMOJI[mood] ?? "·"}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">{mood}</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground/40">—</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {steps !== null ? (
                      <>
                        <div className="flex-1 h-2 rounded-full bg-secondary/40 overflow-hidden">
                          <div
                            className="h-full bg-glucose-green/80"
                            style={{ width: `${Math.max(2, stepsPct)}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-muted-foreground w-14 text-right">
                          {steps.toLocaleString()}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground/40 text-xs">—</span>
                    )}
                  </div>
                  <div className="text-right">
                    {j.finch.completed_goals_count > 0 ? (
                      <div className="inline-flex items-center gap-1.5">
                        <div className="w-1 h-3 rounded-full bg-glucose-purple/80" style={{ height: `${Math.max(4, goalsPct * 0.16)}px` }} />
                        <span className="text-xs font-mono text-foreground">
                          {j.finch.completed_goals_count}
                          <span className="text-muted-foreground/60">/{j.finch.scheduled_goals_count}</span>
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground/40 text-xs">—</span>
                    )}
                  </div>
                  <DaySparkline values={j.glucose.sparkline} />
                  <div className={`text-right text-sm font-bold font-mono ${tirColor(j.glucose.tir)}`}>
                    {j.glucose.tir}%
                    <div className="text-[9px] font-normal text-muted-foreground">
                      avg {fmtMmol(j.glucose.avg)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Correlation cards */}
      {shown.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shown.map((c) => (
            <CorrelationCard key={c.id} pair={c} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-5 text-center text-sm text-muted-foreground">
            No strong correlations yet — keep logging and they&apos;ll surface here
            once there&apos;s enough signal (at least {MIN_N} matching days and |r| ≥ {MIN_R}).
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DaySparkline({ values }: { values: number[] }) {
  if (values.length === 0) return <div />;
  const w = 100;
  const h = 24;
  const min = 40;
  const max = 320;
  const range = max - min;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y.toFixed(1)}`;
    })
    .join(" ");

  // Range band (70–180 mg/dL)
  const yLow = h - ((70 - min) / range) * h;
  const yHigh = h - ((180 - min) / range) * h;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-6">
      <rect
        x={0}
        y={yHigh}
        width={w}
        height={yLow - yHigh}
        fill="rgba(34, 197, 94, 0.08)"
      />
      <polyline
        points={points}
        fill="none"
        stroke="rgba(79,142,247,0.85)"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function CorrelationCard({ pair }: { pair: CorrelationPair }) {
  const { title, xLabel, yLabel, points, r, n, takeaway } = pair;
  const rDisplay = (r >= 0 ? "+" : "") + r.toFixed(2);
  const rColor =
    Math.abs(r) >= 0.5
      ? "text-glucose-green"
      : Math.abs(r) >= 0.3
        ? "text-glucose-blue"
        : "text-glucose-yellow";

  // Compute scatter scaling
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const padX = (maxX - minX) * 0.08 || 1;
  const padY = (maxY - minY) * 0.08 || 1;
  const xLo = minX - padX;
  const xHi = maxX + padX;
  const yLo = minY - padY;
  const yHi = maxY + padY;
  const W = 100;
  const H = 60;
  const fx = (x: number) => ((x - xLo) / (xHi - xLo)) * W;
  const fy = (y: number) => H - ((y - yLo) / (yHi - yLo)) * H;

  // Regression line using means
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  const slope = den !== 0 ? num / den : 0;
  const intercept = my - slope * mx;
  const lineX1 = xLo;
  const lineX2 = xHi;
  const lineY1 = slope * lineX1 + intercept;
  const lineY2 = slope * lineX2 + intercept;

  return (
    <Card className="hover:border-primary/30 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              {title}
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-3xl font-black font-mono ${rColor}`}>
                {rDisplay}
              </span>
              <span className="text-xs text-muted-foreground">
                Pearson r · n={n}
              </span>
            </div>
          </div>
          <svg viewBox={`-2 -2 ${W + 4} ${H + 4}`} className="w-28 h-16 shrink-0">
            <rect x={-2} y={-2} width={W + 4} height={H + 4} fill="rgba(255,255,255,0.02)" rx={4} />
            <line
              x1={fx(lineX1)}
              y1={fy(lineY1)}
              x2={fx(lineX2)}
              y2={fy(lineY2)}
              stroke="rgba(79,142,247,0.55)"
              strokeWidth="1"
              strokeDasharray="3 2"
              vectorEffect="non-scaling-stroke"
            />
            {points.map((p, i) => (
              <circle
                key={i}
                cx={fx(p.x)}
                cy={fy(p.y)}
                r={1.6}
                fill="#a855f7"
                opacity={0.8}
              />
            ))}
          </svg>
        </div>
        <p className="text-sm text-foreground/90 leading-snug">{takeaway}</p>
        <p className="text-[10px] font-mono text-muted-foreground mt-2">
          x: {xLabel} · y: {yLabel}
        </p>
      </CardContent>
    </Card>
  );
}
