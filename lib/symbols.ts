// Plain words people type -> the Yahoo Finance symbol for that asset
export const ALIASES: Record<string, string> = {
  EUR: "EURUSD=X", GBP: "GBPUSD=X", JPY: "JPY=X", CAD: "CAD=X", AUD: "AUDUSD=X",
  CHF: "CHF=X", INR: "INR=X", CNY: "CNY=X", MXN: "MXN=X",
  USD: "DX-Y.NYB", DXY: "DX-Y.NYB",
  BTC: "BTC-USD", BITCOIN: "BTC-USD", ETH: "ETH-USD", ETHEREUM: "ETH-USD",
  SOL: "SOL-USD", SOLANA: "SOL-USD", XRP: "XRP-USD", DOGE: "DOGE-USD",
  XAU: "GC=F", GOLD: "GC=F", SILVER: "SI=F", CRUDE: "CL=F", OIL: "CL=F", NATGAS: "NG=F",
  SP500: "^GSPC", SPX: "^GSPC", NASDAQ: "^IXIC", DOWJONES: "^DJI", DOW: "^DJI", TSX: "^GSPTSE", VIX: "^VIX",
  "10Y": "^TNX", "30Y": "^TYX", "5Y": "^FVX",
};

export const resolveSymbol = (s: string) => {
  const up = s.trim().toUpperCase();
  return ALIASES[up] ?? up;
};

const YIELDS = ["^TNX", "^TYX", "^FVX", "^IRX"];

// Format a price the way that asset is quoted
export function fmtPrice(n: number | null | undefined, sym: string): string {
  if (n == null) return "—";
  if (YIELDS.includes(sym)) return `${n.toFixed(2)}%`;
  if (sym.endsWith("=X")) return n.toFixed(4);
  if (sym.startsWith("^")) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (n < 1) return `$${n.toFixed(4)}`;
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
