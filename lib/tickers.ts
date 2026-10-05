// Tickers that get a public, indexable page at /stock/<slug> and a spot in the sitemap.
// Add rows freely: [slug, Yahoo symbol, short label, full name].
import { resolveSymbol } from "@/lib/symbols";

export type AssetClass = "Stocks" | "ETFs" | "Indices" | "Forex" | "Crypto" | "Commodities" | "Bonds";
export type Ticker = { slug: string; symbol: string; label: string; name: string; cls: AssetClass };

const rows: Record<AssetClass, [string, string, string, string][]> = {
  Stocks: [
    ["aapl", "AAPL", "AAPL", "Apple"], ["msft", "MSFT", "MSFT", "Microsoft"], ["nvda", "NVDA", "NVDA", "Nvidia"],
    ["amzn", "AMZN", "AMZN", "Amazon"], ["googl", "GOOGL", "GOOGL", "Alphabet"], ["meta", "META", "META", "Meta Platforms"],
    ["tsla", "TSLA", "TSLA", "Tesla"], ["avgo", "AVGO", "AVGO", "Broadcom"], ["amd", "AMD", "AMD", "AMD"],
    ["nflx", "NFLX", "NFLX", "Netflix"], ["pltr", "PLTR", "PLTR", "Palantir"], ["intc", "INTC", "INTC", "Intel"],
    ["jpm", "JPM", "JPM", "JPMorgan Chase"], ["v", "V", "V", "Visa"], ["ma", "MA", "MA", "Mastercard"],
    ["wmt", "WMT", "WMT", "Walmart"], ["cost", "COST", "COST", "Costco"], ["ko", "KO", "KO", "Coca-Cola"],
    ["dis", "DIS", "DIS", "Disney"], ["ba", "BA", "BA", "Boeing"], ["xom", "XOM", "XOM", "Exxon Mobil"],
    ["lly", "LLY", "LLY", "Eli Lilly"], ["unh", "UNH", "UNH", "UnitedHealth"], ["crm", "CRM", "CRM", "Salesforce"],
    ["orcl", "ORCL", "ORCL", "Oracle"], ["uber", "UBER", "UBER", "Uber"], ["shop", "SHOP", "SHOP", "Shopify"],
    ["coin", "COIN", "COIN", "Coinbase"], ["mstr", "MSTR", "MSTR", "MicroStrategy"], ["sofi", "SOFI", "SOFI", "SoFi"],
    ["hood", "HOOD", "HOOD", "Robinhood"], ["smci", "SMCI", "SMCI", "Super Micro Computer"], ["mu", "MU", "MU", "Micron"],
    ["arm", "ARM", "ARM", "Arm Holdings"], ["gme", "GME", "GME", "GameStop"], ["amc", "AMC", "AMC", "AMC Entertainment"],
  ],
  ETFs: [
    ["spy", "SPY", "SPY", "SPDR S&P 500 ETF"], ["qqq", "QQQ", "QQQ", "Invesco QQQ"], ["voo", "VOO", "VOO", "Vanguard S&P 500 ETF"],
    ["iwm", "IWM", "IWM", "iShares Russell 2000 ETF"], ["dia", "DIA", "DIA", "SPDR Dow Jones ETF"], ["vti", "VTI", "VTI", "Vanguard Total Stock Market ETF"],
    ["tqqq", "TQQQ", "TQQQ", "ProShares UltraPro QQQ"], ["soxl", "SOXL", "SOXL", "Direxion Semiconductor Bull 3X"],
    ["arkk", "ARKK", "ARKK", "ARK Innovation ETF"], ["schd", "SCHD", "SCHD", "Schwab US Dividend Equity ETF"],
  ],
  Indices: [
    ["sp500", "^GSPC", "S&P 500", "S&P 500 Index"], ["nasdaq", "^IXIC", "Nasdaq", "Nasdaq Composite"],
    ["dow-jones", "^DJI", "Dow", "Dow Jones Industrial Average"], ["russell-2000", "^RUT", "Russell 2000", "Russell 2000 Index"],
    ["vix", "^VIX", "VIX", "CBOE Volatility Index"],
  ],
  Forex: [
    ["eur-usd", "EURUSD=X", "EUR/USD", "Euro to US Dollar"], ["gbp-usd", "GBPUSD=X", "GBP/USD", "British Pound to US Dollar"],
    ["usd-jpy", "JPY=X", "USD/JPY", "US Dollar to Japanese Yen"], ["aud-usd", "AUDUSD=X", "AUD/USD", "Australian Dollar to US Dollar"],
    ["usd-cad", "CAD=X", "USD/CAD", "US Dollar to Canadian Dollar"], ["usd-chf", "CHF=X", "USD/CHF", "US Dollar to Swiss Franc"],
    ["usd-inr", "INR=X", "USD/INR", "US Dollar to Indian Rupee"], ["dxy", "DX-Y.NYB", "DXY", "US Dollar Index"],
  ],
  Crypto: [
    ["bitcoin", "BTC-USD", "BTC", "Bitcoin"], ["ethereum", "ETH-USD", "ETH", "Ethereum"], ["solana", "SOL-USD", "SOL", "Solana"],
    ["xrp", "XRP-USD", "XRP", "XRP"], ["dogecoin", "DOGE-USD", "DOGE", "Dogecoin"], ["cardano", "ADA-USD", "ADA", "Cardano"],
    ["bnb", "BNB-USD", "BNB", "BNB"], ["chainlink", "LINK-USD", "LINK", "Chainlink"],
  ],
  Commodities: [
    ["gold", "GC=F", "Gold", "Gold futures"], ["silver", "SI=F", "Silver", "Silver futures"],
    ["crude-oil", "CL=F", "Crude oil", "WTI crude oil futures"], ["natural-gas", "NG=F", "Natural gas", "Natural gas futures"],
    ["copper", "HG=F", "Copper", "Copper futures"],
  ],
  Bonds: [
    ["10-year-treasury", "^TNX", "10Y yield", "US 10-year Treasury yield"],
    ["30-year-treasury", "^TYX", "30Y yield", "US 30-year Treasury yield"],
    ["5-year-treasury", "^FVX", "5Y yield", "US 5-year Treasury yield"],
  ],
};

