"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { api } from "@/lib/appApi";

interface Props {
  userId: string | null;
  dark: boolean;
}

type Trade = {
  _id: string;
  symbol: string;
  qty: number;
  entry_price: number;
  exit_price: number;
  pnl: number;
  closed_at: string;
  source?: string;
};

type SortKey = "closed_at" | "symbol" | "pnl";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 15;

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

function downloadCsv(trades: Trade[]) {
  const header = "Date,Symbol,Qty,Entry,Exit,P&L\n";
  const rows = trades
    .map((t) =>
      [
        new Date(t.closed_at).toLocaleDateString(),
        t.symbol,
        t.qty,
        t.entry_price.toFixed(2),
        t.exit_price.toFixed(2),
        t.pnl.toFixed(2),
      ].join(",")
    )
    .join("\n");
  const blob = new Blob([header + rows], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `trade-history-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function TradeHistory({ userId, dark }: Props) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("closed_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");

  const card = dark
    ? "bg-[#161b22] border border-[#30363d] rounded-2xl shadow"
    : "bg-white border border-gray-200 rounded-2xl shadow";

  const muted = dark ? "text-gray-400" : "text-gray-500";

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await api(`paper/trades/${userId}`);
      setTrades(Array.isArray(data) ? data : data.trades ?? []);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const sorted = useMemo(() => {
    const filtered = filter
      ? trades.filter((t) => t.symbol.toLowerCase().includes(filter.toLowerCase()))
      : trades;
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "closed_at") cmp = new Date(a.closed_at).getTime() - new Date(b.closed_at).getTime();
      else if (sortKey === "symbol") cmp = a.symbol.localeCompare(b.symbol);
      else if (sortKey === "pnl") cmp = a.pnl - b.pnl;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [trades, sortKey, sortDir, filter]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageSlice = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
    setPage(1);
  }

  const thCls = (key: SortKey) =>
    `px-4 py-2.5 text-left font-medium cursor-pointer select-none whitespace-nowrap hover:opacity-80 ${
      sortKey === key ? (dark ? "text-blue-400" : "text-blue-600") : ""
    }`;

  const arrow = (key: SortKey) =>
    sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  const pnlColor = (n: number) =>
    n >= 0
      ? dark ? "text-emerald-400" : "text-emerald-600"
      : dark ? "text-red-400" : "text-red-600";

  return (
    <div className={card}>
      <div className="flex items-center justify-between flex-wrap gap-3 px-6 pt-5 pb-4 border-b border-inherit">
        <div>
          <h2 className="font-semibold text-lg tracking-tight">Trade History</h2>
          <p className={`text-xs mt-0.5 ${muted}`}>{trades.length} closed trade{trades.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            className={`text-sm rounded-lg border px-3 py-1.5 outline-none transition-colors w-32 ${
              dark
                ? "bg-[#0d1117] border-[#30363d] text-gray-100 placeholder-gray-600 focus:border-blue-500"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500"
            }`}
            placeholder="Filter symbol"
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setPage(1); }}
          />
          <button
            onClick={() => downloadCsv(sorted)}
            disabled={sorted.length === 0}
            className="text-xs px-3 py-1.5 rounded-lg border border-blue-500/50 text-blue-400 hover:border-blue-400 disabled:opacity-40 transition-colors"
          >
            ↓ CSV
          </button>
          <button
            onClick={load}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              dark
                ? "border-[#30363d] text-gray-400 hover:text-gray-200"
                : "border-gray-300 text-gray-500 hover:text-gray-700"
            }`}
          >
            ↺ Refresh
          </button>
        </div>
      </div>

      <div className="px-6 py-5">
        {loading && <p className={`text-sm ${muted}`}>Loading trade history…</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}
        {!loading && !error && trades.length === 0 && (
          <p className={`text-sm ${muted}`}>No closed trades yet.</p>
        )}

        {pageSlice.length > 0 && (
          <>
            <div className="overflow-x-auto rounded-xl border border-inherit">
              <table className="w-full text-sm">
                <thead>
                  <tr className={dark ? "bg-[#0d1117] text-gray-400" : "bg-gray-50 text-gray-500"}>
                    <th className={thCls("closed_at")} onClick={() => toggleSort("closed_at")}>
                      Date{arrow("closed_at")}
                    </th>
                    <th className={thCls("symbol")} onClick={() => toggleSort("symbol")}>
                      Symbol{arrow("symbol")}
                    </th>
                    <th className="px-4 py-2.5 text-left font-medium">Qty</th>
                    <th className="px-4 py-2.5 text-left font-medium">Entry</th>
                    <th className="px-4 py-2.5 text-left font-medium">Exit</th>
                    <th className={thCls("pnl")} onClick={() => toggleSort("pnl")}>
                      P&L{arrow("pnl")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-inherit">
                  {pageSlice.map((t) => (
                    <tr key={t._id} className={dark ? "hover:bg-[#1c2128]" : "hover:bg-gray-50"}>
                      <td className={`px-4 py-2.5 ${muted}`}>
                        {new Date(t.closed_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2.5 font-mono font-bold">{t.symbol}</td>
                      <td className="px-4 py-2.5">{t.qty}</td>
                      <td className="px-4 py-2.5">{fmt(t.entry_price)}</td>
                      <td className="px-4 py-2.5">{fmt(t.exit_price)}</td>
                      <td className={`px-4 py-2.5 font-semibold ${pnlColor(t.pnl)}`}>
                        {fmt(t.pnl)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={`flex items-center justify-between mt-4 text-sm ${muted}`}>
                <span>
                  Page {page} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className={`px-3 py-1 rounded-lg border disabled:opacity-40 transition-colors ${
                      dark ? "border-[#30363d] hover:text-gray-200" : "border-gray-300 hover:text-gray-700"
                    }`}
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className={`px-3 py-1 rounded-lg border disabled:opacity-40 transition-colors ${
                      dark ? "border-[#30363d] hover:text-gray-200" : "border-gray-300 hover:text-gray-700"
                    }`}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
