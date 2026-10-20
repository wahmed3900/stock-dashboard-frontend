"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import AppShell, { SignInCard } from "@/components/AppShell";

// ─── Types ───────────────────────────────────────────────────────────────────
type RhAccount = { account_number: string; status: string; buying_power: string; buying_power_currency: string };
type RhHolding = { asset_code: string; total_quantity: string | number; quantity_available_for_trading: string | number };
type RhPrice = { symbol: string; price: string | number; bid_inclusive_of_sell_spread: string | number; ask_inclusive_of_buy_spread: string | number };
type RhOrder = {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  type: string;
  state: string;
  average_price: number | string | null;
  filled_asset_quantity: number | string | null;
  created_at: string;
  market_order_config?: { asset_quantity?: number | string };
  limit_order_config?: { asset_quantity?: number | string; quote_amount?: number | string; limit_price?: number | string };
};
type Page<T> = { results: T[] };

const fmt = (n: string | number | null | undefined) =>
  Number(n ?? 0).toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
const qty = (n: string | number | null | undefined) => Number(n ?? 0).toLocaleString("en-US", { maximumFractionDigits: 8 });

async function rh<T = any>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api/robinhood/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.detail ?? `Something went wrong (${res.status})`);
  return json as T;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function CryptoTradingPage() {
  const { status } = useSession();

  const [connected, setConnected] = useState<boolean | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [account, setAccount] = useState<RhAccount | null>(null);
  const [holdings, setHoldings] = useState<RhHolding[]>([]);
  const [prices, setPrices] = useState<Record<string, RhPrice>>({});
  const [orders, setOrders] = useState<RhOrder[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; kind: "error" | "ok" } | null>(null);

  const [symbol, setSymbol] = useState("BTC-USD");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [type, setType] = useState<"market" | "limit">("market");
  const [sizeBy, setSizeBy] = useState<"asset_quantity" | "quote_amount">("asset_quantity");
  const [size, setSize] = useState("");
  const [limitPrice, setLimitPrice] = useState("");

  const loadPrices = useCallback(async (symbols: string[]) => {
    if (!symbols.length) return;
    try {
      const p = await rh<Page<RhPrice>>(`prices?symbols=${symbols.join(",")}`);
      setPrices((prev) => ({ ...prev, ...Object.fromEntries(p.results.map((r) => [r.symbol, r])) }));
    } catch {}
  }, []);

  const loadAll = useCallback(async () => {
    try {
      const s = await rh<{ connected: boolean }>("status");
      setConnected(s.connected);
      if (!s.connected) return;
    } catch (e: any) {
      if (/allowed/.test(e.message)) setForbidden(true);
      else setMsg({ text: e.message, kind: "error" });
      return;
    }
    try {
      const [a, h, o] = await Promise.all([
        rh<RhAccount>("account"),
        rh<Page<RhHolding>>("holdings"),
        rh<Page<RhOrder>>("orders"),
      ]);
      setAccount(a);
      setHoldings(h.results.filter((x) => Number(x.total_quantity) > 0));
      setOrders(o.results);
      await loadPrices(Array.from(new Set(["BTC-USD", "ETH-USD", ...h.results.map((x) => `${x.asset_code}-USD`)])));
    } catch (e: any) {
      setMsg({ text: e.message, kind: "error" });
    }
  }, [loadPrices]);

  useEffect(() => {
    if (status === "authenticated") loadAll();
  }, [status, loadAll]);

  useEffect(() => {
    if (connected && /^[A-Z0-9]{1,15}-USD$/.test(symbol)) loadPrices([symbol]);
  }, [connected, symbol, loadPrices]);

  const effectiveSizeBy = type === "market" ? "asset_quantity" : sizeBy;
  const quote = prices[symbol];
  const refPrice = type === "limit" ? Number(limitPrice) : Number(side === "buy" ? quote?.ask_inclusive_of_buy_spread : quote?.bid_inclusive_of_sell_spread);
  const estimate = effectiveSizeBy === "asset_quantity" ? Number(size) * refPrice : Number(size) / refPrice;

  const placeOrder = async () => {
    const summary =
      effectiveSizeBy === "asset_quantity"
        ? `${side.toUpperCase()} ${size} ${symbol.replace("-USD", "")}`
        : `${side.toUpperCase()} ${fmt(size)} of ${symbol.replace("-USD", "")}`;
    const where = type === "limit" ? ` at a limit of ${fmt(limitPrice)}` : " at market price";
    if (!confirm(`${summary}${where}?\n\nThis is a real order on your Robinhood account.`)) return;

    setBusy(true);
    setMsg(null);
    try {
      const o = await rh<RhOrder>("orders", {
        symbol,
        side,
        type,
        [effectiveSizeBy]: size,
        ...(type === "limit" ? { limit_price: limitPrice } : {}),
      });
      setMsg({ text: `Order placed: ${o.side} ${o.symbol} (${o.state})`, kind: "ok" });
      setSize("");
      await loadAll();
    } catch (e: any) {
      setMsg({ text: e.message, kind: "error" });
    } finally {
      setBusy(false);
    }
  };

  const cancelOrder = async (id: string) => {
    if (!confirm("Cancel this order?")) return;
    setBusy(true);
    try {
      await rh(`orders/${id}/cancel`, {});
      setMsg({ text: "Cancel request sent", kind: "ok" });
      await loadAll();
    } catch (e: any) {
      setMsg({ text: e.message, kind: "error" });
    } finally {
      setBusy(false);
    }
  };

  if (status === "loading") return <AppShell><div className="p-8 text-center text-gray-400">Loading…</div></AppShell>;
  if (status !== "authenticated") return <AppShell><div className="max-w-5xl mx-auto px-4 py-8"><SignInCard what="crypto trading" /></div></AppShell>;
  if (forbidden) {
    return (
      <AppShell>
        <div className="max-w-5xl mx-auto px-4 py-8 text-sm text-gray-400">Crypto trading isn&apos;t available for this account.</div>
      </AppShell>
    );
  }

  const holdingsValue = holdings.reduce((sum, h) => sum + Number(h.total_quantity) * Number(prices[`${h.asset_code}-USD`]?.price ?? 0), 0);
  const openOrders = orders.filter((o) => o.state === "open" || o.state === "partially_filled");

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">₿ Crypto Trading</h1>
          <p className="text-sm text-gray-400 mt-1">Robinhood Crypto · real-money orders</p>
          {connected === false && (
            <span className="inline-block mt-1 text-xs bg-red-900/40 text-red-400 border border-red-800 px-2 py-0.5 rounded">
              Robinhood not connected — add API keys on Vercel
            </span>
          )}
          {connected === true && account && (
            <span className="inline-block mt-1 text-xs bg-green-900/40 text-green-400 border border-green-800 px-2 py-0.5 rounded">
              ✓ Robinhood account {account.status}
            </span>
          )}
        </div>

        {msg && (
          <div className={`text-sm px-4 py-2 rounded border ${msg.kind === "ok" ? "bg-green-900/30 border-green-700/50 text-green-300" : "bg-red-900/30 border-red-700/50 text-red-300"}`}>
            {msg.text}
          </div>
        )}

        {/* Account Stats */}
        {account && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: "Buying Power", value: fmt(account.buying_power) },
              { label: "Crypto Value", value: fmt(holdingsValue) },
              { label: "Open Orders", value: String(openOrders.length) },
            ].map((s) => (
              <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <p className="text-xs text-gray-400">{s.label}</p>
                <p className="text-lg font-semibold mt-1 text-white">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {connected && (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            {/* Holdings */}
            <div className="space-y-6">
              <section className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                <h2 className="px-4 py-3 text-sm font-semibold text-white border-b border-gray-800">Holdings</h2>
                {holdings.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-gray-500">No crypto held.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-xs text-gray-400">
                        <tr>
                          <th className="text-left px-4 py-2">Coin</th>
                          <th className="text-right px-4 py-2">Quantity</th>
                          <th className="text-right px-4 py-2">Price</th>
                          <th className="text-right px-4 py-2">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {holdings.map((h) => {
                          const p = prices[`${h.asset_code}-USD`]?.price;
                          return (
                            <tr key={h.asset_code} className="border-t border-gray-800 text-gray-200">
                              <td className="px-4 py-2 font-medium">
                                <button className="hover:text-blue-400" onClick={() => setSymbol(`${h.asset_code}-USD`)}>{h.asset_code}</button>
                              </td>
                              <td className="px-4 py-2 text-right">{qty(h.total_quantity)}</td>
                              <td className="px-4 py-2 text-right">{p ? fmt(p) : "—"}</td>
                              <td className="px-4 py-2 text-right">{p ? fmt(Number(h.total_quantity) * Number(p)) : "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* Orders */}
              <section className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
                <h2 className="px-4 py-3 text-sm font-semibold text-white border-b border-gray-800">Recent Orders</h2>
                {orders.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-gray-500">No orders yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-xs text-gray-400">
                        <tr>
                          <th className="text-left px-4 py-2">Date</th>
                          <th className="text-left px-4 py-2">Order</th>
                          <th className="text-right px-4 py-2">Filled</th>
                          <th className="text-right px-4 py-2">Avg Price</th>
                          <th className="text-right px-4 py-2">State</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((o) => (
                          <tr key={o.id} className="border-t border-gray-800 text-gray-200">
                            <td className="px-4 py-2 text-gray-400 whitespace-nowrap">{new Date(o.created_at).toLocaleString()}</td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <span className={o.side === "buy" ? "text-green-400" : "text-red-400"}>{o.side.toUpperCase()}</span> {o.symbol} · {o.type}
                            </td>
                            <td className="px-4 py-2 text-right">{qty(o.filled_asset_quantity)}</td>
                            <td className="px-4 py-2 text-right">{o.average_price ? fmt(o.average_price) : "—"}</td>
                            <td className="px-4 py-2 text-right whitespace-nowrap">
                              {o.state}
                              {(o.state === "open" || o.state === "partially_filled") && (
                                <button onClick={() => cancelOrder(o.id)} disabled={busy} className="ml-2 text-xs text-red-400 hover:text-red-300 disabled:opacity-40">
                                  Cancel
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>

            {/* Order ticket */}
            <section className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-3 h-fit">
              <h2 className="text-sm font-semibold text-white">Place Order</h2>

              <label className="block text-xs text-gray-400">
                Symbol
                <input
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  placeholder="BTC-USD"
                  className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white"
                />
              </label>
              {quote && (
                <p className="text-xs text-gray-400">
                  Bid {fmt(quote.bid_inclusive_of_sell_spread)} · Ask {fmt(quote.ask_inclusive_of_buy_spread)}
                </p>
              )}

              <div className="grid grid-cols-2 gap-2">
                {(["buy", "sell"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSide(s)}
                    className={`text-sm py-2 rounded border ${side === s ? (s === "buy" ? "bg-green-700 border-green-600 text-white" : "bg-red-800 border-red-700 text-white") : "bg-gray-800 border-gray-700 text-gray-400"}`}
                  >
                    {s === "buy" ? "Buy" : "Sell"}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {(["market", "limit"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`text-sm py-2 rounded border ${type === t ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-800 border-gray-700 text-gray-400"}`}
                  >
                    {t === "market" ? "Market" : "Limit"}
                  </button>
                ))}
              </div>

              {type === "limit" && (
                <>
                  <label className="block text-xs text-gray-400">
                    Limit price (USD)
                    <input
                      value={limitPrice}
                      onChange={(e) => setLimitPrice(e.target.value)}
                      inputMode="decimal"
                      className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white"
                    />
                  </label>
                  <select
                    value={sizeBy}
                    onChange={(e) => setSizeBy(e.target.value as typeof sizeBy)}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white"
                  >
                    <option value="asset_quantity">Size in coins</option>
                    <option value="quote_amount">Size in USD</option>
                  </select>
                </>
              )}

              <label className="block text-xs text-gray-400">
                {effectiveSizeBy === "asset_quantity" ? `Quantity (${symbol.replace("-USD", "") || "coins"})` : "Amount (USD)"}
                <input
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  inputMode="decimal"
                  className="mt-1 w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white"
                />
              </label>

              {Number(size) > 0 && Number.isFinite(estimate) && estimate > 0 && (
                <p className="text-xs text-gray-400">
                  ≈ {effectiveSizeBy === "asset_quantity" ? fmt(estimate) : `${qty(estimate)} ${symbol.replace("-USD", "")}`}
                </p>
              )}

              <button
                onClick={placeOrder}
                disabled={busy || !size || (type === "limit" && !limitPrice)}
                className="w-full text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white py-2 rounded font-medium transition"
              >
                {busy ? "Working…" : "Review & Place Order"}
              </button>
              <p className="text-[11px] leading-snug text-gray-500">
                Orders go straight to your Robinhood Crypto account. Prices include Robinhood&apos;s spread.
              </p>
            </section>
          </div>
        )}
      </div>
    </AppShell>
  );
}
