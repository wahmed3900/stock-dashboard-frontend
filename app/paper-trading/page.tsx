"use client";

import { useState, useEffect } from "react";
import PortfolioSummary  from "@/components/PortfolioSummary";
import Bot2ControlPanel  from "@/components/Bot2ControlPanel";
import OpenPositions     from "@/components/OpenPositions";
import TradeHistory      from "@/components/TradeHistory";
import { useAuth }       from "@/hooks/useAuth";
import AppShell, { SignInCard } from "@/components/AppShell";
import { useSession } from "next-auth/react";

export default function PaperTradingPage() {
  const { status } = useSession();
  const { user } = useAuth();
  const userId   = user?.uid ?? null;

  /* ── theme ── */
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("ptTheme");
    if (saved === "dark") setDark(true);
  }, []);

  const toggleDark = () =>
    setDark((d) => {
      const next = !d;
      localStorage.setItem("ptTheme", next ? "dark" : "light");
      return next;
    });

  /* ── auth guard ── */
  if (status === "unauthenticated") {
    return (
      <AppShell>
        <SignInCard what="paper trading" />
      </AppShell>
    );
  }

  /* ── page shell ── */
  const bg = dark
    ? "bg-[#0d1117] text-gray-100"
    : "bg-gray-100 text-gray-900";

  return (
    <AppShell>
      <div className={`min-h-screen transition-colors duration-300 ${bg}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

          {/* header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                StockAI — Paper Trading
              </h1>
              <p className={`text-sm mt-0.5 ${dark ? "text-gray-400" : "text-gray-500"}`}>
                AI-powered paper positions · Bot 1 signal engine
              </p>
            </div>
            <div className="w-8" />
          </div>

          {/* 1 · portfolio KPIs — hosts the dark/light toggle button */}
          <PortfolioSummary
            userId={userId}
            dark={dark}
            onToggle={toggleDark}
          />

          {/* 2 · Bot 1 control panel */}
          <Bot2ControlPanel
            userId={userId}
            dark={dark}
          />

          {/* 3 · open positions */}
          <OpenPositions
            userId={userId}
            dark={dark}
          />

          {/* 4 · full trade history — paginated, sortable, CSV export */}
          <TradeHistory
            userId={userId}
            dark={dark}
          />

        </div>
      </div>
    </AppShell>
  );
}
