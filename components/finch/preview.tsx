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
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">🐦</span>
        <h2 className="text-sm font-mono text-muted-foreground uppercase tracking-widest">
          Self-Care
        </h2>
      </div>
      <Link href="/finch" className="block">
        <Card className="hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group cursor-pointer card-interactive overflow-hidden">
          <CardContent className="p-0">
            <div className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-6xl font-black font-mono gradient-text">
                      {s.currentStreak}
                    </span>
                    <span className="text-sm text-muted-foreground self-end mb-1">
                      day streak
                    </span>
                    <span className="text-4xl">🔥</span>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge variant="success">
                      {s.totalGoalsCompleted.toLocaleString()} goals completed
                    </Badge>
                    <Badge variant="info">{completionPct}% rate</Badge>
                    {s.avgMoodScore !== null && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        😊 mood: {moodLabel(Math.round(s.avgMoodScore))}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <span className="text-5xl">🌟</span>
                  <div className="text-sm text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                    <span>View wellness</span>
                    <span className="group-hover:translate-x-1 transition-transform">👉</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 bg-card">
              <GoalSparkbars days={recent} />
              <div className="mt-3 flex justify-between text-xs text-muted-foreground font-mono">
                <span>✨ {s.totalGoodVibes} good vibes</span>
                <span>🏆 longest {s.longestStreak} days</span>
              </div>
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
    <div className="flex items-end gap-1.5 h-12">
      {days.map((d) => {
        const heightPct = (d.completed_goals_count / max) * 100;
        return (
          <div
            key={d.date}
            className="flex-1 flex items-end"
            title={`${d.date}: ${d.completed_goals_count}/${d.scheduled_goals_count} goals`}
          >
            <div
              className="w-full rounded-t transition-all duration-200 hover:opacity-100"
              style={{
                height: `${Math.max(8, heightPct)}%`,
                background: d.completed_goals_count === 0
                  ? "rgba(0,0,0,0.05)"
                  : "linear-gradient(to top, #8b5cf6, #ec4899)",
                opacity: 0.8,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
