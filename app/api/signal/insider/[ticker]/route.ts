import { NextRequest, NextResponse } from "next/server";
import { fetchForm4, getCik } from "@/lib/sec";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ ticker: string }> },
) {
  const { ticker: rawTicker } = await context.params;
  const ticker = rawTicker.trim().toUpperCase();
  if (!/^[A-Z0-9.-]{1,10}$/.test(ticker)) {
    return NextResponse.json({ detail: "Invalid ticker" }, { status: 400 });
  }
  const requestedLimit = Number(request.nextUrl.searchParams.get("limit") ?? 20);
  const limit = Number.isFinite(requestedLimit) ? Math.min(100, Math.max(1, Math.floor(requestedLimit))) : 20;

  try {
    const cik = await getCik(ticker);
    if (!cik) return NextResponse.json({ detail: `No SEC filer found for ${ticker}` }, { status: 404 });

    const filings = (await fetchForm4(cik, { limit })).map(({ date, url }) => ({ date, url }));
    return NextResponse.json({ ticker, filings }, { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" } });
  } catch {
    return NextResponse.json({ detail: "SEC filings are temporarily unavailable. Please try again." }, { status: 502 });
  }
}
