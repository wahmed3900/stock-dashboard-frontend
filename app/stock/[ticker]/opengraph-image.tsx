// The preview image shown when a ticker page is shared on X, Reddit, Discord, LinkedIn or iMessage.
import { ImageResponse } from "next/og";
import { getStock } from "@/lib/fetchStock";
import { fmtPrice } from "@/lib/symbols";
import { resolveSlug } from "@/lib/tickers";

export const revalidate = 21600;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "StockAI technical analysis";

export default async function OgImage({ params }: { params: Promise<{ ticker: string }> }) {
  const r = resolveSlug((await params).ticker);
  const t = r.kind === "page" ? r.ticker : null;
  const v = t ? await getStock(t.symbol).catch(() => null) : null;
  const up = (v?.change ?? 0) >= 0;
  const rsiNote =
    v?.rsi == null ? null : v.rsi >= 70 ? "overbought" : v.rsi <= 30 ? "oversold" : "neutral range";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between",
        background: "#09090b", color: "#f4f4f5", padding: "64px 72px", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", fontSize: 34, fontWeight: 700 }}>StockAI</div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 40, color: "#a1a1aa" }}>{t ? (t.name === t.label ? t.label : t.name) : "AI technical analysis"}</div>
          <div style={{ display: "flex", alignItems: "baseline", marginTop: 8 }}>
            <div style={{ fontSize: 120, fontWeight: 800, letterSpacing: -4 }}>{t?.label ?? "Any market"}</div>
            {v?.change != null && (
              <div style={{ fontSize: 56, fontWeight: 700, marginLeft: 32, color: up ? "#10b981" : "#f43f5e" }}>
                {up ? "▲ +" : "▼ "}{Math.abs(v.change).toFixed(2)}%
              </div>
            )}
          </div>
          {v && (
            <div style={{ display: "flex", fontSize: 40, marginTop: 12, color: "#e4e4e7" }}>
              {fmtPrice(v.price, v.symbol)}
              {v.rsi != null ? `   RSI ${v.rsi.toFixed(1)}, ${rsiNote}` : ""}
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: "#71717a" }}>
          <span>RSI, MACD and Bollinger Bands in plain English</span>
          <span>Not financial advice</span>
        </div>
      </div>
    ),
    size
  );
}
