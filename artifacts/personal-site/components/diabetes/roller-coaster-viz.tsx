"use client";

import { useEffect, useRef } from "react";
import type { NightscoutReading } from "@/lib/nightscout";
import type { FinchEvent } from "@/lib/finch";
import { glucoseColor, fmtMmol } from "@/lib/utils";

const EVENT_STYLE: Record<FinchEvent["kind"], { fallbackEmoji: string; color: string }> = {
  goal: { fallbackEmoji: "✅", color: "#22c55e" },
  reflection: { fallbackEmoji: "📝", color: "#a855f7" },
};

const STARS: { size: number; top: number; left: number; opacity: number }[] = [
  { size: 1, top: 5.2, left: 8.4, opacity: 0.3 },
  { size: 2, top: 12.1, left: 23.7, opacity: 0.4 },
  { size: 1, top: 3.8, left: 41.2, opacity: 0.2 },
  { size: 1, top: 18.5, left: 55.9, opacity: 0.35 },
  { size: 2, top: 7.3, left: 67.1, opacity: 0.25 },
  { size: 1, top: 22.6, left: 78.4, opacity: 0.3 },
  { size: 1, top: 9.4, left: 91.0, opacity: 0.4 },
  { size: 2, top: 14.7, left: 33.5, opacity: 0.2 },
  { size: 1, top: 1.9, left: 50.0, opacity: 0.35 },
  { size: 1, top: 20.3, left: 15.8, opacity: 0.3 },
  { size: 2, top: 6.1, left: 84.2, opacity: 0.45 },
  { size: 1, top: 25.4, left: 62.7, opacity: 0.2 },
  { size: 1, top: 11.2, left: 97.3, opacity: 0.3 },
  { size: 1, top: 17.8, left: 4.6, opacity: 0.25 },
  { size: 2, top: 4.5, left: 72.1, opacity: 0.35 },
  { size: 1, top: 23.9, left: 44.8, opacity: 0.3 },
  { size: 1, top: 8.7, left: 29.2, opacity: 0.4 },
  { size: 2, top: 15.3, left: 88.5, opacity: 0.2 },
  { size: 1, top: 2.6, left: 19.3, opacity: 0.35 },
  { size: 1, top: 21.4, left: 37.6, opacity: 0.25 },
  { size: 1, top: 10.8, left: 59.4, opacity: 0.3 },
  { size: 2, top: 16.2, left: 75.8, opacity: 0.45 },
  { size: 1, top: 24.7, left: 93.1, opacity: 0.2 },
  { size: 1, top: 6.9, left: 11.5, opacity: 0.35 },
  { size: 1, top: 13.6, left: 48.3, opacity: 0.3 },
  { size: 2, top: 19.1, left: 81.7, opacity: 0.25 },
  { size: 1, top: 3.3, left: 65.4, opacity: 0.4 },
  { size: 1, top: 26.8, left: 26.9, opacity: 0.2 },
  { size: 2, top: 8.2, left: 39.8, opacity: 0.35 },
  { size: 1, top: 20.9, left: 53.2, opacity: 0.3 },
];

interface Props {
  readings: NightscoutReading[];
  events?: FinchEvent[];
}

