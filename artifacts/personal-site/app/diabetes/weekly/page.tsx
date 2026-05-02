import Link from "next/link";
import { fetchWeeklyReports } from "@/lib/nightscout";
import { fmtMmol, toMmol, a1cLabel } from "@/lib/utils";
import { WeeklyExportButton } from "@/components/diabetes/weekly-export-button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const revalidate = 3600;

export default async function WeeklyPage() {
  const weeks = await fetchWeeklyReports();

  return (
    <div className="max-w-6xl mx-auto px-6 pt-28 pb-16">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Link href="/diabetes" className="hover:text-foreground transition-colors">
            ← Glucose
          </Link>
          <span>/</span>
          <span className="text-foreground">Weekly Reports</span>
        </div>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Weekly Reports</h1>
            <p className="text-muted-foreground max-w-xl">
              13-week breakdown of your glucose data — time in range, A1C estimate,
              averages, and more. Export any week as CSV.
            </p>
          </div>
          {weeks.length > 0 && (
            <WeeklyExportButton weeks={weeks} label="Export All (CSV)" variant="all" />
          )}
        </div>
      </div>

      {weeks.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-foreground font-medium">No weekly data available yet.</p>
            <p className="text-muted-foreground text-sm mt-2">
              Data will appear here once Nightscout has enough readings.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <WeeklySummaryBanner week={weeks[0]} />

          <Card className="mt-8 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Week</TableHead>
                  <TableHead className="text-center">Avg</TableHead>
                  <TableHead className="text-center">A1C</TableHead>
                  <TableHead className="text-center">TIR</TableHead>
                  <TableHead className="text-center">High</TableHead>
                  <TableHead className="text-center">Low</TableHead>
                  <TableHead className="text-center">Peak</TableHead>
                  <TableHead className="text-center">Valley</TableHead>
                  <TableHead className="text-center">Std Dev</TableHead>
                  <TableHead className="text-center">Rides</TableHead>
                  <TableHead className="text-center">Export</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weeks.map((week, i) => {
                  const { color: a1cColor } = a1cLabel(week.a1c);
                  const tirColor =
                    week.timeInRange >= 70 ? "#22c55e"
                    : week.timeInRange >= 50 ? "#eab308" : "#ef4444";
                  return (
                    <TableRow key={week.weekStart} className={i === 0 ? "bg-secondary/30" : ""}>
                      <TableCell>
                        <div className="font-medium text-foreground">
                          {formatWeekRange(week.weekStart, week.weekEnd)}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {i === 0 && <Badge variant="info" className="text-xs">Latest</Badge>}
                          <span className="text-xs text-muted-foreground font-mono">
                            {week.readingCount} readings
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-mono font-bold text-foreground">
                        {fmtMmol(week.avgGlucose)}
                        <span className="text-muted-foreground text-xs font-normal ml-1">mmol</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-mono font-bold" style={{ color: a1cColor }}>
                          {week.a1c.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <TirPill pct={week.timeInRange} color={tirColor} />
                      </TableCell>
                      <TableCell className="text-center font-mono text-glucose-yellow">
                        {week.timeAbove}%
                      </TableCell>
                      <TableCell className="text-center font-mono text-glucose-orange">
                        {week.timeBelow}%
                      </TableCell>
                      <TableCell className="text-center font-mono text-red-400">
                        {fmtMmol(week.peakSgv)}
                      </TableCell>
                      <TableCell className="text-center font-mono text-glucose-blue">
                        {fmtMmol(week.valleySgv)}
                      </TableCell>
                      <TableCell className="text-center font-mono text-muted-foreground">
                        {toMmol(week.stdDev).toFixed(1)}
                      </TableCell>
                      <TableCell className="text-center font-mono text-glucose-purple">
                        {week.rides}
                      </TableCell>
                      <TableCell className="text-center">
                        <WeeklyExportButton weeks={[week]} label="CSV" variant="single" />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>

          <Separator className="my-6" />
          <div className="flex flex-wrap gap-6 text-xs text-muted-foreground">
            <span><span className="text-foreground">TIR</span> — Time in Range (3.9–10.0 mmol/L)</span>
            <span><span className="text-foreground">Rides</span> — In/out of range boundary crossings</span>
            <span><span className="text-foreground">Std Dev</span> — Glucose variability in mmol/L</span>
            <span>All values in mmol/L unless noted</span>
          </div>
        </>
      )}
    </div>
  );
}

function WeeklySummaryBanner({ week }: { week: Awaited<ReturnType<typeof fetchWeeklyReports>>[0] }) {
  const { label: a1cCat, color: a1cColor } = a1cLabel(week.a1c);
  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <CardDescription className="font-mono uppercase tracking-widest">
          Most Recent Week · {formatWeekRange(week.weekStart, week.weekEnd)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Stat label="Avg Glucose" value={`${fmtMmol(week.avgGlucose)} mmol`} color="text-foreground" />
          <Stat label="Est. A1C" value={`${week.a1c.toFixed(1)}%`} sub={a1cCat} hexColor={a1cColor} />
          <Stat
            label="Time in Range"
            value={`${week.timeInRange}%`}
            color={week.timeInRange >= 70 ? "text-glucose-green" : "text-glucose-yellow"}
          />
          <Stat label="Variability" value={`${toMmol(week.stdDev).toFixed(1)} mmol`} color="text-glucose-purple" />
          <Stat label="Coaster Rides" value={week.rides.toString()} color="text-glucose-orange" />
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  sub,
  color,
  hexColor,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  hexColor?: string;
}) {
  return (
    <div>
      <div
        className={`text-2xl font-black font-mono mb-0.5 ${color ?? ""}`}
        style={hexColor ? { color: hexColor } : undefined}
      >
        {value}
      </div>
      {sub && (
        <div className="text-xs mb-0.5" style={hexColor ? { color: hexColor } : undefined}>
          {sub}
        </div>
      )}
      <div className="text-xs text-muted-foreground font-mono">{label}</div>
    </div>
  );
}

function TirPill({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="inline-flex items-center gap-1.5">
      <span className="font-mono font-bold" style={{ color }}>{pct}%</span>
      <div className="w-12 h-1.5 rounded-full bg-secondary overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.7 }} />
      </div>
    </div>
  );
}

function formatWeekRange(start: number, end: number): string {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${s.toLocaleDateString("en-GB", opts)} – ${e.toLocaleDateString("en-GB", opts)}`;
}
