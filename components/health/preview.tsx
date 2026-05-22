import Link from "next/link";
import { rollupHealth, healthLabel } from "@/lib/finch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getFinchData } from "@/lib/actions";
import { ArrowRight } from "lucide-react";

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
        <span className="text-2xl">🏃</span>
        <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest">
          Apple Health
        </h2>
      </div>
      <Link href="/health" className="block group">
        <Card className="bg-card/50 border-border/50 card-interactive hover:border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-bold font-mono text-orange-400">
                  {Math.round(primary.avg).toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground">{primary.unit}/day</span>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <Badge variant="success">{meta.label}</Badge>
              <Badge variant="secondary">{primary.daysWithData} days tracked</Badge>
            </div>
            
            <HealthSparkbars recent={recent} />
          </CardContent>
        </Card>
      </Link>
    </section>
  );
}

function HealthSparkbars({ recent }: { recent: { date: string; value: number }[] }) {
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
              className="w-full rounded-sm"
              style={{
                height: `${Math.max(8, heightPct)}%`,
                backgroundColor: "rgb(249, 115, 22)",
                opacity: 0.7,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
