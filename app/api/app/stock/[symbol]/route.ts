/**
 * app/api/app/stock/[symbol]/route.ts
 * Proxies one symbol to the Cloud Run backend (/api/stock/:symbol), cached at
 * Vercel's edge for 60 s with 30 s stale-while-revalidate.
 */
import { NextRequest, NextResponse } from "next/server";

export const revalidate = 60;

const BACKEND_BASE = (
  process.env.BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "https://stock-dashboard-backend-634072894074.us-west4.run.app"
).replace(/\/$/, "");

const SYMBOL_RE = /^[A-Z0-9^][A-Z0-9.\-=^]{0,19}$/;
const PERIODS = new Set(["1mo", "3mo", "6mo", "1y", "2y", "5y"]);
const TIMEOUT_MS = 15_000;
const CACHE_OK = "public, s-maxage=60, stale-while-revalidate=30";

function fail(status: number, error: string) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol: raw } = await params;
  let symbol: string;
  try {
    symbol = decodeURIComponent(raw ?? "").trim().toUpperCase();
  } catch {
    return fail(400, "Invalid symbol.");
  }
  if (!SYMBOL_RE.test(symbol)) return fail(400, "Invalid symbol.");

  const period = req.nextUrl.searchParams.get("period") ?? "3mo";
  if (!PERIODS.has(period)) return fail(400, `Unsupported period. Use one of: ${[...PERIODS].join(", ")}.`);

  const path = encodeURIComponent(symbol).replace(/%5E/gi, "^").replace(/%3D/gi, "=");

  let upstream: Response;
  try {
    upstream = await fetch(`${BACKEND_BASE}/api/stock/${path}?period=${period}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    const timedOut = err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
    console.error(`[api/app/stock] ${timedOut ? "timeout" : "network error"} for ${symbol}`, err);
    return timedOut
      ? fail(504, "Market data took too long to respond. Please try again.")
      : fail(502, "Couldn't reach the market data service.");
  }

  if (upstream.status === 404) return fail(404, `No data found for ${symbol}.`);
  if (upstream.status === 400 || upstream.status === 422) return fail(400, `Invalid request for ${symbol}.`);
  if (upstream.status === 429) return fail(429, "Too many requests. Please wait a moment and try again.");
  if (!upstream.ok) {
    console.error(`[api/app/stock] backend returned ${upstream.status} for ${symbol}`);
    return fail(502, "Market data is temporarily unavailable.");
  }

  let data: unknown;
  try {
    data = await upstream.json();
  } catch {
    return fail(502, "Market data service returned an unreadable response.");
  }
  return NextResponse.json(data, { headers: { "Cache-Control": CACHE_OK } });
}
