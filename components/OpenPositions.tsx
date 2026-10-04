"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/appApi";

interface Props {
  userId: string | null;
  dark: boolean;
}

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

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

export default function OpenPositions({ userId, dark }: Props) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [closing, setClosing] = useState<string | null>(null);
  const [closeMsg, setCloseMsg] = useState<string | null>(null);

  const card = dark
    ? "bg-[#161b22] border border-[#30363d] rounded-2xl shadow"
    : "bg-white border border-gray-200 rounded-2xl shadow";

  const muted = dark ? "text-gray-400" : "text-gray-500";

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await api(`paper/positions/${userId}`);
      setPositions(Array.isArray(data) ? data : data.positions ?? []);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  async function closePosition(id: string, symbol: string) {
    setClosing(id);
    setCloseMsg(null);
    try {
      await api(`paper/positions/${id}/close`, { method: "POST", body: { user_id: userId } });
      setCloseMsg(`${symbol} position closed.`);
      await load();
    } catch (e: any) {
      setCloseMsg(`Error: ${e.message}`);
    } finally {
      setClosing(null);
    }
  }

  const pnlColor = (n?: number) => {
    if (n === undefined) return "";
    return n >= 0
      ? dark ? "text-emerald-400" : "text-emerald-600"
      : dark ? "text-red-400" : "text-red-600";
  };

  return (
    <div className={card}>
      <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-inherit">
        <div>
          <h2 className="font-semibold text-lg tracking-tight">Open Positions</h2>
          <p className={`text-xs mt-0.5 ${muted}`}>Live paper portfolio holdings</p>
        </div>
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

      <div className="px-6 py-5">
        {loading && <p className={`text-sm ${muted}`}>Loading positions…</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}
        {closeMsg && (
          <p className={`text-sm mb-3 ${closeMsg.startsWith("Error") ? "text-red-400" : dark ? "text-emerald-400" : "text-emerald-600"}`}>
            {closeMsg}
          </p>
        )}

        {!loading && !error && positions.length === 0 && (
          <p className={`text-sm ${muted}`}>No open positions.</p>
        )}

        {positions.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-inherit">
            <table className="w-full text-sm">
              <thead>
                <tr className={dark ? "bg-[#0d1117] text-gray-400" : "bg-gray-50 text-gray-500"}>
                  {["Symbol", "Qty", "Entry", "Current", "Mkt Value", "Unreal. P&L", "Source", ""].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-inherit">
                {positions.map((p) => (
                  <tr key={p._id} className={dark ? "hover:bg-[#1c2128]" : "hover:bg-gray-50"}>
                    <td className="px-4 py-2.5 font-mono font-bold">{p.symbol}</td>
                    <td className="px-4 py-2.5">{p.qty}</td>
                    <td className="px-4 py-2.5">{fmt(p.entry_price)}</td>
                    <td className="px-4 py-2.5">{p.current_price ? fmt(p.current_price) : <span className={muted}>—</span>}</td>
                    <td className="px-4 py-2.5">{p.market_value ? fmt(p.market_value) : <span className={muted}>—</span>}</td>
                    <td className={`px-4 py-2.5 font-semibold ${pnlColor(p.unrealized_pnl)}`}>
                      {p.unrealized_pnl !== undefined ? fmt(p.unrealized_pnl) : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${dark ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-600"}`}>
                        {p.source}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => closePosition(p._id, p.symbol)}
                        disabled={closing === p._id}
                        className="text-xs px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-50 transition-colors"
                      >
                        {closing === p._id ? "…" : "Close"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
