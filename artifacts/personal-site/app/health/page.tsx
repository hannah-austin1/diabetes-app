import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export const metadata = {
  title: "Health — hgjaustin",
  description: "Activity data from Apple Health",
};

// Placeholder stats — will be replaced by real data once Health Auto Export is configured
const PLACEHOLDER_STATS = {
  steps: { today: 8_241, weekly_avg: 9_103, goal: 10_000 },
  activeEnergy: { today: 487, weekly_avg: 512, unit: "kcal" },
  standHours: { today: 10, goal: 12 },
  restingHR: { today: 62, unit: "bpm" },
  sleepHours: { lastNight: 7.2, weekly_avg: 6.9 },
  workouts: [
    { type: "Walk", duration: 38, date: "Today", energy: 182 },
    { type: "Strength", duration: 45, date: "Yesterday", energy: 310 },
    { type: "Walk", duration: 25, date: "2 days ago", energy: 120 },
  ],
};

const SETUP_STEPS = [
  {
    step: 1,
    title: "Download Health Auto Export",
    description: "Get the app from the App Store. It's the best way to push Apple Health data to a custom endpoint.",
    badge: "App Store",
    badgeVariant: "info" as const,
    icon: "📱",
  },
  {
    step: 2,
    title: "Configure the webhook",
    description: 'In Health Auto Export, add a new REST API endpoint pointing to your site\'s /api/health endpoint.',
    badge: "REST API",
    badgeVariant: "secondary" as const,
    icon: "🔗",
  },
  {
    step: 3,
    title: "Select your metrics",
    description: "Choose Steps, Active Energy, Heart Rate, Sleep, Workouts — whatever you want displayed here.",
    badge: "Pick metrics",
    badgeVariant: "secondary" as const,
    icon: "✅",
  },
  {
    step: 4,
    title: "Set the export schedule",
    description: "Health Auto Export can push data automatically — every hour, every day, or on demand.",
    badge: "Auto sync",
    badgeVariant: "success" as const,
    icon: "⚡",
  },
];

export default function HealthPage() {
  const { steps, activeEnergy, standHours, restingHR, sleepHours, workouts } = PLACEHOLDER_STATS;
  const stepsPct = Math.min(100, Math.round((steps.today / steps.goal) * 100));

  return (
    <div className="max-w-5xl mx-auto px-6 pt-28 pb-16">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse" />
          <span className="text-sm text-muted-foreground font-mono">APPLE HEALTH · SETUP REQUIRED</span>
        </div>
        <h1 className="text-5xl font-bold gradient-text mb-3">My Activity</h1>
        <p className="text-muted-foreground max-w-2xl">
          Steps, workouts, heart rate, and sleep from Apple Health. Live data shows here
          once the Health Auto Export app is configured — see setup guide below.
        </p>
      </div>

      {/* Setup notice */}
      <Card className="border-yellow-500/30 mb-10">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="text-3xl">🔧</div>
            <div>
              <CardTitle className="text-foreground mb-1">Apple Health Bridge Required</CardTitle>
              <CardDescription>
                Apple Health is sandboxed to native iOS — there is no public web API.
                The best bridge is{" "}
                <a
                  href="https://www.healthexportapp.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  Health Auto Export
                </a>{" "}
                (iOS), which POSTs your data to any REST endpoint.
                The stats below are placeholders showing what will appear once connected.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Placeholder stats */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
          Today&apos;s Activity
          <Badge variant="warning">Preview</Badge>
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Steps */}
          <Card>
            <CardContent className="p-5">
              <div className="text-2xl mb-2">🚶</div>
              <div className="text-3xl font-black font-mono text-glucose-green mb-0.5">
                {steps.today.toLocaleString()}
              </div>
              <div className="text-xs font-semibold text-foreground mb-1">Steps</div>
              <div className="text-xs text-muted-foreground mb-2">Goal: {steps.goal.toLocaleString()}</div>
              <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-glucose-green"
                  style={{ width: `${stepsPct}%`, opacity: 0.8 }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1">{stepsPct}% of goal</div>
            </CardContent>
          </Card>

          {/* Active Energy */}
          <Card>
            <CardContent className="p-5">
              <div className="text-2xl mb-2">🔥</div>
              <div className="text-3xl font-black font-mono text-glucose-orange mb-0.5">
                {activeEnergy.today}
              </div>
              <div className="text-xs font-semibold text-foreground mb-1">Active Energy</div>
              <div className="text-xs text-muted-foreground">
                {activeEnergy.unit} · avg {activeEnergy.weekly_avg} {activeEnergy.unit}/day
              </div>
            </CardContent>
          </Card>

          {/* Stand Hours */}
          <Card>
            <CardContent className="p-5">
              <div className="text-2xl mb-2">🧍</div>
              <div className="text-3xl font-black font-mono text-glucose-blue mb-0.5">
                {standHours.today}
              </div>
              <div className="text-xs font-semibold text-foreground mb-1">Stand Hours</div>
              <div className="text-xs text-muted-foreground">Goal: {standHours.goal}h</div>
            </CardContent>
          </Card>

          {/* Resting HR */}
          <Card>
            <CardContent className="p-5">
              <div className="text-2xl mb-2">❤️</div>
              <div className="text-3xl font-black font-mono text-red-400 mb-0.5">
                {restingHR.today}
              </div>
              <div className="text-xs font-semibold text-foreground mb-1">Resting HR</div>
              <div className="text-xs text-muted-foreground">{restingHR.unit}</div>
            </CardContent>
          </Card>
        </div>

        {/* Sleep + Workouts */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Sleep */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span>😴</span> Sleep
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-end gap-3 mb-2">
                <div className="text-4xl font-black font-mono text-glucose-purple">
                  {sleepHours.lastNight}h
                </div>
                <div className="text-xs text-muted-foreground mb-1.5">last night</div>
              </div>
              <div className="text-sm text-muted-foreground">
                Weekly average: <span className="text-foreground font-mono">{sleepHours.weekly_avg}h</span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Workouts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span>💪</span> Recent Workouts
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {workouts.map((w, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-foreground">{w.type}</div>
                    <div className="text-xs text-muted-foreground">{w.date} · {w.duration} min</div>
                  </div>
                  <Badge variant="secondary" className="font-mono">
                    {w.energy} kcal
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator className="my-10" />

      {/* Setup guide */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-2">How to Connect Apple Health</h2>
        <p className="text-muted-foreground text-sm mb-8">
          Follow these steps to get real live data showing here instead of the placeholders above.
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          {SETUP_STEPS.map((s) => (
            <Card key={s.step} className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-bold font-mono text-primary">
                    {s.step}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{s.icon}</span>
                      <h3 className="font-semibold text-foreground text-sm">{s.title}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                      {s.description}
                    </p>
                    <Badge variant={s.badgeVariant}>{s.badge}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-6 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="text-2xl">🔌</div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">API Endpoint Ready</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                  Once you configure Health Auto Export, point it at:
                </p>
                <code className="text-xs bg-secondary px-3 py-2 rounded-lg font-mono text-primary block">
                  POST /api/health
                </code>
                <p className="text-xs text-muted-foreground mt-2">
                  The API server will store your metrics and this page will show live data automatically.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
