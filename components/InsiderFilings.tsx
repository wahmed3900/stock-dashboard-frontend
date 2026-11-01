"use client";

import { useEffect, useState } from "react";

type Filing = { date: string; url: string };
type FilingResponse = { ticker: string; filings: Filing[]; detail?: string };

export default function InsiderFilings({ ticker }: { ticker: string }) {
  const [data, setData] = useState<FilingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        <span className="text-xs text-[#71717a]">Latest Form 4 reports · SEC EDGAR</span>
      </div>
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
