import Link from "next/link";
import { summarizeFinch, moodLabel, type DailySummary } from "@/lib/finch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getFinchData } from "@/lib/actions";
import { ArrowRight } from "lucide-react";

export async function FinchPreview() {
  const allDays = await getFinchData();
  const today = new Date().toISOString().slice(0, 10);
  const days = allDays.filter((d) => d.date < today);
  if (days.length === 0) return null;

  const s = summarizeFinch(days);
  const completionPct = Math.round(s.completionRate * 100);
  const recent = days.slice(-14);

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">🐦</span>
        <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest">
          Self-Care
        </h2>
      </div>
      <Link href="/finch" className="block group">
        <Card className="bg-card/50 border-border/50 card-interactive hover:border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-baseline gap-3">
                <span className="text-5xl font-bold font-mono text-violet-400">
                  {s.currentStreak}
                </span>
                <span className="text-sm text-muted-foreground">day streak</span>
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

            <GoalSparkbars days={recent} />
          </CardContent>
        </Card>
      </Link>
    </section>
  );
}

function GoalSparkbars({ days }: { days: DailySummary[] }) {
  if (days.length === 0) return null;
  const max = Math.max(...days.map((d) => d.completed_goals_count), 1);

  return (
    <div className="flex items-end gap-1 h-10">
      {days.map((d) => {
        const heightPct = (d.completed_goals_count / max) * 100;
        return (
          <div
            key={d.date}
            className="flex-1 flex items-end"
            title={`${d.date}: ${d.completed_goals_count}/${d.scheduled_goals_count} goals`}
          >
            <div
              className="w-full rounded-sm"
              style={{
                height: `${Math.max(8, heightPct)}%`,
                backgroundColor: d.completed_goals_count === 0
                  ? "hsl(var(--muted))"
                  : "rgb(139, 92, 246)",
                opacity: d.completed_goals_count === 0 ? 0.3 : 0.7,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
