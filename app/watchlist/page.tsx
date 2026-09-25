"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import AppShell, { SignInCard, UpgradeCard } from "@/components/AppShell";
import { api, Me } from "@/lib/appApi";
import { fmtPrice, resolveSymbol } from "@/lib/symbols";

type Item = { symbol: string; price?: number | null; change_pct?: number | null };

export default function WatchlistPage() {
  const { status } = useSession();
  const [me, setMe] = useState<Me | null>(null);
  const [items, setItems] = useState<Item[] | null>(null);
  const [limit, setLimit] = useState(50);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await api<{ watchlist: Item[]; limit: number }>("watchlist?quotes=true");
      setItems(r.watchlist);
      setLimit(r.limit);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load your watchlist");
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    api<Me>("me")
      .then((m) => {
        setMe(m);
        if (m.is_premium) load();
      })
      .catch((e) => setError(e.message));
  }, [status, load]);

  // Refresh prices every minute while the page is open
  useEffect(() => {
    if (!me?.is_premium) return;
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [me, load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const sym = resolveSymbol(input);
    if (!sym) return;
    setBusy(true);
    setError(null);
    try {
      await api("watchlist", { method: "POST", body: { symbol: sym } });
      setInput("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't add it");
    } finally {
      setBusy(false);
    }
  }

  async function remove(sym: string) {
    setItems((cur) => cur?.filter((i) => i.symbol !== sym) ?? cur);
    try {
      await api(`watchlist/${encodeURIComponent(sym)}`, { method: "DELETE" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't remove it");
      load();
    }
  }

  return (
    <AppShell>
      <main className="flex-1 w-full max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Watchlist</h1>
          <p className="mt-1 text-sm text-[#71717a]">Your symbols with the latest price. Prices refresh every minute and may be delayed.</p>
        </div>

        {status === "loading" || (status === "authenticated" && !me && !error) ? (
          <p className="text-sm text-[#71717a]">Loading…</p>
        ) : status === "unauthenticated" ? (
          <SignInCard what="use your watchlist" />
        ) : me && !me.is_premium ? (
          <UpgradeCard feature="The watchlist" />
        ) : (
          <>
            <form onSubmit={add} className="flex flex-wrap gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Add a symbol: AAPL, BTC, EUR, GOLD…"
                aria-label="Symbol to add"
                className="min-w-0 flex-1 rounded-lg border border-[#27272a] bg-[#18181b] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
              <button
                disabled={busy || !input.trim()}
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200 disabled:opacity-50"
              >
                {busy ? "Adding…" : "Add"}
              </button>
            </form>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-300">{error}</div>
            )}

            {items === null ? (
              <p className="text-sm text-[#71717a]">Loading prices…</p>
            ) : items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#27272a] p-8 text-center text-sm text-[#71717a]">
                Nothing here yet. Add a symbol above, or use &ldquo;Add to watchlist&rdquo; on the dashboard.
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-[#1e1e24]">
                <table className="w-full text-sm">
                  <thead className="bg-[#111114] text-left text-xs text-[#71717a]">
                    <tr>
                      <th className="px-4 py-3 font-medium">Symbol</th>
                      <th className="px-4 py-3 text-right font-medium">Price</th>
                      <th className="px-4 py-3 text-right font-medium">Change</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((i) => {
                      const up = (i.change_pct ?? 0) >= 0;
                      return (
                        <tr key={i.symbol} className="border-t border-[#1e1e24]">
                          <td className="px-3 sm:px-4 py-3 font-medium text-white whitespace-nowrap">{i.symbol}</td>
                          <td className="px-3 sm:px-4 py-3 text-right tabular-nums">{fmtPrice(i.price, i.symbol)}</td>
                          <td className={`px-3 sm:px-4 py-3 text-right tabular-nums ${i.change_pct == null ? "text-[#71717a]" : up ? "text-emerald-400" : "text-rose-400"}`}>
                            {i.change_pct == null ? "—" : `${up ? "+" : ""}${i.change_pct.toFixed(2)}%`}
                          </td>
                          <td className="px-3 sm:px-4 py-3">
                            <div className="flex flex-col items-end gap-1.5 sm:flex-row sm:justify-end sm:gap-3 text-xs whitespace-nowrap">
                              <Link href={`/?symbol=${encodeURIComponent(i.symbol)}`} className="text-[#a1a1aa] hover:text-white">
                                Analyze
                              </Link>
                              <Link href={`/alerts?symbol=${encodeURIComponent(i.symbol)}`} className="text-[#a1a1aa] hover:text-white">
                                Alert
                              </Link>
                              <button onClick={() => remove(i.symbol)} className="text-[#a1a1aa] hover:text-rose-400" aria-label={`Remove ${i.symbol}`}>
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {items && <p className="text-xs text-[#52525b]">{items.length} of {limit} symbols</p>}
          </>
        )}
      </main>
    </AppShell>
  );
}
