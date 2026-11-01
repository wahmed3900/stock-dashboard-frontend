import { NextRequest, NextResponse } from "next/server";

const SEC_HEADERS = { "User-Agent": "StockAI wahmed07860786@gmail.com" };
const DAY_MS = 24 * 60 * 60 * 1000;
let cikCache: Map<string, string> | null = null;
let cikLoadedAt = 0;

async function getCik(ticker: string): Promise<string | undefined> {
  if (!cikCache || Date.now() - cikLoadedAt > DAY_MS) {
    const response = await fetch("https://www.sec.gov/files/company_tickers.json", {
      headers: SEC_HEADERS,
      next: { revalidate: 86400 },
    });
    if (!response.ok) throw new Error("SEC ticker data is temporarily unavailable");
    const rows = (await response.json()) as Record<string, { ticker: string; cik_str: number }>;
    cikCache = new Map(
      Object.values(rows).map((row) => [row.ticker.toUpperCase(), String(row.cik_str).padStart(10, "0")]),
    );
    cikLoadedAt = Date.now();
  }
  return cikCache.get(ticker.toUpperCase());
}

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

    const response = await fetch(`https://data.sec.gov/submissions/CIK${cik}.json`, {
      headers: SEC_HEADERS,
      next: { revalidate: 900 },
    });
    if (!response.ok) throw new Error("SEC filing data is temporarily unavailable");
    const data = await response.json();
    const recent = data.filings?.recent;
    const filings: { date: string; url: string }[] = [];
    if (recent) {
      for (let i = 0; i < recent.form.length && filings.length < limit; i++) {
        if (recent.form[i] !== "4") continue;
        filings.push({
          date: recent.filingDate[i],
          url: `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${recent.accessionNumber[i].replaceAll("-", "")}/${recent.primaryDocument[i].split("/").map(encodeURIComponent).join("/")}`,
        });
      }
    }
    return NextResponse.json({ ticker, filings }, { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" } });
  } catch {
    return NextResponse.json({ detail: "SEC filings are temporarily unavailable. Please try again." }, { status: 502 });
  }
}
