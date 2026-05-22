import Link from "next/link";
import { summarizeFinch, moodLabel, type DailySummary } from "@/lib/finch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getFinchData } from "@/lib/actions";

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
      <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest mb-6">
        Self-Care · Finch
      </h2>
      <Link href="/finch" className="block">
        <Card className="hover:border-border/80 hover:bg-card/80 transition-all duration-300 group cursor-pointer">
          <CardContent className="p-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-6xl font-black font-mono text-glucose-green">
                    {s.currentStreak}
                  </span>
                  <span className="text-sm text-muted-foreground self-end mb-1">
                    day streak
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge variant="success">
                    {s.totalGoalsCompleted.toLocaleString()} goals · {completionPct}%
                  </Badge>
                  {s.avgMoodScore !== null && (
                    <span className="text-xs text-muted-foreground">
                      mood: {moodLabel(Math.round(s.avgMoodScore))}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {s.totalGoodVibes} good vibes
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground mb-2 group-hover:text-foreground transition-colors">
                  View Finch dashboard →
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  longest {s.longestStreak} days
                </div>
              </div>
            </div>
            <div className="mt-6">
              <GoalSparkbars days={recent} />
            </div>
          </CardContent>
        </Card>
      </Link>
    </section>
  );
}

function GoalSparkbars({
  days,
}: {
  days: DailySummary[];
}) {
  if (days.length === 0) return null;
  const max = Math.max(...days.map((d) => d.completed_goals_count), 1);

  return (
    <div className="flex items-end gap-1 h-10">
      {days.map((d) => {
        const heightPct = (d.completed_goals_count / max) * 100;
        const color =
          d.completed_goals_count === 0
            ? "rgba(255,255,255,0.05)"
            : "rgba(168, 85, 247, 0.75)";
        return (
          <div
            key={d.date}
            className="flex-1 flex items-end"
            title={`${d.date}: ${d.completed_goals_count}/${d.scheduled_goals_count} goals`}
          >
            <div
              className="w-full rounded-t"
              style={{
                height: `${Math.max(4, heightPct)}%`,
                backgroundColor: color,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
