import { NextRequest, NextResponse } from "next/server";
import { fetchNightscoutData, computeStats, perDayStats } from "@/lib/nightscout";

/**
 * GET /api/nightscout
 *
 * Query params:
 *   hours  – how many hours of readings to return (default 48, max 2160)
 *   stats  – if "true", include computed stats (A1C, TIR, etc.)
 *   daily  – if "true", include per-day rollups
 *
 * All data comes from the Nightscout API; this route handler caches the
 * response for 5 minutes via Cache-Control.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const hours = Math.min(
    Number(searchParams.get("hours") ?? 48),
    90 * 24, // cap at 90 days
  );
  const includeStats = searchParams.get("stats") === "true";
  const includeDaily = searchParams.get("daily") === "true";

  try {
    const readings = await fetchNightscoutData(hours);

    const body: Record<string, unknown> = {
      ok: true,
      count: readings.length,
      readings,
    };

    if (includeStats) {
      body.stats = computeStats(readings);
    }

    if (includeDaily) {
      body.daily = perDayStats(readings);
    }

    return NextResponse.json(body, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("[api/nightscout]", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch Nightscout data" },
      { status: 502 },
    );
  }
}
