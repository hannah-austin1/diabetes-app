import Link from "next/link";
import { loadFinchExport, summarizeFinch } from "@/lib/finch";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const revalidate = 3600;

export default async function FinchPage() {
  const data = await loadFinchExport();

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto px-6 pt-28 pb-16">
        <h1 className="text-4xl font-bold gradient-text mb-4">Finch Wellness</h1>
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p className="text-lg mb-2">No Finch export found.</p>
            <p className="text-sm">
              Drop a <code className="text-foreground">FinchExport_*.zip</code> at{" "}
              <code className="text-foreground">artifacts/personal-site/data/finch-export.zip</code>.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const s = summarizeFinch(data);
  const checkInPct = s.totalDays > 0 ? Math.round((s.checkedInDays / s.totalDays) * 100) : 0;
  const fullEnergyPct = s.totalDays > 0 ? Math.round((s.fullEnergyDays / s.totalDays) * 100) : 0;
  const exportDate = new Date(data.parsedAt);
  const dataStart = new Date(s.firstDay);
  const dataEnd = new Date(s.lastDay);

  return (
    <div className="max-w-6xl mx-auto px-6 pt-28 pb-16">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-3 h-3 rounded-full bg-glucose-purple animate-pulse" />
          <span className="text-sm text-muted-foreground font-mono">
            FROM FINCH BACKUP · {dataStart.toLocaleDateString()} – {dataEnd.toLocaleDateString()}
          </span>
        </div>
        <h1 className="text-5xl font-bold gradient-text mb-3">Finch Wellness</h1>
        <p className="text-muted-foreground max-w-2xl">
          Self-care, movement, and breathing — pulled straight from a Finch app export.
          Updated whenever I drop a new backup.
        </p>
      </div>

      {/* Headline stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard emoji="✅" label="Days Tracked" value={s.totalDays.toString()} sub={`${dataStart.toLocaleDateString(undefined,{month:"short",day:"numeric"})} – ${dataEnd.toLocaleDateString(undefined,{month:"short",day:"numeric"})}`} color="text-glucose-blue" />
        <StatCard emoji="🔥" label="Check-In Streak" value={s.currentStreak.toString()} sub={`longest ${s.longestStreak} days`} color="text-glucose-orange" />
        <StatCard emoji="⚡" label="Avg Energy" value={`${s.avgEnergy}`} sub="per day · max ~100" color="text-glucose-yellow" />
        <StatCard emoji="🌈" label="Rainbow Stones" value={s.totalRainbowStones.toLocaleString()} sub="peak balance" color="text-glucose-purple" />
      </div>

      {/* Activity breakdown */}
      <div className="grid md:grid-cols-3 gap-4 mb-10">
        <ActivityCard
          emoji="🏃"
          title="Movement"
          totalCount={s.movementCount}
          totalMinutes={s.movementMinutes}
          breakdown={s.movementByType}
          color="text-glucose-green"
        />
        <ActivityCard
          emoji="🌬️"
          title="Breathing"
          totalCount={s.breathingCount}
          totalMinutes={s.breathingMinutes}
          breakdown={s.breathingByType}
          color="text-glucose-blue"
        />
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⏱️</span>
              <h3 className="font-bold text-foreground">Timer Sessions</h3>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold font-mono text-foreground mb-1">
              {s.timerCount}
            </div>
            <div className="text-xs text-muted-foreground mb-4">
              {s.timerMinutes} minutes total
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Focus / meditation timers logged in the app.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily check-in stats */}
      <Card className="mb-10">
        <CardHeader>
          <h2 className="text-xl font-bold text-foreground">Daily Check-Ins</h2>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <div className="flex justify-between mb-1.5 text-sm">
              <span className="text-muted-foreground">Days I checked in</span>
              <span className="font-mono font-bold text-foreground">
                {s.checkedInDays} / {s.totalDays} ({checkInPct}%)
              </span>
            </div>
            <Progress value={checkInPct} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between mb-1.5 text-sm">
              <span className="text-muted-foreground">Days I hit full energy</span>
              <span className="font-mono font-bold text-foreground">
                {s.fullEnergyDays} / {s.totalDays} ({fullEnergyPct}%)
              </span>
            </div>
            <Progress value={fullEnergyPct} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Self-care areas */}
      {data.areas.length > 0 && (
        <div className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-4">Self-Care Areas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {data.areas
              .filter((a) => a.status === "active")
              .map((a) => (
                <Card key={a.name}>
                  <CardContent className="p-4">
                    <div className="text-2xl mb-2">{renderEmoji(a.emoji_char)}</div>
                    <div className="text-sm font-bold text-foreground mb-0.5">{a.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {a.total_stars} ⭐ · {a.total_weeks_with_three_stars} 3★ weeks
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* Auto-fetch reality check */}
      <Card className="border-glucose-yellow/20">
        <CardContent className="p-6">
          <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
            <span>🐦</span> About auto-fetch
          </h3>
          <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
            <p>
              Finch doesn&apos;t publish a public API, so this data is loaded from a manual export
              file. Three options for keeping it fresh:
            </p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>
                <strong className="text-foreground">Manual</strong> — drop a new{" "}
                <code className="text-foreground">.zip</code> in <code>data/</code> and redeploy.
              </li>
              <li>
                <strong className="text-foreground">iOS Shortcut</strong> — automate the export tap
                + email/upload to a webhook.
              </li>
              <li>
                <strong className="text-foreground">Inbox poller</strong> — if you email exports to
                a dedicated address, a small script can grab them.
              </li>
            </ol>
            <p className="pt-2">
              Last parsed: <span className="font-mono">{exportDate.toLocaleString()}</span>
            </p>
          </div>
          <div className="mt-4 flex gap-3">
            <Link
              href="/diabetes"
              className="text-sm text-primary hover:underline"
            >
              ← Back to glucose dashboard
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

function ActivityCard({
  emoji,
  title,
  totalCount,
  totalMinutes,
  breakdown,
  color,
}: {
  emoji: string;
  title: string;
  totalCount: number;
  totalMinutes: number;
  breakdown: { type: string; count: number; minutes: number }[];
  color: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{emoji}</span>
          <h3 className="font-bold text-foreground">{title}</h3>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className={`text-3xl font-bold font-mono ${color} mb-1`}>{totalCount}</div>
        <div className="text-xs text-muted-foreground mb-4">{totalMinutes} minutes total</div>
        {breakdown.length > 0 && (
          <ul className="space-y-1.5">
            {breakdown.slice(0, 5).map((b) => (
              <li key={b.type} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground capitalize truncate pr-2">
                  {humanize(b.type)}
                </span>
                <Badge variant="secondary" className="font-mono shrink-0">
                  {b.count} · {b.minutes}m
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function humanize(t: string): string {
  return t.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()).trim();
}

function renderEmoji(s: string): string {
  // Some areas store emoji_char as a name (e.g. "lotus") instead of glyph.
  const map: Record<string, string> = { lotus: "🪷" };
  return map[s] ?? s;
}
