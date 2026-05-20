"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getLatestGlucose } from "@/lib/client-actions";

interface GlucoseState {
  sgv: number;
  direction: string;
  minutesAgo: number;
}

const ARROWS: Record<string, string> = {
  DoubleUp: "⇈",
  SingleUp: "↑",
  FortyFiveUp: "↗",
  Flat: "→",
  FortyFiveDown: "↘",
  SingleDown: "↓",
  DoubleDown: "⇊",
};

function glucoseBadgeColor(mmol: number): string {
  if (mmol < 3.9) return "text-orange-400 border-orange-400/30 bg-orange-400/10";
  if (mmol > 10) return "text-yellow-400 border-yellow-400/30 bg-yellow-400/10";
  return "text-emerald-400 border-emerald-400/30 bg-emerald-400/10";
}

export function LiveGlucoseBadge() {
  const [data, setData] = useState<GlucoseState | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchLatest() {
      try {
        const result = await getLatestGlucose();
        if (!mounted || !result) return;
        setData({
          sgv: result.sgv,
          direction: result.direction,
          minutesAgo: Math.round((Date.now() - result.date) / 60000),
        });
      } catch {
        // silently fail — badge just won't show
      }
    }
    fetchLatest();
    const interval = setInterval(fetchLatest, 60_000); // refresh every minute
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  if (!data) return null;

  const mmol = Math.round((data.sgv / 18) * 10) / 10;
  const arrow = ARROWS[data.direction] ?? "→";
  const colors = glucoseBadgeColor(mmol);

  return (
    <Link
      href="/diabetes"
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-mono transition-all duration-300 hover:scale-105 ${colors}`}
      title={`${mmol} mmol/L — ${data.minutesAgo}m ago`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      <span className="font-semibold">{mmol.toFixed(1)}</span>
      <span className="text-[10px] opacity-80">{arrow}</span>
    </Link>
  );
}
