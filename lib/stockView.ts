// Shared by the dashboard (app/page.tsx) and the public ticker pages (app/stock/[ticker]).
export type View = {
  symbol: string;
  price?: number;
  change?: number;
  source?: string;
  rsi?: number;
  macd?: number;
  macdHist?: number;
  upper?: number;
  lower?: number;
  insight?: string;
  aiLocked?: boolean;
};

// Accept numbers or numeric strings; return the first usable value.
export function num(...vals: unknown[]): number | undefined {
  for (const v of vals) {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "" && Number.isFinite(+v)) return +v;
  }
  return undefined;
}

// Map whatever the backend sends onto the fields the UI shows.
export function normalize(json: any, symbol: string): View {
  const root = json?.data ?? json?.quote ?? json?.result ?? json ?? {};
  const ti = root.metrics ?? root.technical_indicators ?? root.indicators ?? root.technicals ?? {};
  const macd = ti.macd ?? root.macd;
  const boll = ti.bollinger ?? ti.bollinger_bands ?? ti.bbands ?? root.bollinger ?? {};

  const history: any[] = Array.isArray(root.history) ? root.history : [];
  const closes = history.map((d) => num(d.Close, d.close)).filter((n): n is number => n != null);

  const price = num(ti.latest_close, root.current_price, root.price, root.close, root.last, closes[closes.length - 1]);
  const prev = closes.length >= 2 ? closes[closes.length - 2] : undefined;
  const computedChange = price != null && prev ? ((price - prev) / prev) * 100 : undefined;

  // MACD needs ~35 trading days; with less history the backend returns all zeros
  const macdObj = typeof macd === "object" && macd ? macd : null;
  const macdMissing =
    macdObj && [macdObj.macd, macdObj.line, macdObj.signal, macdObj.histogram].every((v) => !v);

  const summaries =
    root.summary && typeof root.summary === "object" ? Object.values(root.summary) : [root.summary];
  const insight = [root.ai_analysis, root.analysis, root.verdict, ...summaries].find(
    (s) => typeof s === "string" && s.trim() && s.trim().toLowerCase() !== "unavailable"
  ) as string | undefined;

  return {
    symbol: root.symbol ?? root.ticker ?? symbol,
    price,
    change: num(root.change_pct, root.change_percent, root.changePercent, root.pct_change, computedChange),
    source: root.source ?? root.provider,
    rsi: num(ti.rsi, ti.rsi_14, ti.RSI, root.rsi),
    macd: macdMissing ? undefined : num(macdObj ? macdObj.line ?? macdObj.macd : macd, ti.macd_line),
    macdHist: macdMissing ? undefined : num(macdObj?.histogram ?? macdObj?.hist, ti.macd_histogram),
    upper: num(boll.upper, boll.upper_band, ti.bb_upper, ti.upper_band, root.bb_upper),
    lower: num(boll.lower, boll.lower_band, ti.bb_lower, ti.lower_band, root.bb_lower),
    insight,
    aiLocked: !!root.ai_locked,
  };
}
