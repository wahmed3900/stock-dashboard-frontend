// Public, indexable analysis page for one ticker: /stock/aapl, /stock/bitcoin, /stock/gold ...
// Rendered on the server so Google sees real content, then cached and rebuilt every few hours.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { getStock } from "@/lib/fetchStock";
import { explain } from "@/lib/explain";
import { fmtPrice } from "@/lib/symbols";
import { SITE_URL } from "@/lib/site";
import { CLASS_NOUN, TICKERS, resolveSlug, type Ticker } from "@/lib/tickers";

export const revalidate = 21600; // keep in sync with TICKER_REVALIDATE in lib/site.ts
export const dynamicParams = true;

// Pages build on first visit (then stay cached), so deploys don't hit the backend 70+ times.
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ ticker: string }> };

function load(raw: string): Ticker {
  const r = resolveSlug(raw);
  if (r.kind === "redirect") permanentRedirect(`/stock/${r.slug}`);
  if (r.kind === "invalid") notFound();
  return r.ticker;
}

const heading = (t: Ticker) =>
  t.name === t.label ? `${t.label} ${CLASS_NOUN[t.cls]} analysis` : `${t.name} (${t.label}) ${CLASS_NOUN[t.cls]} analysis`;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = load((await params).ticker);
  const v = await getStock(t.symbol).catch(() => null);
  const title = `${heading(t)} today: RSI, MACD and AI summary | StockAI`;
  const bits = v
    ? [
        `${t.label} at ${fmtPrice(v.price, v.symbol)}`,
        v.change != null ? `${v.change >= 0 ? "up" : "down"} ${Math.abs(v.change).toFixed(2)}%` : null,
        v.rsi != null ? `RSI ${v.rsi.toFixed(1)}` : null,
      ].filter(Boolean).join(", ") + ". "
    : "";
  const description = `${bits}Free ${t.name} technical analysis with RSI, MACD and Bollinger Bands explained in plain English. Not financial advice.`;
  const url = `/stock/${t.slug}`;

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: "StockAI", type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function TickerPage({ params }: Props) {
  const t = load((await params).ticker);
  const v = await getStock(t.symbol);
  if (!v) notFound();

  const up = (v.change ?? 0) >= 0;
  const reading = explain(v, t.label);
  const related = TICKERS.filter((x) => x.cls === t.cls && x.slug !== t.slug).slice(0, 8);
  const updated = new Date().toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC",
  });

  return (
    <AppShell>
      <header className="flex min-h-16 items-center px-4 sm:px-6 py-3 border-b border-[#1e1e24]">
        <nav aria-label="Breadcrumb" className="text-sm text-[#71717a]">
          <Link href="/stock" className="hover:text-white">Markets</Link>
          <span className="mx-2">/</span>
          <span>{t.cls}</span>
          <span className="mx-2">/</span>
          <span className="text-[#e4e4e7]">{t.label}</span>
        </nav>
      </header>

      <main className="flex-1 p-6 max-w-4xl w-full mx-auto space-y-8">
        <section className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{heading(t)}</h1>
          <p className="text-sm text-[#71717a]">
            Updated {updated} UTC. Market data may be delayed.
          </p>
          <div className="flex items-baseline gap-3 pt-2">
            <span className="text-4xl font-bold tracking-tight text-white tabular-nums">{fmtPrice(v.price, v.symbol)}</span>
            {v.change != null && (
              <span className={`text-base font-medium tabular-nums ${up ? "text-emerald-500" : "text-rose-500"}`}>
                {up ? "▲ +" : "▼ "}{Math.abs(v.change).toFixed(2)}%
              </span>
            )}
          </div>
        </section>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Metric label="RSI (14)" value={v.rsi != null ? v.rsi.toFixed(1) : "—"}
            tone={v.rsi == null ? "" : v.rsi >= 70 ? "text-rose-500" : v.rsi <= 30 ? "text-emerald-400" : ""} />
          <Metric label="MACD" value={v.macd != null ? v.macd.toFixed(Math.abs(v.macd) < 1 ? 4 : 2) : "Not enough data"}
            tone={v.macdHist == null ? "" : v.macdHist >= 0 ? "text-emerald-400" : "text-rose-500"} />
          <Metric label="Upper band" value={fmtPrice(v.upper, v.symbol)} />
          <Metric label="Lower band" value={fmtPrice(v.lower, v.symbol)} />
        </section>

        {reading.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">What the indicators say</h2>
            {reading.map((s) => (
              <p key={s} className="text-[15px] leading-relaxed text-[#d4d4d8] max-w-prose">{s}</p>
            ))}
          </section>
        )}

        {v.insight && !v.aiLocked && (
          <section className="rounded-xl bg-[#18181b] border border-[#27272a] p-5 text-sm leading-relaxed text-[#d4d4d8]">
            <h2 className="font-semibold text-white mb-2">AI summary</h2>
            <p>{v.insight}</p>
          </section>
        )}

        <section className="flex flex-wrap gap-3">
          <Link href={`/?symbol=${encodeURIComponent(t.symbol)}`}
            className="bg-white text-black text-sm font-medium px-4 py-2 rounded-lg hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-400">
            Open {t.label} in the live dashboard
          </Link>
          <Link href="/pricing"
            className="border border-[#27272a] text-sm text-[#e4e4e7] px-4 py-2 rounded-lg hover:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-400">
            Get AI summaries and alerts
          </Link>
        </section>

        {related.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white">More {t.cls.toLowerCase()} analysis</h2>
            <div className="flex flex-wrap gap-2">
              {related.map((r) => (
                <Link key={r.slug} href={`/stock/${r.slug}`}
                  className="rounded-full border border-[#27272a] px-3 py-1 text-xs text-[#a1a1aa] hover:border-zinc-500 hover:text-white">
                  {r.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        <p className="text-xs leading-relaxed text-[#71717a] border-t border-[#1e1e24] pt-6">
          StockAI is for educational and informational purposes only and is not investment, financial or trading
          advice. Indicator readings and AI summaries can be wrong. Do your own research and consider speaking
          with a licensed financial advisor before making investment decisions.
        </p>
      </main>
    </AppShell>
  );
}

function Metric({ label, value, tone = "" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="border border-[#1e1e24] p-4 rounded-xl">
      <p className="text-xs text-[#71717a] font-medium">{label}</p>
      <p className={`text-lg font-semibold mt-1 tabular-nums ${tone || "text-white"}`}>{value}</p>
    </div>
  );
}
