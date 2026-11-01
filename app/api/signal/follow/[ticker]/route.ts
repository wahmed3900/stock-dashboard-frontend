import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { normalizeTicker, signalFollows } from "@/lib/signalFollows";

/** Stop following a ticker. */
export async function DELETE(_request: Request, context: { params: Promise<{ ticker: string }> }) {
  const email = (await auth())?.user?.email?.trim().toLowerCase();
  if (!email) return NextResponse.json({ detail: "Please sign in" }, { status: 401 });

  const ticker = normalizeTicker((await context.params).ticker);
  try {
    await (await signalFollows()).deleteOne({ email, ticker });
    return NextResponse.json({ unfollowed: ticker });
  } catch {
    return NextResponse.json({ detail: "Could not unfollow right now. Please try again." }, { status: 502 });
  }
}
