"use client";

import { useEffect, useState } from "react";

type Article = {
  headline: string;
  summary: string;
  source: string;
  url: string;
  datetime: number;
  image?: string;
};

type Props = {
  symbol?: string;
  category?: string;
};

const BACKEND = process.env.NEXT_PUBLIC_API_URL ?? "https://stock-bull-bearish.onrender.com";

export default function MarketNews({ symbol, category = "general" }: Props) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const url = symbol
      ? `${BACKEND}/api/news?symbol=${encodeURIComponent(symbol)}`
      : `${BACKEND}/api/news?category=${category}`;

    fetch(url)
      .then((r) => r.json())
      .then((d) => setArticles(d.articles ?? []))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, [symbol, category]);

  return (
    <section className="border border-[#1e1e24] rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-white mb-1">
        {symbol ? `${symbol} News` : "Market News"}
      </h2>
      <p className="text-xs text-[#71717a] mb-5">Latest headlines · not financial advice</p>
      {loading && (
        <div className="text-sm text-[#71717a] text-center py-6">Loading news…</div>
      )}
      {!loading && articles.length === 0 && (
        <div className="text-sm text-[#71717a] text-center py-6">No recent news found.</div>
      )}
      <div className="space-y-3">
        {articles.map((a, i) => (
          <a
            key={i}
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex gap-4 rounded-xl border border-[#27272a] bg-[#18181b] p-4 hover:border-zinc-500 transition"
          >
            {a.image && (
              <img
                src={a.image}
                alt=""
                className="w-16 h-16 rounded-lg object-cover shrink-0 bg-zinc-800"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white leading-snug group-hover:underline line-clamp-2">
                {a.headline}
              </p>
              {a.summary && (
                <p className="mt-1 text-xs text-[#a1a1aa] line-clamp-2">{a.summary}</p>
              )}
              <div className="mt-2 flex items-center gap-2 text-xs text-[#52525b]">
                <span>{a.source}</span>
                {a.datetime && (
                  <>
                    <span>·</span>
                    <span>{new Date(a.datetime * 1000).toLocaleDateString()}</span>
                  </>
                )}
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
    }
