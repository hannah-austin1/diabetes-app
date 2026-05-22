import Link from "next/link";
import { rollupHealth, healthLabel } from "@/lib/finch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getFinchData } from "@/lib/actions";

export async function HealthPreview() {
  const allDays = await getFinchData();
  const today = new Date().toISOString().slice(0, 10);
  const days = allDays.filter((d) => d.date < today);
  const health = rollupHealth(days);
  if (health.length === 0) return null;

  const primary = health[0];
  const meta = healthLabel(primary.key);
  const recent = primary.perDay.slice(-14);

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">🏃</span>
        <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest">
          Apple Health
        </h2>
      </div>
      <Link href="/health" className="block">
        <Card className="hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group cursor-pointer card-interactive overflow-hidden">
          <CardContent className="p-0">
            <div className="p-6 bg-gradient-to-br from-orange-500/10 to-amber-500/10">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-6xl font-black font-mono gradient-text-warm">
                      {Math.round(primary.avg).toLocaleString()}
                    </span>
                    <span className="text-4xl">{meta.emoji}</span>
                    <span className="text-sm text-muted-foreground self-end mb-1">
                      {primary.unit}/day
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge variant="success">{meta.label}</Badge>
                    <Badge variant="info">{primary.daysWithData} days tracked</Badge>
                    {health.length > 1 && (
                      <span className="text-xs text-muted-foreground">
                        +{health.length - 1} more metric{health.length - 1 === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <span className="text-5xl">💪</span>
                  <div className="text-sm text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                    <span>View activity</span>
                    <span className="group-hover:translate-x-1 transition-transform">👉</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 bg-card">
              <HealthSparkbars recent={recent} />
              <div className="mt-3 flex justify-between text-xs text-muted-foreground font-mono">
                <span>📊 14-day trend</span>
                <span>🎯 total {Math.round(primary.total).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </section>
  );
}

function HealthSparkbars({
  recent,
}: {
  recent: { date: string; value: number }[];
}) {
  if (recent.length === 0) return null;
  const max = Math.max(...recent.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1.5 h-12">
      {recent.map((d) => {
        const heightPct = (d.value / max) * 100;
        return (
          <div
            key={d.date}
            className="flex-1 flex items-end"
            title={`${d.date}: ${d.value.toLocaleString()}`}
          >
            <div
              className="w-full rounded-t transition-all duration-200 hover:opacity-100"
              style={{
                height: `${Math.max(8, heightPct)}%`,
                background: "linear-gradient(to top, #f59e0b, #10b981)",
                opacity: 0.8,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
