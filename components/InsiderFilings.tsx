"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";

type Filing = { date: string; url: string };
type FilingResponse = { ticker: string; filings: Filing[]; detail?: string };

export default function InsiderFilings({ ticker }: { ticker: string }) {
  const { status } = useSession();
  const [data, setData] = useState<FilingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [following, setFollowing] = useState<boolean | null>(null);
  const [followBusy, setFollowBusy] = useState(false);
  const [followMsg, setFollowMsg] = useState<string | null>(null);

  useEffect(() => {
    setFollowMsg(null);
    if (status !== "authenticated") {
      setFollowing(status === "unauthenticated" ? false : null);
      return;
    }
    setFollowing(null);
    const controller = new AbortController();
    fetch("/api/signal/following", { signal: controller.signal, cache: "no-store" })
      .then((response) => (response.ok ? response.json() : { tickers: [] }))
      .then((result: { tickers: string[] }) => setFollowing(result.tickers.includes(ticker.toUpperCase())))
      .catch(() => {});
    return () => controller.abort();
  }, [ticker, status]);

  async function toggleFollow() {
    if (status !== "authenticated") return signIn("google");
    setFollowBusy(true);
    setFollowMsg(null);
    try {
      const response = following
        ? await fetch(`/api/signal/follow/${encodeURIComponent(ticker)}`, { method: "DELETE" })
        : await fetch("/api/signal/follow", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ ticker }),
          });
      if (response.status === 401) return signIn("google");
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail ?? "Something went wrong.");
      setFollowing(!following);
      setFollowMsg(following ? "Alerts off" : "We'll email you about new filings");
    } catch (reason) {
      setFollowMsg(reason instanceof Error ? reason.message : "Something went wrong.");
    } finally {
      setFollowBusy(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setData(null);
    fetch(`/api/signal/insider/${encodeURIComponent(ticker)}?limit=20`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json()) as FilingResponse;
        if (!response.ok) throw new Error(result.detail ?? "Could not load insider filings.");
        setData(result);
      })
      .catch((reason: unknown) => {
        if (reason instanceof Error && reason.name === "AbortError") return;
        setError(reason instanceof Error ? reason.message : "Could not load insider filings.");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [ticker]);

  return (
    <section aria-labelledby="insider-filings-heading" className="rounded-2xl border border-[#1e1e24] p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="insider-filings-heading" className="text-lg font-semibold text-white">Insider filings</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#71717a]">Latest Form 4 reports · SEC EDGAR</span>
          {!error && (
            <button
              type="button"
              onClick={toggleFollow}
              disabled={followBusy || following === null}
              aria-pressed={following ?? false}
              className={`rounded-lg border px-3 py-1 text-xs disabled:opacity-50 ${
                following
                  ? "border-zinc-500 bg-white text-black hover:bg-zinc-200"
                  : "border-[#27272a] text-[#d4d4d8] hover:border-zinc-500 hover:text-white"
              }`}
            >
              {following ? "✓ Following" : "🔔 Follow"}
            </button>
          )}
        </div>
      </div>
      {followMsg && <p role="status" className="mt-2 text-xs text-[#a1a1aa]">{followMsg}</p>}
      <p className="mt-1 text-sm text-[#a1a1aa]">Recent filings that report changes in company insiders’ holdings. Filing records may not show whether a trade was a buy or a sale.</p>
      {loading && <p className="mt-4 text-sm text-[#71717a]">Loading {ticker} filings…</p>}
      {error && <p role="status" className="mt-4 text-sm text-[#a1a1aa]">{error}</p>}
      {data && (data.filings.length ? (
        <ul className="mt-4 divide-y divide-[#27272a]">
          {data.filings.map((filing) => (
            <li key={`${filing.date}-${filing.url}`} className="flex items-center justify-between gap-4 py-3 text-sm">
              <time dateTime={filing.date} className="text-[#d4d4d8]">{filing.date}</time>
              <a href={filing.url} target="_blank" rel="noopener noreferrer" className="text-white underline decoration-[#52525b] underline-offset-4 hover:decoration-white">View SEC filing ↗</a>
            </li>
          ))}
        </ul>
      ) : <p className="mt-4 text-sm text-[#71717a]">No recent Form 4 filings found for {data.ticker}.</p>)}
    </section>
  );
}
