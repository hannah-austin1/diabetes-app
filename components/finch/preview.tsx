import Link from "next/link";
import { summarizeFinch, moodLabel, type DailySummary } from "@/lib/finch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PreviewHeader } from "@/components/shared/preview-header";
import { SparkbarChart } from "@/components/shared/sparkbar-chart";
import { getFinchData } from "@/lib/actions";
import { ArrowRight } from "lucide-react";
import { connection } from "next/server";
import finchData from "@/data/finch.json";

const { preview } = finchData;

export async function FinchPreview() {
  await connection();
  const allDays = await getFinchData();
  const today = new Date().toISOString().slice(0, 10);
  const days = allDays.filter((d) => d.date < today);
  if (days.length === 0) return null;

  const s = summarizeFinch(days);
  const completionPct = Math.round(s.completionRate * 100);
  const recent = days.slice(-14);

  const sparkbarData = recent.map((d) => ({
    key: d.date,
    value: d.completed_goals_count,
    label: `${d.date}: ${d.completed_goals_count}/${d.scheduled_goals_count} goals`,
  }));

  return (
    <section>
      <PreviewHeader emoji={preview.emoji} title={preview.title} />
      <Link href="/finch" className="block group">
        <Card className="bg-card/50 border-border/50 card-interactive hover:border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-bold font-mono text-violet-400">
                  {s.currentStreak}
                </span>
                <span className="text-sm text-muted-foreground">{preview.streakUnit}</span>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            <div className="flex items-center gap-2 flex-wrap mb-4">
              <Badge variant="success">{s.totalGoalsCompleted.toLocaleString()} goals</Badge>
              <Badge variant="secondary">{completionPct}% rate</Badge>
              {s.avgMoodScore !== null && (
                <span className="text-xs text-muted-foreground">
                  mood: {moodLabel(Math.round(s.avgMoodScore))}
                </span>
              )}
            </div>

            <SparkbarChart
              data={sparkbarData}
              color="rgb(139, 92, 246)"
              isZero={(item) => item.value === 0}
            />
          </CardContent>
        </Card>
      </Link>
    </section>
  );
}
