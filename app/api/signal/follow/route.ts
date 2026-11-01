import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCik } from "@/lib/sec";
import { isValidTicker, normalizeTicker, signalFollows } from "@/lib/signalFollows";

/** Start following a ticker's insider filings. The email comes from the sign-in session. */
export async function POST(request: NextRequest) {
  const email = (await auth())?.user?.email?.trim().toLowerCase();
  if (!email) return NextResponse.json({ detail: "Please sign in" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const ticker = normalizeTicker(String(body?.ticker ?? ""));
  if (!isValidTicker(ticker)) return NextResponse.json({ detail: "Invalid ticker" }, { status: 400 });

  try {
    const cik = await getCik(ticker);
    if (!cik) return NextResponse.json({ detail: `No SEC filer found for ${ticker}` }, { status: 404 });
    const follows = await signalFollows();
    await follows.updateOne(
      { email, ticker },
      { $setOnInsert: { email, ticker, cik, last_seen: null } },
      { upsert: true },
    );
    return NextResponse.json({ following: ticker });
  } catch {
    return NextResponse.json({ detail: "Could not follow right now. Please try again." }, { status: 502 });
  }
}
