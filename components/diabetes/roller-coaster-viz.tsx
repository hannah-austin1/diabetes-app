"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { NightscoutReading } from "@/lib/nightscout";
import type { FinchEvent } from "@/lib/finch";
import { glucoseColor, fmtMmol } from "@/lib/utils";

/** Unified timeline event rendered on the roller coaster. */
export interface TimelineEvent {
  ts: number;
  kind: "carbs" | "insulin" | "goal";
  label: string;
  emoji: string;
}

const TIMELINE_STYLE: Record<TimelineEvent["kind"], { color: string }> = {
  carbs:   { color: "#eab308" },
  insulin: { color: "#4f8ef7" },
  goal:    { color: "#22c55e" },
};

const EVENT_STYLE: Record<FinchEvent["kind"], { fallbackEmoji: string; color: string }> = {
  goal:       { fallbackEmoji: "✅", color: "#22c55e" },
  reflection: { fallbackEmoji: "📝", color: "#a855f7" },
};

interface Props {
  readings: NightscoutReading[];
  events?: FinchEvent[];
  timeline?: TimelineEvent[];
  /** Epoch ms – start of the 24h window (midnight) */
  windowStart: number;
  /** Epoch ms – end of the 24h window (next midnight) */
  windowEnd: number;
}

interface MarkerHitbox {
  x: number;
  y: number;
  event: TimelineEvent;
}

interface PopupState {
  event: TimelineEvent;
  domX: number;
  domY: number;
}

// Pre-computed track point
interface TrackPt {
  x: number;
  y: number;
  sgv: number;
}

