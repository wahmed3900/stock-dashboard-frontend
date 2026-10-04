"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/appApi";

type Portfolio = {
  cash: number;
  market_value: number;
  total_equity: number;
  total_pnl?: number;
};

interface Props {
  userId: string | null;
  dark: boolean;
  onToggle: () => void;
}

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

const kpiColor = (n: number, dark: boolean) =>
  n >= 0
    ? dark ? "text-emerald-400" : "text-emerald-600"
    : dark ? "text-red-400" : "text-red-600";

export default function PortfolioSummary({ userId, dark, onToggle }: Props) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [error, setError] = useState<string | null>(null);

  const card = dark
    ? "bg-[#161b22] border border-[#30363d] rounded-2xl shadow"
    : "bg-white border border-gray-200 rounded-2xl shadow";

  const muted = dark ? "text-gray-400" : "text-gray-500";

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await api(`paper/portfolio/${userId}`);
      setPortfolio(data);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const kpis = portfolio
    ? [
        { label: "Cash", value: fmt(portfolio.cash) },
        { label: "Market Value", value: fmt(portfolio.market_value) },
        { label: "Total Equity", value: fmt(portfolio.total_equity) },
        {
          label: "Total P&L",
          value: portfolio.total_pnl !== undefined ? fmt(portfolio.total_pnl) : "—",
          colored: portfolio.total_pnl,
        },
      ]
    : [];

  return (
    <div className={card}>
      <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-inherit">
        <h2 className="font-semibold text-lg tracking-tight">Portfolio Overview</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={load}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              dark
                ? "border-[#30363d] text-gray-400 hover:text-gray-200 hover:border-gray-500"
                : "border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-400"
            }`}
          >
            Refresh
          </button>
          <button
            onClick={onToggle}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              dark
                ? "border-[#30363d] text-gray-400 hover:text-gray-200"
                : "border-gray-300 text-gray-500 hover:text-gray-700"
            }`}
          >
            {dark ? "☀ Light" : "🌙 Dark"}
          </button>
        </div>
      </div>

      <div className="px-6 py-5">
        {error && (
          <p className="text-red-500 text-sm mb-4">{error}</p>
        )}
        {!portfolio && !error && (
          <p className={`text-sm ${muted}`}>Loading…</p>
        )}
        {portfolio && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {kpis.map(({ label, value, colored }) => (
              <div key={label} className={`${dark ? "bg-[#0d1117]" : "bg-gray-50"} rounded-xl p-4`}>
                <p className={`text-xs font-medium uppercase tracking-wider ${muted}`}>{label}</p>
                <p
                  className={`mt-1 text-xl font-bold ${
                    colored !== undefined ? kpiColor(colored, dark) : ""
                  }`}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