export const ASSET_ORDER = Object.keys(rows) as AssetClass[];

export const TICKERS: Ticker[] = ASSET_ORDER.flatMap((cls) =>
  rows[cls].map(([slug, symbol, label, name]) => ({ slug, symbol, label, name, cls }))
);

const bySlug = new Map(TICKERS.map((t) => [t.slug, t]));
const bySymbol = new Map(TICKERS.map((t) => [t.symbol, t]));

// The word that fits each asset class in page titles, e.g. "Bitcoin (BTC) crypto analysis"
export const CLASS_NOUN: Record<AssetClass, string> = {
  Stocks: "stock", ETFs: "ETF", Indices: "index", Forex: "forex",
  Crypto: "crypto", Commodities: "price", Bonds: "yield",
};

export const slugFor = (symbol: string) => bySymbol.get(symbol)?.slug ?? symbol.toLowerCase();

export type Resolved =
  | { kind: "page"; ticker: Ticker; listed: boolean }
  | { kind: "redirect"; slug: string }
  | { kind: "invalid" };

// Turn a URL slug into a ticker. Known aliases (btc, aapl in caps, tsla...) redirect
// to one canonical URL so Google doesn't see duplicate pages.
export function resolveSlug(raw: string): Resolved {
  const slug = decodeURIComponent(raw);
  const listed = bySlug.get(slug);
  if (listed) return { kind: "page", ticker: listed, listed: true };

  const viaAlias = bySymbol.get(resolveSymbol(slug));
  if (viaAlias) return { kind: "redirect", slug: viaAlias.slug };

  // Any other plain ticker (e.g. /stock/pypl or /stock/shop.to) still gets a page on demand
  if (!/^[a-z0-9][a-z0-9.\-]{0,11}$/i.test(slug)) return { kind: "invalid" };
  if (slug !== slug.toLowerCase()) return { kind: "redirect", slug: slug.toLowerCase() };
  const symbol = slug.toUpperCase();
  return { kind: "page", ticker: { slug, symbol, label: symbol, name: symbol, cls: "Stocks" }, listed: false };
}
