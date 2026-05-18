import Link from "next/link";
import {
  fetchFinchData,
  summarizeFinch,
  moodLabel,
  rollupHealth,
  healthLabel,
} from "@/lib/finch";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const revalidate = 3600;

export default async function FinchPage() {
  const days = await fetchFinchData();

  if (days.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 pt-28 pb-16">
        <h1 className="text-4xl font-bold gradient-text mb-4">Finch Wellness</h1>
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p className="text-lg mb-2">No Finch data available right now.</p>
            <p className="text-sm">
              The <code className="text-foreground">getFinchData</code> Cloud Function
              returned nothing — it may be cold-starting or temporarily unreachable.
              Refresh in a minute.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const s = summarizeFinch(days);
  const health = rollupHealth(days);
  const completionPct = Math.round(s.completionRate * 100);
  const checkInPct = s.totalDays > 0
    ? Math.round((s.daysWithCheckIn / s.totalDays) * 100)
    : 0;

  const firstDate = s.firstDate ? new Date(s.firstDate + "T00:00:00") : null;
  const lastDate = s.lastDate ? new Date(s.lastDate + "T00:00:00") : null;
  const lastUpdated = s.lastUpdatedTs > 0 ? new Date(s.lastUpdatedTs) : null;

  // mood timeline (last 14 days with mood)
  const moodTimeline = days
    .filter((d) => d.mood)
    .slice(-14);

  return (
    <div className="max-w-6xl mx-auto px-6 pt-28 pb-16">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="w-3 h-3 rounded-full bg-glucose-purple animate-pulse" />
          <span className="text-sm text-muted-foreground font-mono">
            FROM FIREBASE
            {firstDate && lastDate && (
              <> · {firstDate.toLocaleDateString()} – {lastDate.toLocaleDateString()}</>
            )}
          </span>
        </div>
        <h1 className="text-5xl font-bold gradient-text mb-3">Finch Wellness</h1>
        <p className="text-muted-foreground max-w-2xl">
          Daily self-care, reflections, and good vibes from Finch — synced live
          via a Cloud Function that pulls fresh data from my phone.
        </p>
      </div>

      {/* Headline stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard
          emoji="📅"
          label="Days Tracked"
          value={s.totalDays.toString()}
          sub={firstDate && lastDate
            ? `${firstDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${lastDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
            : ""
          }
          color="text-glucose-blue"
        />
        <StatCard
          emoji="🔥"
          label="Check-In Streak"
          value={s.currentStreak.toString()}
          sub={`longest ${s.longestStreak} days`}
          color="text-glucose-orange"
        />
        <StatCard
          emoji="✅"
          label="Goals Completed"
          value={s.totalGoalsCompleted.toLocaleString()}
          sub={`${s.avgGoalsPerDay.toFixed(1)}/day avg`}
          color="text-glucose-green"
        />
        <StatCard
          emoji="💛"
          label="Good Vibes"
          value={s.totalGoodVibes.toLocaleString()}
          sub="sent to friends"
          color="text-glucose-yellow"
        />
      </div>

      {/* Completion + check-in */}
      <Card className="mb-10">
        <CardHeader>
          <h2 className="text-xl font-bold text-foreground">Goal Completion</h2>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <div className="flex justify-between mb-1.5 text-sm">
              <span className="text-muted-foreground">Goals completed vs scheduled</span>
              <span className="font-mono font-bold text-foreground">
                {s.totalGoalsCompleted.toLocaleString()} / {s.totalGoalsScheduled.toLocaleString()} ({completionPct}%)
              </span>
            </div>
            <Progress value={completionPct} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between mb-1.5 text-sm">
              <span className="text-muted-foreground">Days I actually checked in</span>
              <span className="font-mono font-bold text-foreground">
                {s.daysWithCheckIn} / {s.totalDays} ({checkInPct}%)
              </span>
            </div>
            <Progress value={checkInPct} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Activity row: breathing + reflections + mood */}
      <div className="grid md:grid-cols-3 gap-4 mb-10">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌬️</span>
              <h3 className="font-bold text-foreground">Breathing</h3>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold font-mono text-glucose-blue mb-1">
              {s.totalBreathingSessions}
            </div>
            <div className="text-xs text-muted-foreground">
              sessions across {s.totalDays} days
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📝</span>
              <h3 className="font-bold text-foreground">Reflections</h3>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold font-mono text-glucose-purple mb-1">
              {s.totalReflections}
            </div>
            <div className="text-xs text-muted-foreground">
              prompts answered
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌈</span>
              <h3 className="font-bold text-foreground">Mood</h3>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold font-mono text-glucose-yellow mb-1">
              {s.avgMoodScore !== null ? s.avgMoodScore.toFixed(1) : "—"}
            </div>
            <div className="text-xs text-muted-foreground">
              {s.avgMoodScore !== null
                ? `avg · ${moodLabel(Math.round(s.avgMoodScore))} · ${s.daysWithMood} logged`
                : "no mood logged yet"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mood timeline */}
      {moodTimeline.length > 0 && (
        <Card className="mb-10">
          <CardHeader>
            <h2 className="text-xl font-bold text-foreground">Recent Mood</h2>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 overflow-x-auto pb-2">
              {moodTimeline.map((d) => {
                const score = d.mood!.score;
                const heightPct = (score / 5) * 100;
                const color =
                  score >= 4 ? "#22c55e" :
                  score === 3 ? "#eab308" :
                  score === 2 ? "#f97316" : "#ef4444";
                return (
                  <div key={d.date} className="flex flex-col items-center gap-1 min-w-[44px]">
                    <div className="h-20 w-full flex items-end">
                      <div
                        className="w-full rounded-t"
                        style={{ height: `${heightPct}%`, backgroundColor: color, opacity: 0.85 }}
                      />
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground">
                      {d.date.slice(5)}
                    </div>
                    <div className="text-[10px] text-foreground/70">{d.mood!.label}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top goals + self-care areas */}
      <div className="grid md:grid-cols-2 gap-4 mb-10">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-bold text-foreground">Most-Completed Goals</h2>
          </CardHeader>
          <CardContent className="pt-0">
            {s.topGoals.length > 0 ? (
              <ul className="space-y-2">
                {s.topGoals.map((g) => (
                  <li key={g.text} className="flex items-center justify-between text-sm gap-2">
                    <span className="flex items-center gap-2 truncate">
                      <span className="shrink-0">{g.emoji ?? "•"}</span>
                      <span className="text-foreground/90 truncate">{g.text}</span>
                    </span>
                    <Badge variant="secondary" className="font-mono shrink-0">
                      ×{g.count}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No goals logged yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-bold text-foreground">Self-Care Areas</h2>
          </CardHeader>
          <CardContent className="pt-0">
            {s.areaCounts.length > 0 ? (
              <ul className="space-y-3">
                {s.areaCounts.map((a) => {
                  const max = s.areaCounts[0].count;
                  const pct = Math.round((a.count / max) * 100);
                  return (
                    <li key={a.area}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-foreground/90 capitalize">{a.area}</span>
                        <span className="font-mono text-muted-foreground">{a.count}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-glucose-purple"
                          style={{ width: `${pct}%`, opacity: 0.85 }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Goals haven&apos;t been tagged with self-care areas yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Apple Health peek (full breakdown lives on /health) */}
      {health.length > 0 && (
        <Card className="mb-10 border-glucose-green/20">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <span>🍎</span> Apple Health Snapshot
              </h2>
              <Link href="/health" className="text-xs text-primary hover:underline">
                Full breakdown →
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {health.slice(0, 4).map((m) => {
                const meta = healthLabel(m.key);
                return (
                  <div key={m.key} className="rounded-lg bg-secondary/40 border border-border p-3">
                    <div className="text-xl mb-1">{meta.emoji}</div>
                    <div className="text-lg font-bold font-mono text-foreground">
                      {Math.round(m.avg).toLocaleString()}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {meta.label} · avg/day · {m.unit}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pipeline / about section */}
      <Card className="border-glucose-purple/20">
        <CardContent className="p-6">
          <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <span>🔌</span> How this stays fresh
          </h3>
          <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
            <p>
              An iOS Shortcut on my phone uploads my Finch export + Apple Health
              snapshot to a Firestore-backed pipeline, and a Cloud Function
              (<code className="text-foreground">getFinchData</code>) serves the rolled-up
              daily summary back to this page. The page re-fetches once an hour,
              so anything I do in the morning shows up here by mid-day.
            </p>
            {lastUpdated && (
              <p className="text-xs pt-2">
                Data freshest as of: <span className="font-mono">{lastUpdated.toLocaleString()}</span>
              </p>
            )}
          </div>
          <div className="mt-4 flex gap-4 text-sm">
            <Link href="/diabetes" className="text-primary hover:underline">
              ← Back to glucose dashboard
            </Link>
            <Link href="/health" className="text-primary hover:underline">
              Apple Health activity →
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  emoji,
  label,
  value,
  sub,
  color,
}: {
  emoji: string;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <Card className="hover:border-primary/30 transition-all duration-300 group">
      <CardContent className="p-5">
        <div className="text-3xl mb-3 group-hover:scale-110 transition-transform inline-block">
          {emoji}
        </div>
        <div className={`text-2xl font-bold font-mono ${color} mb-1`}>{value}</div>
        <div className="text-xs font-semibold text-foreground mb-1">{label}</div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </CardContent>
    </Card>
  );
}
