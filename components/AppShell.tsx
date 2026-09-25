"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthButton from "@/components/AuthButton";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/watchlist", label: "Watchlist", premium: true },
  { href: "/alerts", label: "Alerts", premium: true },
  { href: "/pricing", label: "Pricing" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname?.startsWith(href));

  return (
    <div className="flex min-h-screen bg-[#09090b] text-[#f4f4f5] font-sans antialiased">
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-[#1e1e24] p-6 space-y-6">
        <Link href="/" className="px-2 text-xl font-bold tracking-tight text-white">StockAI</Link>
        <nav className="flex-1 space-y-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition ${
                isActive(n.href) ? "bg-[#18181b] text-white" : "text-[#a1a1aa] hover:bg-[#18181b] hover:text-white"
              }`}
            >
              {n.label}
              {n.premium && (
                <span className="rounded-full border border-amber-400/30 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-amber-300">
                  Premium
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="pt-4 border-t border-[#1e1e24] px-2">
          <AuthButton />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile: brand, sign-in and nav (the sidebar is hidden below md) */}
        <div className="md:hidden border-b border-[#1e1e24]">
          <div className="flex h-14 items-center justify-between px-4">
            <Link href="/" className="text-lg font-bold tracking-tight text-white">StockAI</Link>
            <AuthButton />
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm ${
                  isActive(n.href) ? "bg-[#18181b] text-white" : "text-[#a1a1aa]"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>

        {children}

        <footer className="border-t border-[#1e1e24] px-4 sm:px-6 py-4 text-xs leading-relaxed text-[#71717a]">
          StockAI is for educational and informational purposes only and is not investment, financial or trading
          advice. Market data comes from third-party sources, may be delayed or inaccurate, and is provided as-is.
          AI-generated summaries can be wrong. Do your own research and consider speaking with a licensed financial
          advisor before making investment decisions.
          <nav className="mt-3 flex flex-wrap gap-4">
            <Link href="/pricing" className="hover:text-white">Pricing</Link>
            <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white">Terms of Service</Link>
          </nav>
        </footer>
      </div>
    </div>
  );
}

// Shown on Premium pages to anyone who isn't on Premium yet
export function UpgradeCard({ feature }: { feature: string }) {
  return (
    <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.04] p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">Premium feature</p>
      <h2 className="mt-2 text-xl font-semibold text-white">{feature} is part of StockAI Premium</h2>
      <p className="mt-2 max-w-prose text-sm leading-relaxed text-[#a1a1aa]">
        Premium adds a saved watchlist with prices, and price alerts by email and text message, on top of
        everything in Starter.
      </p>
      <Link
        href="/pricing"
        className="mt-5 inline-block rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200"
      >
        See plans
      </Link>
    </div>
  );
}

export function SignInCard({ what }: { what: string }) {
  return (
    <div className="rounded-2xl border border-[#1e1e24] p-6 sm:p-8">
      <h2 className="text-xl font-semibold text-white">Sign in to {what}</h2>
      <p className="mt-2 text-sm text-[#a1a1aa]">Use your Google account. It takes a few seconds.</p>
      <div className="mt-5">
        <AuthButton />
      </div>
    </div>
  );
}
