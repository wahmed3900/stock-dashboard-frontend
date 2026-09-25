"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import AppShell from "@/components/AppShell";
import { api, Me } from "@/lib/appApi";

type Plan = { id: string; name: string; price: number; interval: string; tier: string };

const TIERS = [
  {
    key: "free",
    title: "Free",
    blurb: "Look up any market and learn what the indicators say.",
    features: [
      "Stocks, ETFs, indices, crypto, forex, commodities and bonds",
      "RSI, MACD and Bollinger Bands on every lookup",
      "Plain-English automated reading of the indicators",
    ],
  },
  {
    key: "pro",
    title: "Starter",
    blurb: "An AI-written summary for every symbol you look up.",
    features: ["Everything in Free", "AI-written technical summary for any symbol"],
  },
  {
    key: "premium",
    title: "Premium",
    blurb: "Let StockAI watch the market for you.",
    features: [
      "Everything in Starter",
      "Watchlist of up to 50 symbols with prices",
      "Price alerts by email",
      "Price alerts by text message",
    ],
  },
];

export default function PricingPage() {
  const { status } = useSession();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [me, setMe] = useState<Me | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<string | null>(null);

  useEffect(() => {
    setCheckout(new URLSearchParams(window.location.search).get("checkout"));
    api<{ plans: Plan[] }>("plans").then((r) => setPlans(r.plans)).catch(() => {});
  }, []);

  useEffect(() => {
    if (status === "authenticated") api<Me>("me").then(setMe).catch(() => {});
  }, [status]);

  const priceOf = (tier: string) => plans.find((p) => p.tier === tier);
  const current = me?.tier ?? "free";
  const rank: Record<string, number> = { free: 0, basic: 1, pro: 2, premium: 3 };

  async function choose(tier: string) {
    setError(null);
    if (status !== "authenticated") return signIn("google", { callbackUrl: "/pricing" });
    const plan = priceOf(tier);
    if (!plan) return setError("Plans are still loading, try again in a moment");
    setBusy(tier);
    try {
      const origin = window.location.origin;
      const r = await api<{ checkout_url: string }>("create-checkout-session", {
        method: "POST",
        body: { plan_id: plan.id, success_url: `${origin}/pricing?checkout=success`, cancel_url: `${origin}/pricing` },
      });
      window.location.href = r.checkout_url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't start checkout");
      setBusy(null);
    }
  }

  async function manage() {
    setBusy("manage");
    setError(null);
    try {
      const r = await api<{ url: string }>("billing-portal", { method: "POST" });
      window.location.href = r.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't open billing");
      setBusy(null);
    }
  }

  return (
    <AppShell>
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Plans</h1>
          <p className="mt-1 text-sm text-[#71717a]">Monthly, cancel anytime. For educational purposes only, not investment advice.</p>
        </div>

        {checkout === "success" && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3 text-sm text-emerald-300">
            Thanks for subscribing! Your plan updates within a minute. Refresh this page if it hasn&apos;t yet.
          </div>
        )}
        {error && <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-300">{error}</div>}

        <div className="grid gap-4 md:grid-cols-3">
          {TIERS.map((t) => {
            const plan = priceOf(t.key);
            const isCurrent = status === "authenticated" && me != null && current === t.key;
            const highlight = t.key === "premium";
            return (
              <div
                key={t.key}
                className={`flex flex-col rounded-2xl border p-6 ${highlight ? "border-amber-400/30 bg-amber-400/[0.03]" : "border-[#1e1e24]"}`}
              >
                <h2 className="text-lg font-semibold text-white">{t.title}</h2>
                <p className="mt-1 text-sm text-[#a1a1aa]">{t.blurb}</p>
                <p className="mt-4 text-3xl font-bold text-white tabular-nums">
                  {t.key === "free" ? "$0" : plan ? `$${(plan.price / 100).toFixed(0)}` : "…"}
                  <span className="text-sm font-normal text-[#71717a]"> / month</span>
                </p>
                <ul className="mt-5 flex-1 space-y-2 text-sm text-[#d4d4d8]">
                  {t.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-emerald-400">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  {isCurrent ? (
                    t.key === "free" ? (
                      <span className="block rounded-lg border border-[#27272a] px-4 py-2 text-center text-sm text-[#a1a1aa]">Your current plan</span>
                    ) : (
                      <button onClick={manage} disabled={busy !== null} className="w-full rounded-lg border border-[#27272a] px-4 py-2 text-sm text-white hover:border-zinc-500 disabled:opacity-50">
                        {busy === "manage" ? "Opening…" : "Current plan · Manage billing"}
                      </button>
                    )
                  ) : t.key === "free" ? (
                    <Link href="/" className="block rounded-lg border border-[#27272a] px-4 py-2 text-center text-sm text-white hover:border-zinc-500">
                      Open the dashboard
                    </Link>
                  ) : rank[current] > rank[t.key] ? (
                    <button onClick={manage} disabled={busy !== null} className="w-full rounded-lg border border-[#27272a] px-4 py-2 text-sm text-[#a1a1aa] hover:border-zinc-500 disabled:opacity-50">
                      Switch plan in billing
                    </button>
                  ) : (
                    <button
                      onClick={() => choose(t.key)}
                      disabled={busy !== null}
                      className={`w-full rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 ${highlight ? "bg-amber-300 text-black hover:bg-amber-200" : "bg-white text-black hover:bg-zinc-200"}`}
                    >
                      {busy === t.key ? "Opening checkout…" : status === "authenticated" ? `Get ${t.title}` : `Sign in to get ${t.title}`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-[#71717a]">
          Payments are handled securely by Stripe. Plans renew monthly until you cancel; cancelling keeps access until the end
          of the billing period. See the <Link href="/terms" className="underline">Terms of Service</Link>.
        </p>
      </main>
    </AppShell>
  );
}
