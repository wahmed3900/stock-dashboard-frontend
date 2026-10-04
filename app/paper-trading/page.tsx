"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import AppShell, { SignInCard } from "@/components/AppShell";
import { api } from "@/lib/appApi";

// ─── Types ───────────────────────────────────────────────────────────────────
type Portfolio = {
  cash: number;
  market_value: number;
  total_equity: number;
  positions: Position[];
};
type Position = {
  _id: string;
  symbol: string;
  qty: number;
  entry_price: number;
  current_price?: number;
  market_value?: number;
  unrealized_pnl?: number;
  source: string;
  opened_at: string;
};
type Trade = {
  _id: string;
  symbol: string;
  qty: number;
  entry_price: number;
  exit_price: number;
  pnl: number;
  closed_at: string;
};
type BotResult = { symbol: string; signal: string; action: string };

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  "https://stock-dashboard-backend-634072894074.us-west4.run.app";

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
const pct = (n: number) => (n >= 0 ? "+" : "") + n.toFixed(2) + "%";

// ─── Component ───────────────────────────────────────────────────────────────
export default function PaperTradingPage() {
  const { data: session, status } = useSession();
  const userId = (session?.user?.email ?? "").replace(/[@.]/g, "_");

  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [botResults, setBotResults] = useState<BotResult[] | null>(null);
  const [watchlistInput, setWatchlistInput] = useState("AAPL,MSFT,NVDA,TSLA");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [tab, setTab] = useState<"positions" | "trades">("positions");

  const loadPortfolio = useCallback(async () => {
    if (!userId) return;
    try {
      const p = await api<Portfolio>(`paper/portfolio/${userId}`);
      setPortfolio(p);
    } catch (e: any) {
      setMsg(e.message);
    }
  }, [userId]);

  const loadTrades = useCallback(async () => {
    if (!userId) return;
    try {
      const t = await api<Trade[]>(`paper/trades/${userId}`);
      setTrades(t);
    } catch {}
  }, [userId]);

  useEffect(() => {
    if (status !== "authenticated") return;
    loadPortfolio();
    loadTrades();
  }, [status, loadPortfolio, loadTrades]);

  const runBot = async () => {
    setBusy(true);
    setMsg(null);
    setBotResults(null);
    try {
      const symbols = watchlistInput.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
      const r = await api<{ results: BotResult[] }>("paper/bot/run", {
        method: "POST",
        body: { user_id: userId, watchlist: symbols, ai_source: "gemini", dry_run: false },
      });
      setBotResults(r.results);
      await loadPortfolio();
      await loadTrades();
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  };

  const resetAccount = async () => {
    if (!confirm("Reset account to $100,000? All positions will be closed.")) return;
    setBusy(true);
    try {
      await api(`paper/account/${userId}/reset`, { method: "POST" });
      setBotResults(null);
      await loadPortfolio();
      await loadTrades();
      setMsg("Account reset to $100,000");
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  };

  const pnlColor = (n: number) => (n >= 0 ? "text-green-400" : "text-red-400");
  const startingCash = 100_000;
  const totalReturn = portfolio ? ((portfolio.total_equity - startingCash) / startingCash) * 100 : 0;

  if (status === "loading") return <AppShell><div className="p-8 text-center text-gray-400">Loading…</div></AppShell>;
  if (status !== "authenticated") return <AppShell><SignInCard /></AppShell>;

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">📊 Paper Trading — Bot 1</h1>
            <p className="text-sm text-gray-400 mt-1">AI-powered signals · $100k virtual account · no real money</p>
          </div>
          <button
            onClick={resetAccount}
            disabled={busy}
            className="text-xs text-gray-500 hover:text-red-400 border border-gray-700 hover:border-red-700 px-3 py-1.5 rounded transition"
          >
            Reset Account
          </button>
        </div>

        {msg && (
          <div className="bg-yellow-900/30 border border-yellow-700/50 text-yellow-300 text-sm px-4 py-2 rounded">
            {msg}
          </div>
        )}

        {/* Stats */}
        {portfolio && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Equity", value: fmt(portfolio.total_equity) },
              { label: "Cash", value: fmt(portfolio.cash) },
              { label: "Market Value", value: fmt(portfolio.market_value) },
              {
                label: "Total Return",
                value: pct(totalReturn),
                color: pnlColor(totalReturn),
              },
            ].map((s) => (
              <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                <p className={`text-lg font-semibold ${s.color ?? "text-white"}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Run Bot */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Run Bot 1</h2>
          <div className="flex gap-2">
            <input
              value={watchlistInput}
              onChange={(e) => setWatchlistInput(e.target.value)}
              placeholder="AAPL,MSFT,NVDA"
              className="flex-1 bg-gray-800 border border-gray-700 text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={runBot}
              disabled={busy}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded transition"
            >
              {busy ? "Running…" : "▶ Run Bot"}
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Comma-separated symbols. Bot 1 uses Gemini AI signals and risks 5% of cash per BUY.
          </p>

          {botResults && (
            <div className="mt-3 space-y-1">
              {botResults.map((r) => (
                <div key={r.symbol} className="flex items-center gap-3 text-sm bg-gray-800 px-3 py-2 rounded">
                  <span className="font-mono text-blue-300 w-14">{r.symbol}</span>
                  <span className={`w-12 font-semibold ${r.signal === "BUY" ? "text-green-400" : r.signal === "SELL" ? "text-red-400" : "text-gray-400"}`}>{r.signal}</span>
                  <span className="text-gray-300">{r.action}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div>
          <div className="flex gap-1 border-b border-gray-800 mb-4">
            {(["positions", "trades"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm capitalize transition ${tab === t ? "border-b-2 border-blue-500 text-white" : "text-gray-500 hover:text-gray-300"}`}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === "positions" && (
            <div className="overflow-x-auto">
              {!portfolio?.positions?.length ? (
                <p className="text-gray-500 text-sm text-center py-8">No open positions</p>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="text-gray-500 text-xs uppercase border-b border-gray-800">
                      <th className="py-2 pr-4">Symbol</th>
                      <th className="py-2 pr-4">Qty</th>
                      <th className="py-2 pr-4">Entry</th>
                      <th className="py-2 pr-4">Current</th>
                      <th className="py-2 pr-4">Value</th>
                      <th className="py-2">Unrealized P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio.positions.map((p) => (
                      <tr key={p._id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                        <td className="py-2 pr-4 font-mono text-blue-300">{p.symbol}</td>
                        <td className="py-2 pr-4 text-gray-300">{p.qty}</td>
                        <td className="py-2 pr-4 text-gray-300">{fmt(p.entry_price)}</td>
                        <td className="py-2 pr-4 text-gray-300">{p.current_price != null ? fmt(p.current_price) : "—"}</td>
                        <td className="py-2 pr-4 text-gray-300">{p.market_value != null ? fmt(p.market_value) : "—"}</td>
                        <td className={`py-2 font-medium ${p.unrealized_pnl != null ? pnlColor(p.unrealized_pnl) : "text-gray-500"}`}>
                          {p.unrealized_pnl != null ? fmt(p.unrealized_pnl) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === "trades" && (
            <div className="overflow-x-auto">
              {!trades.length ? (
                <p className="text-gray-500 text-sm text-center py-8">No closed trades yet</p>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="text-gray-500 text-xs uppercase border-b border-gray-800">
                      <th className="py-2 pr-4">Symbol</th>
                      <th className="py-2 pr-4">Qty</th>
                      <th className="py-2 pr-4">Entry</th>
                      <th className="py-2 pr-4">Exit</th>
                      <th className="py-2 pr-4">P&L</th>
                      <th className="py-2">Closed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.map((t) => (
                      <tr key={t._id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                        <td className="py-2 pr-4 font-mono text-blue-300">{t.symbol}</td>
                        <td className="py-2 pr-4 text-gray-300">{t.qty}</td>
                        <td className="py-2 pr-4 text-gray-300">{fmt(t.entry_price)}</td>
                        <td className="py-2 pr-4 text-gray-300">{fmt(t.exit_price)}</td>
                        <td className={`py-2 pr-4 font-medium ${pnlColor(t.pnl)}`}>{fmt(t.pnl)}</td>
                        <td className="py-2 text-gray-500">{new Date(t.closed_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
