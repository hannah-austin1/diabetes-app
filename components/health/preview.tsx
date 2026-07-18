import Link from "next/link";
import { rollupHealth, healthLabel } from "@/lib/finch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PreviewHeader } from "@/components/shared/preview-header";
import { SparkbarChart } from "@/components/shared/sparkbar-chart";
import { getFinchData } from "@/lib/actions";
import { ArrowRight } from "lucide-react";
import { connection } from "next/server";
import healthData from "@/data/health.json";

const { preview } = healthData;

export async function HealthPreview() {
  await connection();
  const allDays = await getFinchData();
  const today = new Date().toISOString().slice(0, 10);
  const days = allDays.filter((d) => d.date < today);
  const health = rollupHealth(days);
  if (health.length === 0) return null;

  const primary = health[0];
  const meta = healthLabel(primary.key);
  const recent = primary.perDay.slice(-14);

  const sparkbarData = recent.map((d) => ({
    key: d.date,
    value: d.value,
    label: `${d.date}: ${d.value.toLocaleString()}`,
  }));

  return (
    <section>
      <PreviewHeader emoji={preview.emoji} title={preview.title} />
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
            
            <SparkbarChart
              data={sparkbarData}
              color="rgb(249, 115, 22)"
            />
          </CardContent>
        </Card>
      </Link>
    </section>
  );
}
