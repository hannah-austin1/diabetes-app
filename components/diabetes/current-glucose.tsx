"use client";

import { useEffect, useState } from "react";

import { getLatestGlucose } from "@/lib/client-actions";
import { fmtMmol, glucoseColor, glucoseLabel } from "@/lib/utils";
import { Badge } from "../ui/badge";

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

export function CurrentGlucose() {
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

    const mmol = fmtMmol(data.sgv);
    const arrow = ARROWS[data.direction] ?? "→";
    const color = data ? glucoseColor(data.sgv) : "#22c55e";
    const label = data ? glucoseLabel(data.sgv) : "—";
    const labelVariant =
        label === "IN RANGE" ? "success"
            : label === "LOW" || label === "URGENT LOW" ? "danger"
                : "warning";


    return (
        <div className="shrink-0">
            <p className="text-xs font-mono text-muted-foreground mb-3 uppercase tracking-widest">
                Current Glucose
            </p>
            <div className="flex items-baseline gap-4">
                <span
                    className="text-8xl font-black font-mono leading-none"
                    style={{ color, textShadow: `0 0 40px ${color}60` }}
                >
                    {mmol}
                </span>
                <div>
                    <div className="text-4xl font-bold" style={{ color }}>{arrow}</div>
                    <div className="text-sm text-muted-foreground mt-1">mmol/L</div>
                </div>
            </div>
            <div className="flex items-center gap-3 mt-3">
                <Badge variant={labelVariant as "success" | "warning" | "danger"}>{label}</Badge>
                <span className="text-sm text-muted-foreground">{data.minutesAgo}m ago</span>
            </div>
        </div>

    );
}
