// Called by Cloud Scheduler every 15 minutes. Checks each followed company once,
// finds Form 4 filings newer than what each user was last alerted about, and
// queues an alert per user. The first check after following only records the
// newest filing, so users aren't alerted about old filings.
import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { fetchForm4, type Form4 } from "@/lib/sec";
import { signalFollows } from "@/lib/signalFollows";

type Alert = { ticker: string; filings: Form4[] };

function authorized(request: NextRequest): boolean {
  const expected = process.env.SIGNAL_API_KEY ?? "";
  const given = request.headers.get("x-api-key") ?? "";
  if (!expected || given.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

/** Placeholder: step 4 replaces this with a real email. */
async function sendAlerts(email: string, items: Alert[]): Promise<void> {
  console.info("SIGNAL ALERT for %s: %j", email, items);
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });

  const follows = await signalFollows();
  const ciks = await follows.distinct("cik");
  const pending = new Map<string, Alert[]>(); // email -> new filings to send

  for (const cik of ciks) {
    let filings: Form4[];
    try {
      filings = await fetchForm4(cik, { revalidate: 0 });
    } catch (error) {
      console.warn("SEC fetch failed for %s: %s", cik, error);
      continue;
    }
    await new Promise((resolve) => setTimeout(resolve, 150)); // stay under SEC's 10 requests/sec limit
    if (!filings.length) continue;
    const newest = filings[0].accession;

    for await (const f of follows.find({ cik, last_seen: { $ne: newest } })) {
      if (f.last_seen !== null) {
        const seenAt = filings.findIndex((item) => item.accession === f.last_seen);
        const fresh = (seenAt === -1 ? filings : filings.slice(0, seenAt)).slice(0, 10);
        pending.set(f.email, [...(pending.get(f.email) ?? []), { ticker: f.ticker, filings: fresh }]);
      }
      await follows.updateOne({ _id: f._id }, { $set: { last_seen: newest } });
    }
  }

  for (const [email, items] of pending) await sendAlerts(email, items);

  return NextResponse.json({ companies_checked: ciks.length, users_alerted: pending.size });
}
