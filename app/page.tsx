"use client";

import { useEffect, useState } from "react";
import AuthButton from "@/components/AuthButton";

const API_BASE = "/api/backend";

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

// Plain words people type -> the Yahoo Finance symbol for that asset
const ALIASES: Record<string, string> = {
  EUR: "EURUSD=X", GBP: "GBPUSD=X", JPY: "JPY=X", CAD: "CAD=X", AUD: "AUDUSD=X",
  CHF: "CHF=X", INR: "INR=X", CNY: "CNY=X", MXN: "MXN=X",
  BTC: "BTC-USD", BITCOIN: "BTC-USD", ETH: "ETH-USD", ETHEREUM: "ETH-USD",
  SOL: "SOL-USD", SOLANA: "SOL-USD", XRP: "XRP-USD", DOGE: "DOGE-USD",
  XAU: "GC=F", SILVER: "SI=F", CRUDE: "CL=F", NATGAS: "NG=F",
  SP500: "^GSPC", SPX: "^GSPC", NASDAQ: "^IXIC", DOWJONES: "^DJI", TSX: "^GSPTSE", VIX: "^VIX",
  "10Y": "^TNX", "30Y": "^TYX", "5Y": "^FVX",
};

const resolveSymbol = (s: string) => ALIASES[s] ?? s;

const YIELDS = ["^TNX", "^TYX", "^FVX", "^IRX"];

// Format a price the way that asset is quoted
function fmt(n: number | undefined, sym: string): string {
  if (n == null) return "—";
  if (YIELDS.includes(sym)) return `${n.toFixed(2)}%`;
  if (sym.endsWith("=X")) return n.toFixed(4);
  if (sym.startsWith("^")) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (n < 1) return `$${n.toFixed(4)}`;
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function StockDashboard() {
  const [symbol, setSymbol] = useState("AAPL");
  const [input, setInput] = useState("AAPL");
  const [view, setView] = useState<View | null>(null);
  const [raw, setRaw] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(sym: string) {
    setLoading(true);
    setError(null);
    try {
      const ysym = resolveSymbol(sym.toUpperCase());
      const res = await fetch(`${API_BASE}/stock/${encodeURIComponent(ysym)}?period=3mo`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.detail || json?.error || `Request failed with status ${res.status}`);
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
    <div className="flex min-h-screen bg-[#09090b] text-[#f4f4f5] font-sans antialiased">
      <aside className="hidden md:flex flex-col w-64 border-r border-[#1e1e24] p-6 space-y-6">
        <span className="px-2 text-xl font-bold tracking-tight text-white">🗠 StockAI</span>
        <nav className="flex-1 space-y-1">
          <a href="/" className="flex items-center px-3 py-2 text-sm font-medium rounded-lg bg-[#18181b] text-white">
            Dashboard
          </a>
        </nav>
        <div className="pt-4 border-t border-[#1e1e24] px-2">
          <AuthButton />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex h-16 items-center justify-between gap-4 px-6 border-b border-[#1e1e24]">
          <span className="text-sm font-medium text-[#71717a]">Live market data</span>
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
                    {view.source && (
                      <span className="bg-[#14532d] text-emerald-300 text-xs px-2.5 py-1 rounded-full font-medium">
                        {view.source}
                      </span>
                    )}
                  </div>
                  <div className="mt-6 flex-1 rounded-xl bg-[#18181b] border border-[#27272a] p-4 text-sm leading-relaxed text-[#d4d4d8]">
                    <span className="font-semibold text-white">AI insight: </span>
                    {view.insight ?? "No analysis returned for this ticker yet."}
                  </div>
                </div>

                <div className="border border-[#1e1e24] rounded-2xl p-6">
                  <h3 className="text-sm font-medium text-[#e4e4e7] mb-1">Project demo</h3>
                  <p className="text-xs text-[#71717a] mb-4">How the analyzer works</p>
                  <div className="aspect-video rounded-xl overflow-hidden border border-[#27272a] bg-zinc-900">
                    <iframe
                      className="h-full w-full"
                      src="https://www.youtube.com/embed/gQpinwa-Gkk"
                      title="AI Stock Market Analyzer demo"
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
      </div>
    </div>
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
