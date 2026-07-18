import Link from "next/link";
import {
  summarizeFinch,
  moodLabel,
} from "@/lib/finch";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SectionHeader } from "@/components/shared/section-header";
import { StatCard } from "@/components/shared/stat-card";
import { getFinchData } from "@/lib/actions";
import { Suspense } from "react";
import { connection } from "next/server";
import finchContent from "@/data/finch.json";

export default function FinchPage() {
  return (
    <Suspense fallback={
      <div className="max-w-6xl mx-auto px-6 pt-28 pb-16">
        <div className="rounded-xl border border-border bg-card/50 p-8 animate-pulse">
          <div className="h-4 w-24 bg-secondary rounded mb-6" />
          <div className="h-16 w-48 bg-secondary rounded mb-4" />
          <div className="h-3 w-64 bg-secondary/60 rounded" />
        </div>
      </div>
    }>
      <FinchContent />
    </Suspense>
  );
}

async function FinchContent() {
  await connection();
  const allDays = await getFinchData();
  const today = new Date().toISOString().slice(0, 10);
  const days = allDays.filter((d) => d.date < today);

  if (days.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 pt-28 pb-16">
        <h1 className="text-4xl font-bold gradient-text mb-4">{finchContent.emptyState.title}</h1>
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p className="text-lg mb-2">{finchContent.emptyState.message}</p>
            <p className="text-sm">
              {finchContent.emptyState.detail}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const s = summarizeFinch(days);
  const completionPct = Math.round(s.completionRate * 100);
  const checkInPct = s.totalDays > 0
    ? Math.round((s.daysWithCheckIn / s.totalDays) * 100)
    : 0;

  const firstDate = s.firstDate ? new Date(s.firstDate + "T00:00:00") : null;
  const lastDate = s.lastDate ? new Date(s.lastDate + "T00:00:00") : null;

  const dateRange = firstDate && lastDate
    ? `${firstDate.toLocaleDateString("en-GB")} – ${lastDate.toLocaleDateString("en-GB")}`
    : undefined;

  // mood timeline (last 14 days with mood)
  const moodTimeline = days
    .filter((d) => d.mood)
    .slice(-14);

  const statValues = [
    {
      ...finchContent.stats[0],
      value: s.totalDays.toString(),
      sub: firstDate && lastDate
        ? `${firstDate.toLocaleDateString("en-GB", { month: "short", day: "numeric" })} – ${lastDate.toLocaleDateString("en-GB", { month: "short", day: "numeric" })}`
        : "",
    },
    {
      ...finchContent.stats[1],
      value: s.currentStreak.toString(),
      sub: `longest ${s.longestStreak} days`,
    },
    {
      ...finchContent.stats[2],
      value: s.totalGoalsCompleted.toLocaleString(),
      sub: `${s.avgGoalsPerDay.toFixed(1)}/day avg`,
    },
    {
      ...finchContent.stats[3],
      value: s.totalGoodVibes.toLocaleString(),
    },
  ];

  const { sections } = finchContent;

  return (
    <div className="max-w-6xl mx-auto px-6 pt-28 pb-16">
      <SectionHeader
        statusColor={finchContent.header.statusColor}
        statusLabel={finchContent.header.statusLabel}
        dateRange={dateRange}
        title={finchContent.header.title}
        description={finchContent.header.description}
      />

      {/* Headline stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {statValues.map((stat) => (
          <StatCard
            key={stat.label}
            emoji={stat.emoji}
            label={stat.label}
            value={stat.value}
            sub={stat.sub}
            color={stat.color}
          />
        ))}
      </div>

      {/* Completion + check-in */}
      <Card className="mb-10">
        <CardHeader>
          <h2 className="text-xl font-bold text-foreground">{sections.goalCompletion.title}</h2>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <div className="flex justify-between mb-1.5 text-sm">
              <span className="text-muted-foreground">{sections.goalCompletion.goalsLabel}</span>
              <span className="font-mono font-bold text-foreground">
                {s.totalGoalsCompleted.toLocaleString()} / {s.totalGoalsScheduled.toLocaleString()} ({completionPct}%)
              </span>
            </div>
            <Progress value={completionPct} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between mb-1.5 text-sm">
              <span className="text-muted-foreground">{sections.goalCompletion.checkInLabel}</span>
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
              <span className="text-2xl">{sections.activities.breathing.emoji}</span>
              <h3 className="font-bold text-foreground">{sections.activities.breathing.title}</h3>
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
              <span className="text-2xl">{sections.activities.reflections.emoji}</span>
              <h3 className="font-bold text-foreground">{sections.activities.reflections.title}</h3>
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
              <span className="text-2xl">{sections.activities.mood.emoji}</span>
              <h3 className="font-bold text-foreground">{sections.activities.mood.title}</h3>
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
            <h2 className="text-xl font-bold text-foreground">{sections.recentMood.title}</h2>
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
                      {`${d.date.slice(8)}/${d.date.slice(5, 7)}`}
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
            <h2 className="text-lg font-bold text-foreground">{sections.topGoals.title}</h2>
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
              <p className="text-sm text-muted-foreground">{sections.topGoals.empty}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-bold text-foreground">{sections.selfCareAreas.title}</h2>
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
                {sections.selfCareAreas.empty}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick nav */}
      <div className="flex gap-4 text-sm">
        <Link href={finchContent.nav.left.href} className="text-primary hover:underline">
          {finchContent.nav.left.label}
        </Link>
        <Link href={finchContent.nav.right.href} className="text-primary hover:underline">
          {finchContent.nav.right.label}
        </Link>
      </div>
    </div>
  );
}
