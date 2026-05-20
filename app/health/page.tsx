import Link from "next/link";
import {
  rollupHealth,
  groupHealthByCategory,
  type HealthRollup,
  type BloodPressureRollup,
  type HealthCategory,
} from "@/lib/finch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getFinchData } from "@/lib/actions";

export const metadata = {
  title: "Health — hgjaustin",
  description: "Activity data from Apple Health, synced via Firebase.",
};

/* ── Category → glucose colour mapping ───────────────────────────────────── */

const CATEGORY_COLOUR: Record<HealthCategory, string> = {
  Activity: "text-glucose-green",
  "Heart & Vitals": "text-glucose-red",
  Body: "text-glucose-blue",
  "Sleep & Recovery": "text-glucose-purple",
  Nutrition: "text-glucose-orange",
  Other: "text-glucose-yellow",
};

const CATEGORY_DOT: Record<HealthCategory, string> = {
  Activity: "bg-glucose-green",
  "Heart & Vitals": "bg-glucose-red",
  Body: "bg-glucose-blue",
  "Sleep & Recovery": "bg-glucose-purple",
  Nutrition: "bg-glucose-orange",
  Other: "bg-glucose-yellow",
};

/* ── Metric card (matches FunStats / StatCard pattern from rest of app) ─── */

function MetricCard({ m }: { m: HealthRollup }) {
  const colour = CATEGORY_COLOUR[m.category];

  return (
    <Card className="hover:border-primary/30 transition-all duration-300 group">
      <CardContent className="p-5">
        <div className="text-2xl mb-2 group-hover:scale-110 transition-transform inline-block">
          {m.emoji}
        </div>
        <div className={`text-2xl font-bold font-mono ${colour} mb-1`}>
          {m.avg >= 1000
            ? Math.round(m.avg).toLocaleString()
            : m.avg >= 10
              ? Math.round(m.avg)
              : m.avg.toFixed(1)}
        </div>
        <div className="text-xs font-semibold text-foreground mb-1">
          {m.label}
        </div>
        <div className="text-xs text-muted-foreground">
          avg/day · {m.unit}
        </div>
        <div className="text-[10px] text-muted-foreground mt-1">
          {m.daysWithData} day{m.daysWithData === 1 ? "" : "s"} of data
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Blood Pressure card ─────────────────────────────────────────────────── */

function BPCard({ bp }: { bp: BloodPressureRollup }) {
  const sys = Math.round(bp.systolic);
  const dia = Math.round(bp.diastolic);
  const colour = CATEGORY_COLOUR["Heart & Vitals"];

  let status: { label: string; colour: string };
  if (sys < 120 && dia < 80) {
    status = { label: "Normal", colour: "text-glucose-green" };
  } else if (sys < 130 && dia < 80) {
    status = { label: "Elevated", colour: "text-glucose-yellow" };
  } else if (sys < 140 || dia < 90) {
    status = { label: "High Stage 1", colour: "text-glucose-orange" };
  } else {
    status = { label: "High Stage 2", colour: "text-glucose-red" };
  }

  return (
    <Card className="hover:border-primary/30 transition-all duration-300 group">
      <CardContent className="p-5">
        <div className="text-2xl mb-2 group-hover:scale-110 transition-transform inline-block">
          🩸
        </div>
        <div className="flex items-baseline gap-1 mb-1">
          <span className={`text-2xl font-bold font-mono ${colour}`}>{sys}</span>
          <span className="text-base font-bold font-mono text-muted-foreground">/</span>
          <span className={`text-2xl font-bold font-mono ${colour}`}>{dia}</span>
        </div>
        <div className="text-xs font-semibold text-foreground mb-1">
          Blood Pressure
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-semibold ${status.colour}`}>
            {status.label}
          </span>
          <span className="text-xs text-muted-foreground">· {bp.unit}</span>
        </div>
        <div className="text-[10px] text-muted-foreground mt-1">
          {bp.daysWithData} day{bp.daysWithData === 1 ? "" : "s"} of data
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Bar chart card ──────────────────────────────────────────────────────── */

function MetricChart({ m }: { m: HealthRollup }) {
  const max = Math.max(...m.perDay.map((d) => d.value), 1);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <span>{m.emoji}</span> {m.label}
          </CardTitle>
          <Badge variant="secondary" className="font-mono text-[10px]">
            total {Math.round(m.total).toLocaleString()} {m.unit}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-end gap-0.5 h-20 overflow-x-auto pb-1">
          {m.perDay.map((d) => {
            const heightPct = (d.value / max) * 100;
            return (
              <div
                key={d.date}
                className="flex-1 min-w-[10px] h-full flex items-end group relative"
                title={`${d.date}: ${d.value.toLocaleString()} ${m.unit}`}
              >
                <div
                  className="w-full rounded-t bg-glucose-green"
                  style={{
                    height: `${Math.max(2, heightPct)}%`,
                    opacity: 0.7,
                  }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] font-mono text-muted-foreground mt-2">
          <span>{m.perDay[0]?.date.slice(5)}</span>
          <span>{m.perDay[m.perDay.length - 1]?.date.slice(5)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default async function HealthPage() {
  const days = await getFinchData();
  const health = rollupHealth(days);
  const groups = groupHealthByCategory(health);

  // Flatten all metrics into one ordered list (sorted by category order)
  type GridItem =
    | { kind: "metric"; m: HealthRollup }
    | { kind: "bp"; bp: BloodPressureRollup };

  const gridItems: GridItem[] = [];
  for (const group of groups) {
    if (group.bloodPressure) {
      gridItems.push({ kind: "bp", bp: group.bloodPressure });
    }
    for (const m of group.metrics) {
      gridItems.push({ kind: "metric", m });
    }
  }

  // Categories that appear (for legend)
  const activeCategories = groups.map((g) => g.category);

  const firstDate = days[0]?.date;
  const lastDate = days[days.length - 1]?.date;
  const firstD = firstDate ? new Date(firstDate + "T00:00:00") : null;
  const lastD = lastDate ? new Date(lastDate + "T00:00:00") : null;

  return (
    <div className="max-w-6xl mx-auto px-6 pt-28 pb-16">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div
            className={`w-3 h-3 rounded-full animate-pulse ${health.length > 0 ? "bg-glucose-green" : "bg-yellow-400"
              }`}
          />
          <span className="text-sm text-muted-foreground font-mono">
            APPLE HEALTH · {health.length > 0 ? "LIVE FROM FIREBASE" : "WAITING FOR FIRST UPLOAD"}
            {firstD && lastD && (
              <> · {firstD.toLocaleDateString()} – {lastD.toLocaleDateString()}</>
            )}
          </span>
        </div>
        <h1 className="text-5xl font-bold gradient-text mb-3">My Activity</h1>
        <p className="text-muted-foreground max-w-2xl">
          Apple Health metrics rolled up day-by-day. Whatever HealthKit
          categories my phone uploads end up here automatically.
        </p>
      </div>

      {health.length === 0 ? (
        <Card className="border-yellow-500/30">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="text-3xl">⏳</div>
              <div>
                <CardTitle className="text-foreground mb-1">
                  No Apple Health metrics yet
                </CardTitle>
                <CardDescription>
                  The Firebase pipeline is reachable, but no HealthKit metrics
                  have come through in the {days.length}-day window yet. Once
                  the iOS Shortcut sends a Health snapshot, steps, energy,
                  heart rate, and friends will show up here automatically.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      ) : (
        <>
          {/* Legend */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Averages over the period
            </h2>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {activeCategories.map((cat) => (
                <div key={cat} className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${CATEGORY_DOT[cat]}`} />
                  <span className="text-xs text-muted-foreground">{cat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Single flat grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {gridItems.map((item) =>
              item.kind === "bp" ? (
                <BPCard key="bp" bp={item.bp} />
              ) : (
                <MetricCard key={item.m.key} m={item.m} />
              ),
            )}
          </div>

          {/* Daily trend charts */}
          {health.filter((m) => m.daysWithData >= 2).length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                Daily Trends
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {health
                  .filter((m) => m.daysWithData >= 2)
                  .map((m) => (
                    <MetricChart key={m.key} m={m} />
                  ))}
              </div>
            </div>
          )}
        </>
      )}

      <Card className="mt-10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="text-2xl">🔌</div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Pipeline</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                Apple Health → iOS Shortcut → Cloud Function → Firestore →{" "}
                <code className="text-foreground">getFinchData</code> → this page.
                Whatever HealthKit identifiers my phone pushes will appear above
                automatically — no per-metric config needed.
              </p>
              <div className="flex gap-4 text-sm">
                <Link href="/finch" className="text-primary hover:underline">
                  ← Finch wellness
                </Link>
                <Link href="/diabetes" className="text-primary hover:underline">
                  Glucose dashboard →
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