export function RollerCoasterViz({ readings, events = [] }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const offsetRef = useRef(0);

  const sorted = [...readings]
    .sort((a, b) => a.date - b.date)
    .slice(-144);

  const windowStart = sorted[0]?.date ?? 0;
  const windowEnd = sorted[sorted.length - 1]?.date ?? 0;
  const eventsInWindow = events.filter((e) => e.ts >= windowStart && e.ts <= windowEnd);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || sorted.length < 2) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const SPEED = 0.4;
    const SGV_MIN = 40;
    const SGV_MAX = 320;
    const SGV_RANGE = SGV_MAX - SGV_MIN;

    function sgvToY(sgv: number): number {
      return H - 60 - ((sgv - SGV_MIN) / SGV_RANGE) * (H - 120);
    }

    const values = sorted.map((r) => r.sgv);
    const trackLength = W * 2;
    const timeSpan = windowEnd - windowStart || 1;

    function tsToSgvIndex(ts: number): number {
      // map timestamp into 0..(values.length-1)
      const ratio = (ts - windowStart) / timeSpan;
      return Math.max(0, Math.min(values.length - 1, ratio * (values.length - 1)));
    }

    function getTrackPoints(xOffset: number) {
      const pts: { x: number; y: number; sgv: number }[] = [];
      const total = values.length;
      for (let i = 0; i < total * 2; i++) {
        const v = values[i % total];
        const x = (i / (total * 2 - 1)) * trackLength - xOffset;
        const y = sgvToY(v);
        pts.push({ x, y, sgv: v });
      }
      return pts;
    }

    function draw() {
      ctx!.clearRect(0, 0, W, H);

      const lowY = sgvToY(70);
      const highY = sgvToY(180);

      ctx!.fillStyle = "rgba(34, 197, 94, 0.07)";
      ctx!.fillRect(0, highY, W, lowY - highY);

      ctx!.font = "10px monospace";
      ctx!.fillStyle = "rgba(34, 197, 94, 0.4)";
      ctx!.fillText("▸ 10.0", W - 52, highY - 4);
      ctx!.fillStyle = "rgba(249, 115, 22, 0.4)";
      ctx!.fillText("▸ 3.9", W - 52, lowY + 12);

      [70, 100, 140, 180, 250].forEach((v) => {
        const y = sgvToY(v);
        ctx!.strokeStyle = v === 70 || v === 180 ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)";
        ctx!.lineWidth = 1;
        ctx!.setLineDash([4, 8]);
        ctx!.beginPath();
        ctx!.moveTo(0, y);
        ctx!.lineTo(W, y);
        ctx!.stroke();
        ctx!.setLineDash([]);
      });

      const pts = getTrackPoints(offsetRef.current % trackLength);

      ctx!.save();
      ctx!.shadowBlur = 18;
      ctx!.shadowColor = "rgba(79, 142, 247, 0.4)";

      if (pts.length > 1) {
        ctx!.beginPath();
        ctx!.moveTo(pts[0].x, H);
        pts.forEach((p) => ctx!.lineTo(p.x, p.y));
        ctx!.lineTo(pts[pts.length - 1].x, H);
        ctx!.closePath();
        const areaGrad = ctx!.createLinearGradient(0, sgvToY(SGV_MAX), 0, H);
        areaGrad.addColorStop(0, "rgba(79, 142, 247, 0.12)");
        areaGrad.addColorStop(1, "rgba(79, 142, 247, 0)");
        ctx!.fillStyle = areaGrad;
        ctx!.fill();
      }

      if (pts.length > 1) {
        for (let i = 1; i < pts.length; i++) {
          const p0 = pts[i - 1];
          const p1 = pts[i];
          const grad = ctx!.createLinearGradient(p0.x, p0.y, p1.x, p1.y);
          grad.addColorStop(0, glucoseColor(p0.sgv));
          grad.addColorStop(1, glucoseColor(p1.sgv));
          ctx!.strokeStyle = grad;
          ctx!.lineWidth = 3;
          ctx!.lineJoin = "round";
          ctx!.lineCap = "round";
          ctx!.beginPath();
          ctx!.moveTo(p0.x, p0.y);
          ctx!.lineTo(p1.x, p1.y);
          ctx!.stroke();
        }
      }
      ctx!.restore();

      if (pts.length > 1) {
        [-4, 4].forEach((offset) => {
          ctx!.beginPath();
          ctx!.strokeStyle = "rgba(255,255,255,0.04)";
          ctx!.lineWidth = 1;
          pts.forEach((p, i) => {
            if (i === 0) ctx!.moveTo(p.x, p.y + offset);
            else ctx!.lineTo(p.x, p.y + offset);
          });
          ctx!.stroke();
        });
      }

      if (pts.length > 1) {
        for (let i = 0; i < pts.length; i += 8) {
          const p = pts[i];
          if (p.x < 0 || p.x > W) continue;
          ctx!.strokeStyle = "rgba(255,255,255,0.04)";
          ctx!.lineWidth = 1;
          ctx!.setLineDash([2, 4]);
          ctx!.beginPath();
          ctx!.moveTo(p.x, p.y);
          ctx!.lineTo(p.x, H);
          ctx!.stroke();
          ctx!.setLineDash([]);
        }
      }

      const carX = W * 0.2;
      const carPt = pts.find((p) => p.x >= carX) ?? pts[0];
      const carNext = pts[pts.indexOf(carPt) + 1] ?? carPt;
      const angle = Math.atan2(carNext.y - carPt.y, carNext.x - carPt.x);
      const carColor = glucoseColor(carPt.sgv);

      ctx!.save();
      ctx!.translate(carPt.x, carPt.y);
      ctx!.rotate(angle);
      ctx!.shadowBlur = 20;
      ctx!.shadowColor = carColor;
      ctx!.fillStyle = carColor;
      ctx!.beginPath();
      ctx!.roundRect(-14, -14, 28, 16, 4);
      ctx!.fill();
      ctx!.fillStyle = "rgba(0,0,0,0.5)";
      ctx!.fillRect(-9, -11, 7, 7);
      ctx!.fillRect(2, -11, 7, 7);
      ctx!.fillStyle = "#1a1a2e";
      ctx!.strokeStyle = "rgba(255,255,255,0.3)";
      ctx!.lineWidth = 1;
      ctx!.shadowBlur = 0;
      [[-8, 2], [8, 2]].forEach(([wx, wy]) => {
        ctx!.beginPath();
        ctx!.arc(wx, wy, 4, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.stroke();
      });
      ctx!.restore();

      const mmolStr = `${fmtMmol(carPt.sgv)} mmol/L`;
      ctx!.save();
      ctx!.font = "bold 12px monospace";
      const textW = ctx!.measureText(mmolStr).width;
      const bgW = textW + 16;
      const bgH = 22;
      const labelX = carPt.x - bgW / 2;
      const labelY = carPt.y - 32;
      ctx!.fillStyle = "rgba(0,0,0,0.75)";
      ctx!.beginPath();
      ctx!.roundRect(labelX, labelY - bgH + 6, bgW, bgH, 6);
      ctx!.fill();
      ctx!.fillStyle = carColor;
      ctx!.textAlign = "center";
      ctx!.fillText(mmolStr, carPt.x, labelY);
      ctx!.restore();

      // ── Finch event markers ──────────────────────────────────────────
      // pts contains 2 copies of the track (total*2 points across trackLength).
      // We draw each event at BOTH copies' positions so it stays aligned as
      // the track scrolls and wraps.
      if (eventsInWindow.length > 0 && pts.length > 1) {
        const total = values.length;
        for (const ev of eventsInWindow) {
          const idxInCopy = Math.round(tsToSgvIndex(ev.ts));
          const style = EVENT_STYLE[ev.kind];

          for (const baseIdx of [idxInCopy, idxInCopy + total]) {
            const p = pts[baseIdx];
            if (!p || p.x < -20 || p.x > W + 20) continue;

            // vertical guide line from the curve down to the baseline
            ctx!.strokeStyle = style.color + "55";
            ctx!.lineWidth = 1;
            ctx!.setLineDash([3, 3]);
            ctx!.beginPath();
            ctx!.moveTo(p.x, p.y);
            ctx!.lineTo(p.x, H - 18);
            ctx!.stroke();
            ctx!.setLineDash([]);

            ctx!.save();
            ctx!.shadowBlur = 8;
            ctx!.shadowColor = style.color;
            ctx!.fillStyle = style.color;
            ctx!.beginPath();
            ctx!.arc(p.x, H - 14, 4, 0, Math.PI * 2);
            ctx!.fill();
            ctx!.restore();

            ctx!.font = "11px sans-serif";
            ctx!.textAlign = "center";
            ctx!.fillText(ev.emoji ?? style.fallbackEmoji, p.x, H - 2);
          }
        }
      }

      offsetRef.current += SPEED;
      if (offsetRef.current >= trackLength) offsetRef.current = 0;
      animFrameRef.current = requestAnimationFrame(draw);
    }

    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [sorted, eventsInWindow, windowStart, windowEnd]);

  return (
    <div className="relative rounded-xl border border-border bg-card overflow-hidden p-2">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0d1117] to-transparent pointer-events-none z-0 opacity-60" />
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {STARS.map((star, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{ width: star.size, height: star.size, top: `${star.top}%`, left: `${star.left}%`, opacity: star.opacity }}
          />
        ))}
      </div>
      <canvas ref={canvasRef} width={900} height={280} className="w-full rounded-xl relative z-10" />
      <div className="flex items-center justify-center gap-6 mt-3 pb-2 relative z-10 flex-wrap">
        {[
          { color: "#22c55e", label: "In Range (3.9–10.0)" },
          { color: "#eab308", label: "High (>10.0)" },
          { color: "#f97316", label: "Low (<3.9)" },
          { color: "#ef4444", label: "Critical" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-3 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
            {item.label} mmol/L
          </div>
        ))}
        {eventsInWindow.length > 0 && (
          <>
            <span className="text-xs text-muted-foreground/40">·</span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>✅</span> Finch goal
            </div>
          </>
        )}
      </div>
    </div>
  );
}
