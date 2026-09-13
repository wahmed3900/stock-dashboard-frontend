"use client";

import { useEffect, useState } from "react";

type StockData = {
  symbol: string;
  current_price: number;
  change_pct: number;
  source: string;
  technical_indicators?: {
    rsi?: number;
    macd?: { line?: number; signal?: number; histogram?: number };
    bollinger?: { upper?: number; mid?: number; lower?: number };
  };
  ai_analysis?: string;
  provider?: string;
};

const API_BASE = "/api/backend";

export default function Home() {
  const [symbol, setSymbol] = useState("AAPL");
  const [input, setInput] = useState("AAPL");
  const [data, setData] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(sym: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/stock/${sym.toUpperCase()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || `HTTP ${res.status}`);
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setData(null);
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

  const price = data?.current_price;
  const change = data?.change_pct ?? 0;
  const isUp = change >= 0;
  const rsi = data?.technical_indicators?.rsi;
  const macd = data?.technical_indicators?.macd;
  const boll = data?.technical_indicators?.bollinger;

  const rsiColor =
    rsi == null
      ? "#6b7280"
      : rsi >= 70
      ? "#f87171"
      : rsi <= 30
      ? "#4ade80"
      : "#fbbf24";

  return (
    <main className="min-h-screen bg-[#08080a] text-white antialiased">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(600px 400px at 50% -10%, rgba(99,91,255,0.15), transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-3xl px-6 py-14">
        <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/40">
              Stock Dashboard
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Live market data
            </h1>
          </div>

          <form onSubmit={submit} className="flex w-full gap-2 sm:w-auto">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search symbol…"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-white/25 sm:w-48"
            />
            <button
              type="submit"
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90"
            >
              Analyze
            </button>
          </form>
        </header>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading && !data && (
          <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-10 text-center text-white/40">
            Loading…
          </div>
        )}

        {data && (
          <>
            <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-8">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-semibold tracking-tight">
                  {data.symbol}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.15em] text-white/50">
                  {data.source}
                </span>
              </div>

              <div className="mt-6 flex flex-wrap items-end gap-x-6 gap-y-2">
                <div
                  className="text-[64px] font-semibold leading-none tracking-[-0.04em]"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {price != null ? `$${price.toFixed(2)}` : "—"}
                </div>
                <div
                  className="mb-2 inline-flex items-center gap-1.5 text-lg font-medium"
                  style={{ color: isUp ? "#4ade80" : "#f87171" }}
                >
                  <span className="text-sm">{isUp ? "▲" : "▼"}</span>
                  <span style={{ fontVariantNumeric: "tabular-nums" }}>
                    {Math.abs(change).toFixed(2)}%
                  </span>
                </div>
              </div>

              <div className="mt-8 h-px w-full bg-white/[0.06]" />

              <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
                <Stat
                  label="RSI (14)"
                  value={rsi != null ? rsi.toFixed(1) : "—"}
                  color={rsiColor}
                />
                <Stat
                  label="MACD"
                  value={macd?.line != null ? macd.line.toFixed(2) : "—"}
                  color={
                    macd?.histogram != null
                      ? macd.histogram >= 0
                        ? "#4ade80"
                        : "#f87171"
                      : "#6b7280"
                  }
                />
                <Stat
                  label="Upper band"
                  value={boll?.upper != null ? `$${boll.upper.toFixed(2)}` : "—"}
                />
                <Stat
                  label="Lower band"
                  value={boll?.lower != null ? `$${boll.lower.toFixed(2)}` : "—"}
                />
              </div>
            </section>

            {data.ai_analysis && data.provider && data.provider !== "Unavailable" && (
              <section className="mt-6 rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6">
                <div className="mb-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.15em] text-white/40">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  AI Analysis · {data.provider}
                </div>
                <p className="text-[15px] leading-relaxed text-white/80">
                  {data.ai_analysis}
                </p>
              </section>
            )}

            <div className="mt-8 flex items-center justify-between text-[11px] text-white/30">
              <span>Auto-refresh · 60s</span>
              <button
                onClick={() => load(symbol)}
                disabled={loading}
                className="rounded-lg border border-white/10 px-3 py-1.5 text-white/60 transition hover:border-white/20 hover:text-white disabled:opacity-40"
              >
                {loading ? "Refreshing…" : "Refresh"}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/35">
        {label}
      </div>
      <div
        className="mt-1.5 text-xl font-semibold"
        style={{
          color: color ?? "#f5f5f7",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
    </div>
  );
}
