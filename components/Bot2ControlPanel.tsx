"use client";

import { useState } from "react";
import { api } from "@/lib/appApi";

interface Props {
  userId: string | null;
  dark: boolean;
}

type BotResult = { symbol: string; signal: string; action: string };

export default function Bot2ControlPanel({ userId, dark }: Props) {
  const [watchlist, setWatchlist] = useState("AAPL,MSFT,NVDA,TSLA,AMZN");
  const [dryRun, setDryRun] = useState(false);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<BotResult[] | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const card = dark
    ? "bg-[#161b22] border border-[#30363d] rounded-2xl shadow"
    : "bg-white border border-gray-200 rounded-2xl shadow";

  const muted = dark ? "text-gray-400" : "text-gray-500";
  const inputCls = dark
    ? "bg-[#0d1117] border-[#30363d] text-gray-100 placeholder-gray-600 focus:border-blue-500"
    : "bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500";

  async function runBot() {
    if (!userId) { setMsg("Not signed in."); setIsError(true); return; }
    setBusy(true);
    setMsg(null);
    setResults(null);
    try {
      const symbols = watchlist.split(",").map((s) => s.trim()).filter(Boolean);
      const data = await api("paper/bot/run", {
        method: "POST",
        body: { user_id: userId, symbols, dry_run: dryRun },
      });
      setResults(data.results ?? []);
      setMsg(`Bot run complete — ${data.results?.length ?? 0} signal(s) processed.`);
      setIsError(false);
    } catch (e: any) {
      setMsg(e.message);
      setIsError(true);
    } finally {
      setBusy(false);
    }
  }

  const signalBadge = (signal: string) => {
    const base = "text-xs font-semibold px-2 py-0.5 rounded-full";
    if (signal === "BUY") return `${base} bg-emerald-500/20 text-emerald-400`;
    if (signal === "SELL") return `${base} bg-red-500/20 text-red-400`;
    return `${base} ${dark ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-600"}`;
  };

  const actionBadge = (action: string) => {
    const base = "text-xs font-medium px-2 py-0.5 rounded-full";
    if (action.startsWith("opened")) return `${base} bg-blue-500/20 text-blue-400`;
    if (action.startsWith("closed") || action.startsWith("sold"))
      return `${base} bg-orange-500/20 text-orange-400`;
    return `${base} ${dark ? "bg-gray-700 text-gray-400" : "bg-gray-200 text-gray-500"}`;
  };

  return (
    <div className={card}>
      <div className="px-6 pt-5 pb-4 border-b border-inherit">
        <h2 className="font-semibold text-lg tracking-tight">Bot 1 — AI Signal Engine</h2>
        <p className={`text-sm mt-0.5 ${muted}`}>
          Runs AI analysis on your watchlist and opens / closes paper positions automatically.
        </p>
      </div>

      <div className="px-6 py-5 space-y-4">
        {/* Watchlist input */}
        <div>
          <label className={`block text-xs font-medium uppercase tracking-wider mb-1.5 ${muted}`}>
            Watchlist (comma-separated)
          </label>
          <input
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${inputCls}`}
            value={watchlist}
            onChange={(e) => setWatchlist(e.target.value)}
            placeholder="AAPL,MSFT,NVDA,TSLA"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              onClick={() => setDryRun((v) => !v)}
              className={`w-9 h-5 rounded-full transition-colors relative ${
                dryRun ? "bg-blue-500" : dark ? "bg-gray-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  dryRun ? "translate-x-4" : ""
                }`}
              />
            </div>
            <span className={`text-sm ${muted}`}>Dry run (no trades)</span>
          </label>

          <button
            onClick={runBot}
            disabled={busy}
            className="ml-auto px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
          >
            {busy ? "Running…" : "▶ Run Bot"}
          </button>
        </div>

        {/* Status message */}
        {msg && (
          <p className={`text-sm ${isError ? "text-red-400" : dark ? "text-emerald-400" : "text-emerald-600"}`}>
            {msg}
          </p>
        )}

        {/* Results table */}
        {results && results.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-inherit mt-2">
            <table className="w-full text-sm">
              <thead>
                <tr className={dark ? "bg-[#0d1117] text-gray-400" : "bg-gray-50 text-gray-500"}>
                  <th className="px-4 py-2.5 text-left font-medium">Symbol</th>
                  <th className="px-4 py-2.5 text-left font-medium">Signal</th>
                  <th className="px-4 py-2.5 text-left font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-inherit">
                {results.map((r, i) => (
                  <tr key={i} className={dark ? "hover:bg-[#1c2128]" : "hover:bg-gray-50"}>
                    <td className="px-4 py-2.5 font-mono font-semibold">{r.symbol}</td>
                    <td className="px-4 py-2.5">
                      <span className={signalBadge(r.signal)}>{r.signal}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={actionBadge(r.action)}>{r.action}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {results && results.length === 0 && (
          <p className={`text-sm ${muted}`}>No signals generated for this watchlist.</p>
        )}
      </div>
    </div>
  );
}
