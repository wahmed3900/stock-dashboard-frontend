/**
 * app/api/app/stock/[symbol]/route.ts
 *
 * Proxies one symbol to the Cloud Run backend (/api/stock/:symbol) and caches the
 * result at Vercel's edge for 60 s, serving stale data for up to 30 s more while it
 * refreshes in the background, so users rarely wait on a cold fetch.
 *
 * Usage: /api/app/stock/AAPL, /api/app/stock/BTC-USD?period=6mo, /api/app/stock/%5EGSPC
 */
import { NextRequest, NextResponse } from "next/server";

export const revalidate = 60;

const BACKEND_BASE = (
  process.env.BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "https://stock-dashboard-backend-634072894074.us-west4.run.app"
).replace(/\/$/, "");

// Letters, digits and the punctuation Yahoo uses: ^GSPC, BTC-USD, EURUSD=X, BRK.B
const SYMBOL_RE = /^[A-Z0-9^][A-Z0-9.\-=^]{0,19}$/;
const PERIODS = new Set(["1mo", "3mo", "6mo", "1y", "2y", "5y"]);
const TIMEOUT_MS = 15_000;
const CACHE_OK = "public, s-maxage=60, stale-while-revalidate=30";

// Errors are never cached, so a brief outage doesn't stick around for a minute.
function fail(status: number, error: string) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  // 1. Validate the symbol
  const { symbol: raw } = await params;
  let symbol: string;
  try {
    symbol = decodeURIComponent(raw ?? "").trim().toUpperCase();
  } catch {
    return fail(400, "Invalid symbol.");
  }
  if (!SYMBOL_RE.test(symbol)) return fail(400, "Invalid symbol.");

  // 2. Validate the optional ?period= (defaults to 3 months)
  const period = req.nextUrl.searchParams.get("period") ?? "3mo";
  if (!PERIODS.has(period)) {
    return fail(400, `Unsupported period. Use one of: ${[...PERIODS].join(", ")}.`);
  }

  // 3. Call the backend, keeping ^ and = readable the way the backend expects
  const path = encodeURIComponent(symbol).replace(/%5E/gi, "^").replace(/%3D/gi, "=");
  const url = `${BACKEND_BASE}/api/stock/${path}?period=${period}`;

  let upstream: Response;
  try {
    upstream = await fetch(url, {
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

  // 4. Map backend errors to clear responses
  if (upstream.status === 404) return fail(404, `No data found for ${symbol}.`);
  if (upstream.status === 400 || upstream.status === 422) return fail(400, `Invalid request for ${symbol}.`);
  if (upstream.status === 429) return fail(429, "Too many requests. Please wait a moment and try again.");
  if (!upstream.ok) {
    console.error(`[api/app/stock] backend returned ${upstream.status} for ${symbol}`);
    return fail(502, "Market data is temporarily unavailable.");
  }

  // 5. Pass the data through, cached at the edge
  let data: unknown;
  try {
    data = await upstream.json();
  } catch {
    console.error(`[api/app/stock] non-JSON response for ${symbol}`);
    return fail(502, "Market data service returned an unreadable response.");
  }

  return NextResponse.json(data, { headers: { "Cache-Control": CACHE_OK } });
}
