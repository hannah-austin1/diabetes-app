import Link from "next/link";
import { fetchFinchData, rollupHealth, healthLabel } from "@/lib/finch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const revalidate = 3600;

export const metadata = {
  title: "Health — hgjaustin",
  description: "Activity data from Apple Health, synced via Firebase.",
};

export default async function HealthPage() {
  const days = await fetchFinchData();
  const health = rollupHealth(days);

  const firstDate = days[0]?.date;
  const lastDate = days[days.length - 1]?.date;
  const firstD = firstDate ? new Date(firstDate + "T00:00:00") : null;
  const lastD = lastDate ? new Date(lastDate + "T00:00:00") : null;

  return (
    <div className="max-w-5xl mx-auto px-6 pt-28 pb-16">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div
            className={`w-3 h-3 rounded-full animate-pulse ${
              health.length > 0 ? "bg-glucose-green" : "bg-yellow-400"
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
          Apple Health metrics rolled up day-by-day. Whatever HealthKit categories
          my phone uploads end up here automatically — nothing to configure on this
          end.
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
          {/* Top-line summary cards */}
          <div className="mb-10">
            <h2 className="text-xl font-bold text-foreground mb-4">
              Averages over the period
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {health.map((m) => {
                const meta = healthLabel(m.key);
                return (
                  <Card key={m.key}>
                    <CardContent className="p-5">
                      <div className="text-2xl mb-2">{meta.emoji}</div>
                      <div className="text-3xl font-black font-mono text-glucose-green mb-0.5">
                        {Math.round(m.avg).toLocaleString()}
                      </div>
                      <div className="text-xs font-semibold text-foreground mb-1">
                        {meta.label}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        avg/day · {m.unit}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-2">
                        {m.daysWithData} day{m.daysWithData === 1 ? "" : "s"} of data
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Per-metric daily breakdown */}
          {health.map((m) => {
            const max = Math.max(...m.perDay.map((d) => d.value), 1);
            return (
              <Card key={m.key} className="mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span>{m.emoji}</span> {m.label}
                    </CardTitle>
                    <Badge variant="secondary" className="font-mono">
                      total {Math.round(m.total).toLocaleString()} {m.unit}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-1 h-24 overflow-x-auto pb-1">
                    {m.perDay.map((d) => {
                      const heightPct = (d.value / max) * 100;
                      return (
                        <div
                          key={d.date}
                          className="flex-1 min-w-[14px] h-full flex items-end group relative"
                          title={`${d.date}: ${d.value.toLocaleString()} ${m.unit}`}
                        >
                          <div
                            className="w-full rounded-t bg-glucose-green"
                            style={{
                              height: `${Math.max(2, heightPct)}%`,
                              opacity: 0.85,
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
          })}
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
