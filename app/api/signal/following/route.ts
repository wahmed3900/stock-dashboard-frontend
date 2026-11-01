import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { signalFollows } from "@/lib/signalFollows";

/** List the tickers the signed-in user follows. */
export async function GET() {
  const email = (await auth())?.user?.email?.trim().toLowerCase();
  if (!email) return NextResponse.json({ detail: "Please sign in" }, { status: 401 });

  try {
    const docs = await (await signalFollows())
      .find({ email }, { projection: { _id: 0, ticker: 1 } })
      .limit(100)
      .toArray();
    return NextResponse.json({ tickers: docs.map((d) => d.ticker) });
  } catch {
    return NextResponse.json({ detail: "Could not load followed tickers." }, { status: 502 });
  }
}
