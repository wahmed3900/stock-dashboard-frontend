"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import AppShell from "@/components/AppShell";
import { resolveSymbol, fmtPrice as fmt } from "@/lib/symbols";
import { api, ApiError } from "@/lib/appApi";

// Goes through the signed-in bridge so paying users get their plan's features
const API_BASE = "/api/app";

type View = {
  symbol: string;
  price?: number;
  change?: number;
  source?: string;
  rsi?: number;
  macd?: number;
  macdHist?: number;
  upper?: number;
  lower?: number;
  insight?: string;
  aiLocked?: boolean;
};

// Accept numbers or numeric strings; return the first usable value.
function num(...vals: unknown[]): number | undefined {
  for (const v of vals) {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "" && Number.isFinite(+v)) return +v;
  }
  return undefined;
}

// Map whatever the backend sends onto the fields this page shows.
// Covers the common naming variants so a small backend difference
// doesn't turn every card into a dash.
function normalize(json: any, symbol: string): View {
  const root = json?.data ?? json?.quote ?? json?.result ?? json ?? {};
  // Backend sends indicators under "metrics"
  const ti = root.metrics ?? root.technical_indicators ?? root.indicators ?? root.technicals ?? {};
  const macd = ti.macd ?? root.macd;
  const boll = ti.bollinger ?? ti.bollinger_bands ?? ti.bbands ?? root.bollinger ?? {};

  // Daily history, oldest first: used to work out % change vs the previous close
  const history: any[] = Array.isArray(root.history) ? root.history : [];
  const closes = history.map((d) => num(d.Close, d.close)).filter((n): n is number => n != null);

  const price = num(ti.latest_close, root.current_price, root.price, root.close, root.last, closes[closes.length - 1]);
  const prev = closes.length >= 2 ? closes[closes.length - 2] : undefined;
  const computedChange = price != null && prev ? ((price - prev) / prev) * 100 : undefined;

  // MACD needs ~35 trading days; with less history the backend returns all zeros
  const macdObj = typeof macd === "object" && macd ? macd : null;
  const macdMissing =
    macdObj && [macdObj.macd, macdObj.line, macdObj.signal, macdObj.histogram].every((v) => !v);

  // Summary can be a string or an object of model outputs, e.g. { gemini, claude }
  const summaries =
    root.summary && typeof root.summary === "object" ? Object.values(root.summary) : [root.summary];
  const insight = [root.ai_analysis, root.analysis, root.verdict, ...summaries].find(
    (s) => typeof s === "string" && s.trim() && s.trim().toLowerCase() !== "unavailable"
  ) as string | undefined;

  return {
    symbol: root.symbol ?? root.ticker ?? symbol,
    price,
    change: num(root.change_pct, root.change_percent, root.changePercent, root.pct_change, computedChange),
    source: root.source ?? root.provider,
    rsi: num(ti.rsi, ti.rsi_14, ti.RSI, root.rsi),
    macd: macdMissing ? undefined : num(macdObj ? macdObj.line ?? macdObj.macd : macd, ti.macd_line),
    macdHist: macdMissing ? undefined : num(macdObj?.histogram ?? macdObj?.hist, ti.macd_histogram),
    upper: num(boll.upper, boll.upper_band, ti.bb_upper, ti.upper_band, root.bb_upper),
    lower: num(boll.lower, boll.lower_band, ti.bb_lower, ti.lower_band, root.bb_lower),
    insight,
    aiLocked: !!root.ai_locked,
  };
}

// The 7 asset classes, each with a one-click example in Yahoo Finance format
const ASSET_CLASSES = [
  { label: "Stocks", symbol: "AAPL" },
  { label: "ETFs", symbol: "SPY" },
  { label: "Indices", symbol: "^GSPC" },
  { label: "Forex", symbol: "EURUSD=X" },
  { label: "Crypto", symbol: "BTC-USD" },
  { label: "Commodities", symbol: "GC=F" },
  { label: "Bonds", symbol: "^TNX" },
];

