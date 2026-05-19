import { NextResponse } from "next/server";
import {
  fetchFinchData,
  summarizeFinch,
  rollupHealth,
} from "@/lib/finch";

/**
 * GET /api/finch
 *
 * Returns the full Finch daily-summary dataset from the upstream Cloud
 * Function, plus optional computed summaries.
 *
 * Query params:
 *   summary – if "true", include the rolled-up FinchSummary
 *   health  – if "true", include the Apple Health rollup
 *
 * Cached for 1 hour via Cache-Control.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const includeSummary = searchParams.get("summary") === "true";
  const includeHealth = searchParams.get("health") === "true";

  try {
    const days = await fetchFinchData();

    const body: Record<string, unknown> = {
      ok: true,
      count: days.length,
      days,
    };

    if (includeSummary) {
      body.summary = summarizeFinch(days);
    }

    if (includeHealth) {
      body.health = rollupHealth(days);
    }

    return NextResponse.json(body, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("[api/finch]", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch Finch data" },
      { status: 502 },
    );
  }
}
