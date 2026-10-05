// Hub page linking every ticker page, so search engines (and people) can find them all.
import type { Metadata } from "next";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { ASSET_ORDER, TICKERS } from "@/lib/tickers";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Technical analysis for stocks, crypto, forex and more | StockAI",
  description:
    "Free daily RSI, MACD and Bollinger Band readings for popular stocks, ETFs, indices, crypto, forex, commodities and Treasury yields, explained in plain English.",
  alternates: { canonical: "/stock" },
};

export default function MarketsIndex() {
  return (
    <AppShell>
      <main className="flex-1 p-6 max-w-4xl w-full mx-auto space-y-8">
        <section className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Markets</h1>
          <p className="text-[15px] text-[#a1a1aa] max-w-prose">
            Pick a ticker to see its RSI, MACD and Bollinger Bands with a plain-English reading. Looking for something
            else? Search any symbol from the <Link href="/" className="text-white underline">dashboard</Link>.
          </p>
        </section>
        {ASSET_ORDER.map((cls) => (
          <section key={cls} className="space-y-3">
            <h2 className="text-lg font-semibold text-white">{cls}</h2>
            <div className="flex flex-wrap gap-2">
              {TICKERS.filter((t) => t.cls === cls).map((t) => (
                <Link key={t.slug} href={`/stock/${t.slug}`}
                  className="rounded-full border border-[#27272a] px-3 py-1 text-sm text-[#d4d4d8] hover:border-zinc-500 hover:text-white">
                  {t.name === t.label ? t.label : `${t.name} (${t.label})`}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </main>
    </AppShell>
  );
}