export default function StockDashboard() {
  const [symbol, setSymbol] = useState("AAPL");
  const [input, setInput] = useState("AAPL");
  const [view, setView] = useState<View | null>(null);
  const [raw, setRaw] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [watchMsg, setWatchMsg] = useState<string | null>(null);
  const router = useRouter();

  // Open a symbol straight from a link, e.g. /?symbol=TSLA (used by the watchlist)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("symbol");
    if (q) {
      setInput(q.toUpperCase());
      setSymbol(q.toUpperCase());
    }
  }, []);

  async function addToWatchlist() {
    if (!view) return;
    setWatchMsg(null);
    try {
      await api("watchlist", { method: "POST", body: { symbol: view.symbol } });
      setWatchMsg("Added to your watchlist");
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return signIn("google");
      if (e instanceof ApiError && e.status === 402) return router.push("/pricing");
      setWatchMsg(e instanceof Error ? e.message : "Couldn't add it");
    }
  }

  async function load(sym: string) {
    setLoading(true);
    setError(null);
    try {
      const ysym = resolveSymbol(sym);
      const res = await fetch(`${API_BASE}/stock/${encodeURIComponent(ysym)}?period=3mo`);
      // The backend sometimes answers with plain text (e.g. "Internal Server Error"), so don't assume JSON
      const text = await res.text();
      let json: any = null;
      try {
        json = JSON.parse(text);
      } catch {}
      if (!res.ok || !json) {
        throw new Error(
          json?.detail || json?.error ||
            (res.status >= 500 ? `The server couldn't analyze ${ysym} right now.` : `No data for ${ysym}`)
        );
      }
      setRaw(json);
      setView(normalize(json, ysym));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load this ticker.");
      setView(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(symbol);
    const id = setInterval(() => load(symbol), 60000);
    return () => clearInterval(id);
  }, [symbol]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next = input.trim().toUpperCase();
    if (next) setSymbol(next);
  }

  const up = (view?.change ?? 0) >= 0;
  const missing =
    view && [view.price, view.rsi, view.upper, view.lower].some((v) => v == null);

  return (
    <AppShell>
        <header className="flex flex-wrap min-h-16 items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-[#1e1e24]">
          <span className="text-sm font-medium text-[#71717a]">Market data · may be delayed</span>
          <form onSubmit={submit} className="flex items-center space-x-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="AAPL, BTC, EUR, SP500…"
              aria-label="Ticker symbol"
              className="bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400 w-40 sm:w-48"
            />
            <button
              type="submit"
              className="bg-white text-black text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-400"
            >
              Analyze
            </button>
          </form>
        </header>

        <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            {ASSET_CLASSES.map((a) => {
              const active = resolveSymbol(symbol) === a.symbol;
              return (
                <button
                  key={a.label}
                  type="button"
                  onClick={() => {
                    setInput(a.symbol);
                    setSymbol(a.symbol);
                  }}
                  className={`rounded-full border px-3 py-1 text-xs transition focus:outline-none focus:ring-2 focus:ring-zinc-400 ${
                    active
                      ? "border-white bg-white text-black"
                      : "border-[#27272a] text-[#a1a1aa] hover:border-zinc-500 hover:text-white"
                  }`}
                >
                  {a.label} <span className={active ? "text-zinc-600" : "text-[#52525b]"}>{a.symbol}</span>
                </button>
              );
            })}
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-300">
              {error}<br />Try one of the examples above, a ticker like AAPL, or add the exchange for other markets, e.g. SHOP.TO for Toronto.
            </div>
          )}

          {loading && !view && (
            <div className="rounded-2xl border border-[#1e1e24] p-10 text-center text-sm text-[#71717a]">
              Loading {symbol}…
            </div>
          )}

          {view && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 border border-[#1e1e24] rounded-2xl p-6 flex flex-col">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h2 className="text-3xl font-bold tracking-tight text-white tabular-nums">
                        {fmt(view.price, view.symbol)}
                      </h2>
                      <p
                        className={`text-sm font-medium flex items-center gap-1 tabular-nums ${
                          up ? "text-emerald-500" : "text-rose-500"
                        }`}
                      >
                        {view.change != null
                          ? `${up ? "▲ +" : "▼ "}${Math.abs(view.change).toFixed(2)}%`
                          : "—"}
                        <span className="text-[#71717a] font-normal">({view.symbol})</span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {view.source && (
                        <span className="bg-[#14532d] text-emerald-300 text-xs px-2.5 py-1 rounded-full font-medium">
                          {view.source}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={addToWatchlist}
                        className="rounded-lg border border-[#27272a] px-3 py-1 text-xs text-[#d4d4d8] hover:border-zinc-500 hover:text-white"
                      >
                        ☆ Add to watchlist
                      </button>
                      {watchMsg && <span className="text-xs text-[#a1a1aa]">{watchMsg}</span>}
                    </div>
                  </div>
                  <div className="mt-6 flex-1 rounded-xl bg-[#18181b] border border-[#27272a] p-4 text-sm leading-relaxed text-[#d4d4d8]">
                    <span className="font-semibold text-white">
                      {view.aiLocked ? "Automated reading: " : "AI summary: "}
                    </span>
                    {view.insight ?? "No analysis returned for this ticker yet."}
                    {view.aiLocked && (
                      <p className="mt-3 text-xs text-[#a1a1aa]">
                        Want an AI-written summary instead?{" "}
                        <Link href="/pricing" className="text-white underline">It&apos;s included in Starter</Link>.
                      </p>
                    )}
                    <p className="mt-3 text-xs text-[#71717a]">
                      {view.aiLocked ? "Generated automatically from technical indicators." : "Generated by AI from technical indicators. It can be wrong."}{" "}
                      Not financial advice.
                    </p>
                  </div>
                </div>

                <div className="border border-[#1e1e24] rounded-2xl p-6">
                  <h3 className="text-sm font-medium text-[#e4e4e7] mb-1">Project demo</h3>
                  <p className="text-xs text-[#71717a] mb-4">How the analyzer works</p>
                  <div className="aspect-video rounded-xl overflow-hidden border border-[#27272a] bg-zinc-900">
                    <iframe
                      className="h-full w-full"
                      src="https://www.youtube-nocookie.com/embed/gQpinwa-Gkk"
                      title="StockAI demo"
                      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Metric label="RSI (14)" value={view.rsi != null ? view.rsi.toFixed(1) : "—"}
                  tone={view.rsi == null ? "" : view.rsi >= 70 ? "text-rose-500" : view.rsi <= 30 ? "text-emerald-400" : ""} />
                <Metric label="MACD" value={view.macd != null ? view.macd.toFixed(Math.abs(view.macd) < 1 ? 4 : 2) : "Not enough data"}
                  tone={view.macdHist == null ? "" : view.macdHist >= 0 ? "text-emerald-400" : "text-rose-500"} />
                <Metric label="Upper band" value={fmt(view.upper, view.symbol)} tone="text-[#f43f5e]" />
                <Metric label="Lower band" value={fmt(view.lower, view.symbol)} tone="text-emerald-400" />
              </div>

              {missing && (
                <details className="rounded-xl border border-[#27272a] p-4 text-xs text-[#a1a1aa]">
                  <summary className="cursor-pointer text-[#e4e4e7]">
                    Some values are missing. Show the raw backend response
                  </summary>
                  <pre className="mt-3 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(raw, null, 2)}</pre>
                </details>
              )}
            </>
          )}
        </main>

    </AppShell>
  );
}

function Metric({ label, value, tone = "" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="border border-[#1e1e24] p-4 rounded-xl">
      <p className="text-xs text-[#71717a] font-medium">{label}</p>
      <p className={`text-lg font-semibold mt-1 tabular-nums ${tone || "text-white"}`}>{value}</p>
    </div>
  )
}
