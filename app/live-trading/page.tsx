"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import AppShell, { SignInCard } from "@/components/AppShell";
import { api } from "@/lib/appApi";

// ─── Types ───────────────────────────────────────────────────────────────────
type AlpacaAccount = { equity: string; cash: string; buying_power: string; last_equity: string; status: string };
type AlpacaPosition = { symbol: string; qty: string; market_value: string; unrealized_pl: string; avg_entry_price: string; current_price: string };
type AlpacaOrder = { id: string; symbol: string; qty: string; side: string; type: string; status: string; created_at: string };
type Bot2Config = {
  max_positions: number;
  risk_pct: number;
  daily_loss_limit_pct: number;
  rsi_buy_max: number;
  rsi_sell_min: number;
  require_macd: boolean;
  stop_loss_atr: number;
  take_profit_atr: number;
  watchlist: string[];
};
type RunResult = { symbol: string; action: string; reason?: string; price?: number; rsi?: number; ai?: string };

const fmt = (n: string | number) =>
  Number(n).toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
const pnlColor = (n: string | number) => (Number(n) >= 0 ? "text-green-400" : "text-red-400");

// ─── Component ───────────────────────────────────────────────────────────────
export default function LiveTradingPage() {
  const { data: session, status } = useSession();
  const userId = (session?.user?.email ?? "").replace(/[@.]/g, "_");

  const [account, setAccount] = useState<AlpacaAccount | null>(null);
  const [positions, setPositions] = useState<AlpacaPosition[]>([]);
  const [orders, setOrders] = useState<AlpacaOrder[]>([]);
  const [config, setConfig] = useState<Bot2Config | null>(null);
  const [runResults, setRunResults] = useState<RunResult[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; kind: "error" | "ok" } | null>(null);
  const [tab, setTab] = useState<"positions" | "orders" | "config" | "history">("positions");
  const [watchlistInput, setWatchlistInput] = useState("");
  const [alpacaConnected, setAlpacaConnected] = useState<boolean | null>(null);

  const loadAccount = useCallback(async () => {
    try {
      const a = await api<AlpacaAccount>("live/account");
      setAccount(a);
      setAlpacaConnected(true);
    } catch (e: any) {
      setAlpacaConnected(false);
      setMsg({ text: e.message, kind: "error" });
    }
  }, []);

  const loadPositions = useCallback(async () => {
    try { setPositions(await api<AlpacaPosition[]>("live/positions")); } catch {}
  }, []);

  const loadOrders = useCallback(async () => {
    try { setOrders(await api<AlpacaOrder[]>("live/orders")); } catch {}
  }, []);

  const loadConfig = useCallback(async () => {
    if (!userId) return;
    try { setConfig(await api<Bot2Config>(`live/bot2/config/${userId}`)); } catch {}
  }, [userId]);

  useEffect(() => {
    if (status !== "authenticated") return;
    loadAccount();
    loadPositions();
    loadOrders();
    loadConfig();
  }, [status, loadAccount, loadPositions, loadOrders, loadConfig]);

  useEffect(() => {
    if (config) setWatchlistInput(config.watchlist.join(", "));
  }, [config]);

  const saveConfig = async () => {
    if (!config || !userId) return;
    setBusy(true);
    setMsg(null);
    try {
      const updated = { ...config, watchlist: watchlistInput.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean) };
      await api(`live/bot2/config/${userId}`, { method: "PUT", body: updated });
      setConfig(updated);
      setMsg({ text: "Config saved!", kind: "ok" });
    } catch (e: any) {
      setMsg({ text: e.message, kind: "error" });
    } finally {
      setBusy(false);
    }
  };

  const runBot2 = async (dryRun = false) => {
    if (!userId) return;
    setBusy(true);
    setMsg(null);
    setRunResults(null);
    try {
      const r = await api<{ results: RunResult[]; equity: number; daily_pnl_pct: number }>(
        `live/bot2/run/${userId}?dry_run=${dryRun}`,
        { method: "POST" }
      );
      setRunResults(r.results);
      if (!dryRun) { await loadAccount(); await loadPositions(); await loadOrders(); }
      setMsg({ text: `${dryRun ? "Dry run" : "Bot run"} complete — equity ${fmt(r.equity)}, daily P&L ${r.daily_pnl_pct.toFixed(2)}%`, kind: "ok" });
    } catch (e: any) {
      setMsg({ text: e.message, kind: "error" });
    } finally {
      setBusy(false);
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      await api(`live/order/${orderId}`, { method: "DELETE" });
      await loadOrders();
    } catch (e: any) {
      setMsg({ text: e.message, kind: "error" });
    }
  };

  const liquidate = async () => {
    if (!confirm("Emergency liquidate ALL positions? This places market sell orders immediately.")) return;
    setBusy(true);
    try {
      const r = await api<{ liquidated: string[] }>(`live/bot2/liquidate/${userId}`, { method: "POST" });
      setMsg({ text: `Liquidated: ${r.liquidated.join(", ") || "none"}`, kind: "ok" });
      await loadPositions(); await loadOrders();
    } catch (e: any) {
      setMsg({ text: e.message, kind: "error" });
    } finally {
      setBusy(false);
    }
  };

  if (status === "loading") return <AppShell><div className="p-8 text-center text-gray-400">Loading…</div></AppShell>;
  if (status !== "authenticated") return <AppShell><SignInCard /></AppShell>;

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">📈 Live Trading — Bot 2</h1>
            <p className="text-sm text-gray-400 mt-1">Alpaca Markets · RSI + MACD + ATR · bracket orders</p>
            {alpacaConnected === false && (
              <span className="inline-block mt-1 text-xs bg-red-900/40 text-red-400 border border-red-800 px-2 py-0.5 rounded">
                Alpaca not connected — add API keys to Cloud Run
              </span>
            )}
            {alpacaConnected === true && (
              <span className="inline-block mt-1 text-xs bg-green-900/40 text-green-400 border border-green-800 px-2 py-0.5 rounded">
                ✓ Alpaca paper trading connected
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => runBot2(true)}
              disabled={busy || !alpacaConnected}
              className="text-sm bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-300 px-4 py-2 rounded border border-gray-700 transition"
            >
              Dry Run
            </button>
            <button
              onClick={() => runBot2(false)}
              disabled={busy || !alpacaConnected}
              className="text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white px-4 py-2 rounded transition font-medium"
            >
              {busy ? "Running…" : "▶ Run Bot"}
            </button>
            <button
              onClick={liquidate}
              disabled={busy || !alpacaConnected}
              className="text-sm bg-red-900 hover:bg-red-800 disabled:opacity-40 text-red-300 px-4 py-2 rounded border border-red-700 transition"
            >
              🚨 Liquidate All
            </button>
          </div>
        </div>

        {msg && (
          <div className={`text-sm px-4 py-2 rounded border ${msg.kind === "ok" ? "bg-green-900/30 border-green-700/50 text-green-300" : "bg-red-900/30 border-red-700/50 text-red-300"}`}>
            {msg.text}
          </div>
        )}

        {/* Account Stats */}
        {account && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Equity", value: fmt(account.equity) },
              { label: "Cash", value: fmt(account.cash) },
              { label: "Buying Power", value: fmt(account.buying_power) },
              { label: "Daily P&L", value: fmt(Number(account.equity) - Number(account.last_equity)), color: pnlColor(Number(account.equity) - Number(account.last_equity)) },
            ].map((s) => (
              <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                <p className={`text-lg font-semibold ${s.color ?? "text-white"}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Bot Run Results */}
        {runResults && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">Last Run Results</h3>
            {runResults.map((r, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 text-sm bg-gray-800 px-3 py-2 rounded">
                <span className="font-mono text-blue-300 w-14">{r.symbol}</span>
                <span className={`w-8 font-bold ${r.ai === "BUY" ? "text-green-400" : r.ai === "SELL" ? "text-red-400" : "text-gray-400"}`}>{r.ai}</span>
                {r.rsi != null && <span className="text-gray-500 text-xs">RSI {r.rsi}</span>}
                <span className="text-gray-300 flex-1">{r.action}</span>
                {r.reason && <span className="text-gray-600 text-xs">{r.reason}</span>}
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div>
          <div className="flex gap-1 border-b border-gray-800 mb-4 overflow-x-auto">
            {(["positions", "orders", "config"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm capitalize whitespace-nowrap transition ${tab === t ? "border-b-2 border-blue-500 text-white" : "text-gray-500 hover:text-gray-300"}`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Positions */}
          {tab === "positions" && (
            <div className="overflow-x-auto">
              {!positions.length ? (
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
                    {positions.map((p) => (
                      <tr key={p.symbol} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                        <td className="py-2 pr-4 font-mono text-blue-300">{p.symbol}</td>
                        <td className="py-2 pr-4 text-gray-300">{p.qty}</td>
                        <td className="py-2 pr-4 text-gray-300">{fmt(p.avg_entry_price)}</td>
                        <td className="py-2 pr-4 text-gray-300">{fmt(p.current_price)}</td>
                        <td className="py-2 pr-4 text-gray-300">{fmt(p.market_value)}</td>
                        <td className={`py-2 font-medium ${pnlColor(p.unrealized_pl)}`}>{fmt(p.unrealized_pl)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Orders */}
          {tab === "orders" && (
            <div className="overflow-x-auto">
              {!orders.length ? (
                <p className="text-gray-500 text-sm text-center py-8">No open orders</p>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="text-gray-500 text-xs uppercase border-b border-gray-800">
                      <th className="py-2 pr-4">Symbol</th>
                      <th className="py-2 pr-4">Side</th>
                      <th className="py-2 pr-4">Qty</th>
                      <th className="py-2 pr-4">Type</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                        <td className="py-2 pr-4 font-mono text-blue-300">{o.symbol}</td>
                        <td className={`py-2 pr-4 font-medium ${o.side === "buy" ? "text-green-400" : "text-red-400"}`}>{o.side.toUpperCase()}</td>
                        <td className="py-2 pr-4 text-gray-300">{o.qty}</td>
                        <td className="py-2 pr-4 text-gray-400">{o.type}</td>
                        <td className="py-2 pr-4 text-gray-400">{o.status}</td>
                        <td className="py-2">
                          <button onClick={() => cancelOrder(o.id)} className="text-xs text-red-400 hover:text-red-300 border border-red-900 hover:border-red-700 px-2 py-0.5 rounded transition">
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Config */}
          {tab === "config" && config && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4 max-w-2xl">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Bot 2 Configuration</h3>
              <div className="grid grid-cols-2 gap-4">
                {([
                  ["max_positions", "Max Positions", "number"],
                  ["risk_pct", "Risk % per Trade", "number"],
                  ["daily_loss_limit_pct", "Daily Loss Limit %", "number"],
                  ["rsi_buy_max", "RSI Buy Max", "number"],
                  ["rsi_sell_min", "RSI Sell Min", "number"],
                  ["stop_loss_atr", "Stop Loss (ATR×)", "number"],
                  ["take_profit_atr", "Take Profit (ATR×)", "number"],
                ] as const).map(([key, label, type]) => (
                  <div key={key}>
                    <label className="block text-xs text-gray-500 mb-1">{label}</label>
                    <input
                      type={type}
                      step="0.1"
                      value={(config as any)[key]}
                      onChange={(e) => setConfig({ ...config, [key]: type === "number" ? parseFloat(e.target.value) : e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Watchlist (comma-separated)</label>
                  <input
                    value={watchlistInput}
                    onChange={(e) => setWatchlistInput(e.target.value)}
                    placeholder="AAPL,MSFT,NVDA"
                    className="w-full bg-gray-800 border border-gray-700 text-white text-sm rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="require_macd"
                    checked={config.require_macd}
                    onChange={(e) => setConfig({ ...config, require_macd: e.target.checked })}
                    className="accent-blue-500"
                  />
                  <label htmlFor="require_macd" className="text-sm text-gray-300">Require MACD bullish crossover</label>
                </div>
              </div>
              <button
                onClick={saveConfig}
                disabled={busy}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded transition"
              >
                {busy ? "Saving…" : "Save Config"}
              </button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