export function RollerCoasterViz({ readings, events = [], timeline = [], windowStart, windowEnd }: Props) {
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const carCanvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const carPosRef = useRef(0); // 0..1 progress along track
  const trackRef = useRef<TrackPt[]>([]);
  const markersRef = useRef<MarkerHitbox[]>([]);
  const bgDrawnRef = useRef(false);
  const [popup, setPopup] = useState<PopupState | null>(null);
  const hoverRef = useRef<PopupState | null>(null);
  const carPopupRef = useRef<PopupState | null>(null);

  const sorted = [...readings]
    .sort((a, b) => a.date - b.date);

  const timeSpan = windowEnd - windowStart || 1;
  const eventsInWindow = events.filter((e) => e.ts >= windowStart && e.ts <= windowEnd);


  // ── Draw the STATIC background (once) ──
  const drawBackground = useCallback(() => {
    const canvas = bgCanvasRef.current;
    if (!canvas || sorted.length < 2) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const SGV_MIN = 40;
    const SGV_MAX = 320;
    const SGV_RANGE = SGV_MAX - SGV_MIN;
    const BOTTOM = 28;
    const PAD_L = 8;
    const PAD_R = 8;
    const DRAW_W = W - PAD_L - PAD_R;
    const DRAW_H = H - BOTTOM;

    function sgvToY(sgv: number): number {
      return DRAW_H - 30 - ((sgv - SGV_MIN) / SGV_RANGE) * (DRAW_H - 60);
    }

    // ── Non-linear time → X mapping (compress nighttime 23:00–06:00) ──
    // Build a lookup from absolute timestamp → X position across the full window
    const NIGHT_WEIGHT = 0.3; // nighttime gets 30% of its proportional width
    const SLOT_MS = 5 * 60 * 1000; // 5-minute slots across the full day
    const totalSlots = Math.ceil((windowEnd - windowStart) / SLOT_MS);

    // Build cumulative weights for each 5-min slot in the full window
    const slotCumWeights: number[] = [0];
    for (let s = 1; s <= totalSlots; s++) {
      const slotTs = windowStart + (s - 1) * SLOT_MS;
      const h = new Date(slotTs).getHours();
      const w = (h >= 23 || h < 6) ? NIGHT_WEIGHT : 1.0;
      slotCumWeights.push(slotCumWeights[s - 1] + w);
    }
    const totalSlotWeight = slotCumWeights[totalSlots] || 1;

    function tsToX(ts: number): number {
      const clamped = Math.max(windowStart, Math.min(windowEnd, ts));
      const slotIdx = (clamped - windowStart) / SLOT_MS;
      const lo = Math.floor(slotIdx);
      const hi = Math.min(lo + 1, totalSlots);
      const f = slotIdx - lo;
      const cw = slotCumWeights[lo] + (slotCumWeights[hi] - slotCumWeights[lo]) * f;
      return PAD_L + (cw / totalSlotWeight) * DRAW_W;
    }

    ctx.clearRect(0, 0, W, H);

    // In-range band
    const lowY = sgvToY(70);
    const highY = sgvToY(180);
    ctx.fillStyle = "rgba(34, 197, 94, 0.07)";
    ctx.fillRect(0, highY, W, lowY - highY);

    // Range labels
    ctx.font = "10px monospace";
    ctx.fillStyle = "rgba(34, 197, 94, 0.4)";
    ctx.fillText("▸ 10.0", W - 52, highY - 4);
    ctx.fillStyle = "rgba(249, 115, 22, 0.4)";
    ctx.fillText("▸ 3.9", W - 52, lowY + 12);

    // Grid lines
    [70, 100, 140, 180, 250].forEach((v) => {
      const y = sgvToY(v);
      ctx.strokeStyle = v === 70 || v === 180 ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 8]);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Smooth SGV values with a 5-point moving average to remove spikes
    const rawSgv = sorted.map((r) => r.sgv);
    const smoothed: number[] = [];
    const WINDOW = 2; // ±2 readings = 5-point window
    for (let i = 0; i < rawSgv.length; i++) {
      let sum = 0;
      let count = 0;
      for (let j = Math.max(0, i - WINDOW); j <= Math.min(rawSgv.length - 1, i + WINDOW); j++) {
        sum += rawSgv[j];
        count++;
      }
      smoothed.push(sum / count);
    }

    // Build track points using absolute time positions + smoothed values
    const pts: TrackPt[] = sorted.map((r, i) => ({
      x: tsToX(r.date),
      y: sgvToY(smoothed[i]),
      sgv: smoothed[i],
    }));
    trackRef.current = pts;

    // Area fill under track
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[0].x, DRAW_H);
    pts.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.lineTo(pts[pts.length - 1].x, DRAW_H);
    ctx.closePath();
    const areaGrad = ctx.createLinearGradient(0, sgvToY(SGV_MAX), 0, DRAW_H);
    areaGrad.addColorStop(0, "rgba(79, 142, 247, 0.10)");
    areaGrad.addColorStop(1, "rgba(79, 142, 247, 0)");
    ctx.fillStyle = areaGrad;
    ctx.fill();
    ctx.restore();

    // Track line (gradient per segment)
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1];
      const p1 = pts[i];
      const grad = ctx.createLinearGradient(p0.x, p0.y, p1.x, p1.y);
      grad.addColorStop(0, glucoseColor(p0.sgv));
      grad.addColorStop(1, glucoseColor(p1.sgv));
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    }

    // Rail lines (subtle)
    [-3, 3].forEach((offset) => {
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255,255,255,0.035)";
      ctx.lineWidth = 1;
      pts.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y + offset);
        else ctx.lineTo(p.x, p.y + offset);
      });
      ctx.stroke();
    });

    // Support pillars (every ~20 points)
    for (let i = 0; i < pts.length; i += 20) {
      const p = pts[i];
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x, DRAW_H);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // ── Time axis ──
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.fillRect(0, DRAW_H, W, BOTTOM);
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, DRAW_H);
    ctx.lineTo(W, DRAW_H);
    ctx.stroke();

    // Time labels every ~6 hours (using compressed time mapping)
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    const hoursInWindow = timeSpan / (60 * 60 * 1000);
    const labelIntervalHours = hoursInWindow > 36 ? 6 : hoursInWindow > 12 ? 3 : 1;
    const labelIntervalMs = labelIntervalHours * 60 * 60 * 1000;
    let labelTs = Math.ceil(windowStart / labelIntervalMs) * labelIntervalMs;
    while (labelTs <= windowEnd) {
      const x = tsToX(labelTs);
      const d = new Date(labelTs);
      const h = d.getHours();
      const isNight = h >= 23 || h < 6;
      const str = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
      ctx.strokeStyle = isNight ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.12)";
      ctx.beginPath();
      ctx.moveTo(x, DRAW_H);
      ctx.lineTo(x, DRAW_H + 4);
      ctx.stroke();
      ctx.fillStyle = isNight ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.35)";
      ctx.fillText(str, x, DRAW_H + 18);
      labelTs += labelIntervalMs;
    }

    // ── Timeline event markers (static) ──
    const markers: MarkerHitbox[] = [];

    for (const ev of timeline) {
      if (ev.ts < windowStart || ev.ts > windowEnd) continue;
      const x = tsToX(ev.ts);
      // Find closest track point by x-distance
      let bestIdx = 0;
      let bestDist = Infinity;
      for (let pi = 0; pi < pts.length; pi++) {
        const d = Math.abs(pts[pi].x - x);
        if (d < bestDist) { bestDist = d; bestIdx = pi; }
      }
      const p = pts[bestIdx];
      if (!p) continue;
      const style = TIMELINE_STYLE[ev.kind];

      markers.push({ x, y: p.y, event: ev });

      // Glow dot on track (all event types)
      ctx.save();
      ctx.shadowBlur = ev.kind === "goal" ? 3 : 8;
      ctx.shadowColor = style.color;
      ctx.fillStyle = style.color;
      ctx.beginPath();
      ctx.arc(x, p.y, ev.kind === "goal" ? 2.5 : 4, 0, Math.PI * 2);
      ctx.fill();
      if (ev.kind !== "goal") {
        ctx.fillStyle = "#fff";
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Dashed line + emoji on time axis — only for carbs/insulin/exercise (not goals)
      if (ev.kind !== "goal") {
        ctx.strokeStyle = style.color + "33";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(x, p.y + 6);
        ctx.lineTo(x, DRAW_H);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.font = "11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.fillText(ev.emoji, x, DRAW_H + 16);
      }
    }

    markersRef.current = markers;
    bgDrawnRef.current = true;
  }, [sorted, timeline, eventsInWindow, timeSpan, windowStart, windowEnd]);

  // ── Animate ONLY the car on a separate canvas ──
  useEffect(() => {
    if (!bgDrawnRef.current) drawBackground();

    const canvas = carCanvasRef.current;
    if (!canvas || trackRef.current.length < 2) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const pts = trackRef.current;
    const totalPts = pts.length;
    // Base speed: car traverses track in ~90s. Slope modulates this.
    const BASE_SPEED = 1 / (90 * 60);

    // Pre-compute slopes at each point for physics speed
    const slopes: number[] = [];
    for (let i = 0; i < totalPts; i++) {
      const prev = pts[Math.max(0, i - 1)];
      const next = pts[Math.min(totalPts - 1, i + 1)];
      const dx = next.x - prev.x || 1;
      const dy = next.y - prev.y; // positive = going down on screen = downhill
      slopes.push(dy / dx);
    }

    // Catmull-Rom spline interpolation for smooth curves
    function catmullRom(p0v: number, p1v: number, p2v: number, p3v: number, t: number): number {
      return 0.5 * (
        2 * p1v +
        (-p0v + p2v) * t +
        (2 * p0v - 5 * p1v + 4 * p2v - p3v) * t * t +
        (-p0v + 3 * p1v - 3 * p2v + p3v) * t * t * t
      );
    }

    function draw() {
      ctx!.clearRect(0, 0, W, H);

      // Current position along the track (0..1)
      const pos = carPosRef.current;
      const floatIdx = pos * (totalPts - 1);
      const idx = Math.floor(floatIdx);
      const frac = floatIdx - idx;

      // Catmull-Rom: use 4 surrounding points for smooth interpolation
      const i0 = Math.max(0, idx - 1);
      const i1 = Math.min(idx, totalPts - 1);
      const i2 = Math.min(idx + 1, totalPts - 1);
      const i3 = Math.min(idx + 2, totalPts - 1);
      const carX = catmullRom(pts[i0].x, pts[i1].x, pts[i2].x, pts[i3].x, frac);
      const carY = catmullRom(pts[i0].y, pts[i1].y, pts[i2].y, pts[i3].y, frac);
      const carSgv = Math.round(catmullRom(pts[i0].sgv, pts[i1].sgv, pts[i2].sgv, pts[i3].sgv, frac));

      // Smooth angle using derivative of Catmull-Rom
      const dx = catmullRom(pts[i0].x, pts[i1].x, pts[i2].x, pts[i3].x, Math.min(1, frac + 0.01)) - carX;
      const dy = catmullRom(pts[i0].y, pts[i1].y, pts[i2].y, pts[i3].y, Math.min(1, frac + 0.01)) - carY;
      const angle = Math.atan2(dy, dx);
      const carColor = glucoseColor(Math.max(40, Math.min(400, carSgv)));

      // ── Draw car ──
      ctx!.save();
      ctx!.translate(carX, carY);
      ctx!.rotate(angle);
      ctx!.shadowBlur = 20;
      ctx!.shadowColor = carColor;
      ctx!.fillStyle = carColor;
      ctx!.beginPath();
      ctx!.roundRect(-14, -20, 28, 16, 4);
      ctx!.fill();
      // Windows
      ctx!.fillStyle = "rgba(0,0,0,0.5)";
      ctx!.fillRect(-9, -17, 7, 7);
      ctx!.fillRect(2, -17, 7, 7);
      // Wheels
      ctx!.fillStyle = "#1a1a2e";
      ctx!.strokeStyle = "rgba(255,255,255,0.3)";
      ctx!.lineWidth = 1;
      ctx!.shadowBlur = 0;
      [[-8, -4], [8, -4]].forEach(([wx, wy]) => {
        ctx!.beginPath();
        ctx!.arc(wx, wy, 4, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.stroke();
      });
      ctx!.restore();

      // ── Glucose label above car ──
      const mmolStr = `${fmtMmol(carSgv)} mmol/L`;
      ctx!.save();
      ctx!.font = "bold 12px monospace";
      const textW = ctx!.measureText(mmolStr).width;
      const bgW = textW + 16;
      const bgH = 22;
      const labelX = Math.max(4, Math.min(W - bgW - 4, carX - bgW / 2));
      const labelY = carY - 42;
      ctx!.fillStyle = "rgba(0,0,0,0.75)";
      ctx!.beginPath();
      ctx!.roundRect(labelX, labelY - bgH + 6, bgW, bgH, 6);
      ctx!.fill();
      ctx!.fillStyle = carColor;
      ctx!.textAlign = "center";
      ctx!.fillText(mmolStr, Math.max(bgW / 2 + 4, Math.min(W - bgW / 2 - 4, carX)), labelY);
      ctx!.restore();

      // ── Car proximity popup detection ──
      let newCarPopup: PopupState | null = null;
      let closestDist = 40;
      for (const m of markersRef.current) {
        const dist = Math.abs(m.x - carX);
        if (dist < closestDist) {
          closestDist = dist;
          // Convert canvas coords to DOM coords
          const rect = canvas!.getBoundingClientRect();
          const wRect = wrapperRef.current?.getBoundingClientRect();
          if (rect && wRect) {
            const sx = rect.width / W;
            const sy = rect.height / H;
            newCarPopup = {
              event: m.event,
              domX: (rect.left - wRect.left) + m.x * sx + 16,
              domY: (rect.top - wRect.top) + m.y * sy - 30,
            };
          }
        }
      }
      carPopupRef.current = newCarPopup;
      if (!hoverRef.current) {
        setPopup(newCarPopup);
      }

      // Advance with physics: slope-based speed
      // In canvas coords, negative dy = going UP (glucose rising = uphill)
      // positive dy = going DOWN (glucose falling = downhill)
      const slopeIdx = Math.min(Math.floor(carPosRef.current * (totalPts - 1)), totalPts - 1);
      const slope = slopes[slopeIdx] ?? 0;
      // slope > 0 means going down on screen = downhill = faster
      // slope < 0 means going up on screen = uphill = slower
      const slopeFactor = 1 + slope * 3; // amplify the effect
      const clampedFactor = Math.max(0.3, Math.min(2.5, slopeFactor));
      carPosRef.current += BASE_SPEED * clampedFactor;
      if (carPosRef.current >= 1) carPosRef.current = 0;

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [drawBackground]);

  // ── Redraw background when data changes ──
  useEffect(() => {
    bgDrawnRef.current = false;
    drawBackground();
  }, [drawBackground]);

  // ── Hover handler ──
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = bgCanvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;
    const rect = canvas.getBoundingClientRect();
    const wRect = wrapper.getBoundingClientRect();
    const sx = canvas.width / rect.width;
    const sy = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * sx;
    const my = (e.clientY - rect.top) * sy;

    let closest: MarkerHitbox | null = null;
    let closestDist = 20;
    for (const m of markersRef.current) {
      const d = Math.sqrt((mx - m.x) ** 2 + (my - m.y) ** 2);
      if (d < closestDist) {
        closestDist = d;
        closest = m;
      }
    }

    if (closest) {
      const domSx = rect.width / canvas.width;
      const domSy = rect.height / canvas.height;
      hoverRef.current = {
        event: closest.event,
        domX: (rect.left - wRect.left) + closest.x * domSx + 16,
        domY: (rect.top - wRect.top) + closest.y * domSy - 30,
      };
    } else {
      hoverRef.current = null;
    }
    setPopup(hoverRef.current ?? carPopupRef.current);
  }, []);

  const handleMouseLeave = useCallback(() => {
    hoverRef.current = null;
    setPopup(carPopupRef.current);
  }, []);

  const popupStyle = popup ? TIMELINE_STYLE[popup.event.kind] : null;

  return (
    <div ref={wrapperRef} className="relative rounded-xl border border-border bg-card overflow-hidden p-2">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-linear-to-b from-[#0d1117] to-transparent pointer-events-none z-0 opacity-60" />

      {/* Stars */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {STARS.map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              width: s.size, height: s.size,
              top: `${s.top}%`, left: `${s.left}%`,
              opacity: s.opacity,
              animationDelay: `${i * 200}ms`,
              animationDuration: `${3000 + i * 400}ms`,
            }}
          />
        ))}
      </div>

      {/* Static background canvas (drawn once) */}
      <canvas
        ref={bgCanvasRef}
        width={900}
        height={310}
        className="w-full rounded-xl relative z-10"
      />

      {/* Car animation canvas (redrawn each frame — lightweight) */}
      <canvas
        ref={carCanvasRef}
        width={900}
        height={310}
        className="w-full rounded-xl absolute inset-0 z-20 cursor-crosshair m-2"
        style={{ width: "calc(100% - 16px)", height: "calc(100% - 8px)" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />

      {/* Popup overlay (CSS transitions for smooth animation) */}
      <div
        className="absolute z-30 pointer-events-none"
        style={{
          left: popup?.domX ?? 0,
          top: popup?.domY ?? 0,
          opacity: popup ? 1 : 0,
          transform: popup ? "translateY(0) scale(1)" : "translateY(4px) scale(0.95)",
          transition: "opacity 250ms ease-out, transform 250ms ease-out, left 150ms ease-out, top 150ms ease-out",
        }}
      >
        {popup && popupStyle && (
          <div
            className="rounded-lg px-3 py-2 backdrop-blur-md border shadow-lg min-w-[140px]"
            style={{
              backgroundColor: "rgba(10, 12, 20, 0.92)",
              borderColor: popupStyle.color + "55",
              boxShadow: `0 4px 20px ${popupStyle.color}22`,
            }}
          >
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm">{popup.event.emoji}</span>
              <span className="text-xs font-semibold text-white truncate max-w-[180px]">
                {popup.event.label}
              </span>
            </div>
            <div className="text-[10px] font-mono" style={{ color: popupStyle.color }}>
              {new Date(popup.event.ts).toLocaleTimeString("en-GB", {
                hour: "2-digit", minute: "2-digit",
              })}
              {" · "}
              {popup.event.kind === "carbs" ? "Carb correction" :
               popup.event.kind === "insulin" ? "Bolus" : "Finch goal"}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-1 pb-2 relative z-10 flex-wrap">
        {[
          { color: "#22c55e", label: "In Range (3.9–10.0)" },
          { color: "#eab308", label: "High (>10.0)" },
          { color: "#f97316", label: "Low (<3.9)" },
          { color: "#ef4444", label: "Critical" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-3 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
            {item.label}
          </div>
        ))}
        <span className="text-xs text-muted-foreground/30">|</span>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#eab308" }} />
          🍞 Carbs
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#4f8ef7" }} />
          💉 Bolus
        </div>
        {timeline.some((e) => e.kind === "goal") && (
          <>
            <span className="text-xs text-muted-foreground/30">|</span>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#22c55e" }} />
              Goals
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Decorative stars (CSS-animated, not canvas-redrawn)
const STARS = [
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
];
