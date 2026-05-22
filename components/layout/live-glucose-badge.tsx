"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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

function getGlucoseStyle(mmol: number): string {
  if (mmol < 3.9) return "text-orange-400 border-orange-500/30 bg-orange-500/10";
  if (mmol > 10) return "text-amber-400 border-amber-500/30 bg-amber-500/10";
  return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
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
        // silently fail
      }
    }
    fetchLatest();
    const interval = setInterval(fetchLatest, 60_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (!data) return null;

  const mmol = Math.round((data.sgv / 18) * 10) / 10;
  const arrow = ARROWS[data.direction] ?? "→";
  const style = getGlucoseStyle(mmol);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.3 }}
    >
      <Link
        href="/diabetes"
        className={`flex items-center gap-2 px-2.5 py-1 rounded-md border text-xs font-mono transition-all hover:brightness-110 ${style}`}
        title={`${mmol} mmol/L — ${data.minutesAgo}m ago`}
      >
        <span className="font-semibold">{mmol.toFixed(1)}</span>
        <span className="opacity-70">{arrow}</span>
        <motion.span
          className="w-1.5 h-1.5 rounded-full bg-current"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </Link>
    </motion.div>
  );
}
