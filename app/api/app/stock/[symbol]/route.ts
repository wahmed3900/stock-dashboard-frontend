/**
 * app/api/app/stock/[symbol]/route.ts
 * App Router version — drop at that path.
 *
 * Caches each symbol at the Vercel edge for 60 s.
 * Stale responses are served for up to 30 s while revalidating in the background,
 * so users never wait for a cold fetch.
 *
 * Data: Yahoo Finance via yfinance (proxied through your Cloud Run backend)
 * — adjust BACKEND_BASE if your analysis endpoint lives elsewhere.
 */

import { NextRequest, NextResponse } from "next/server";

// ── Cache control ──────────────────────────────────────────────────────────
// This tells Vercel's edge to cache the response for 60 seconds.
// Remove or lower if you need fresher data.
export const revalidate = 60;

const BACKEND_BASE = process.env.NEXT_PUBLIC_API_URL ?? process.env.BACKEND_URL ?? "";

export async function GET (
  _req: NextRequest,
{ params }: { params: Promise<{ symbol: string }> }
) {
    const { symbol: rawSymbol } = await params;
    const symbol = rawSymbol.toUpperCase();

    try {
          const upstream = await fetch(`${BACKEND_BASE}/api/analyze/${symbol}`, {
      // Tell Next.js fetch cache to revalidate every 60 s as well
      next: { revalidate: 60 },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream error: ${upstream.status}` },
        { status: upstream.status }
      );
    }

    const data = await upstream.json();

    return NextResponse.json(data, {
      status: 200,
      headers: {
        // Edge CDN caches for 60 s; serves stale for up to 30 s while refreshing
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
