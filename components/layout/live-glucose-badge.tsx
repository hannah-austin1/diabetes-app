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

const MOOD_EMOJIS: Record<string, string> = {
  DoubleUp: "😰",
  SingleUp: "😅",
  FortyFiveUp: "🙂",
  Flat: "😊",
  FortyFiveDown: "🙂",
  SingleDown: "😅",
  DoubleDown: "😰",
};

function glucoseBadgeStyle(mmol: number): { colors: string; emoji: string } {
  if (mmol < 3.9) {
    return {
      colors: "text-orange-600 border-orange-400/50 bg-orange-100",
      emoji: "😵",
    };
  }
  if (mmol > 10) {
    return {
      colors: "text-amber-600 border-amber-400/50 bg-amber-100",
      emoji: "😅",
    };
  }
  return {
    colors: "text-emerald-600 border-emerald-400/50 bg-emerald-100",
    emoji: "😊",
  };
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
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (!data) return null;

  const mmol = Math.round((data.sgv / 18) * 10) / 10;
  const arrow = ARROWS[data.direction] ?? "→";
  const { colors, emoji } = glucoseBadgeStyle(mmol);
  const moodEmoji = MOOD_EMOJIS[data.direction] ?? emoji;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, delay: 0.5 }}
    >
      <Link
        href="/diabetes"
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border-2 text-xs font-mono transition-all duration-300 hover:scale-105 hover:shadow-md ${colors}`}
        title={`${mmol} mmol/L — ${data.minutesAgo}m ago`}
      >
        <motion.span
          className="text-base"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {moodEmoji}
        </motion.span>
        <span className="font-bold">{mmol.toFixed(1)}</span>
        <span className="text-[11px] opacity-70">{arrow}</span>
        <motion.span
          className="w-2 h-2 rounded-full bg-current"
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </Link>
    </motion.div>
  );
}
