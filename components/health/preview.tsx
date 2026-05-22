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
      <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest mb-6">
        Apple Health
      </h2>
      <Link href="/health" className="block">
        <Card className="hover:border-border/80 hover:bg-card/80 transition-all duration-300 group cursor-pointer">
          <CardContent className="p-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-6xl font-black font-mono text-glucose-green">
                    {Math.round(primary.avg).toLocaleString()}
                  </span>
                  <span className="text-3xl">{meta.emoji}</span>
                  <span className="text-sm text-muted-foreground self-end mb-1">
                    {primary.unit}/day
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge variant="success">{meta.label} · avg</Badge>
                  <span className="text-xs text-muted-foreground">
                    {primary.daysWithData} day{primary.daysWithData === 1 ? "" : "s"} of data
                  </span>
                  {health.length > 1 && (
                    <span className="text-xs text-muted-foreground">
                      +{health.length - 1} more metric{health.length - 1 === 1 ? "" : "s"}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground mb-2 group-hover:text-foreground transition-colors">
                  View activity →
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  total {Math.round(primary.total).toLocaleString()}
                </div>
              </div>
            </div>
            <div className="mt-6">
              <HealthSparkbars recent={recent} />
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
    <div className="flex items-end gap-1 h-10">
      {recent.map((d) => {
        const heightPct = (d.value / max) * 100;
        return (
          <div
            key={d.date}
            className="flex-1 flex items-end"
            title={`${d.date}: ${d.value.toLocaleString()}`}
          >
            <div
              className="w-full rounded-t bg-glucose-green"
              style={{
                height: `${Math.max(4, heightPct)}%`,
                opacity: 0.8,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
