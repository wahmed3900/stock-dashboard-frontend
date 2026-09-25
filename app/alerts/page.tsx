"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import AppShell, { SignInCard, UpgradeCard } from "@/components/AppShell";
import { api, Me } from "@/lib/appApi";
import { fmtPrice, resolveSymbol } from "@/lib/symbols";

type Alert = {
  id: string;
  symbol: string;
  condition: "ABOVE" | "BELOW";
  target_price: number;
  notify_email: boolean;
  notify_sms: boolean;
  active: boolean;
  triggered: boolean;
  triggered_at?: string | null;
  triggered_price?: number | null;
};

const inputCls =
  "rounded-lg border border-[#27272a] bg-[#18181b] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400";
const btnCls = "rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200 disabled:opacity-50";

export default function AlertsPage() {
  const { status } = useSession();
  const [me, setMe] = useState<Me | null>(null);
  const [alerts, setAlerts] = useState<Alert[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // New-alert form
  const [symbol, setSymbol] = useState("");
  const [condition, setCondition] = useState<"ABOVE" | "BELOW">("ABOVE");
  const [price, setPrice] = useState("");
  const [byEmail, setByEmail] = useState(true);
  const [bySms, setBySms] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadMe = useCallback(() => api<Me>("me").then(setMe), []);
  const loadAlerts = useCallback(async () => {
    const r = await api<{ alerts: Alert[] }>("alerts");
    setAlerts(r.alerts);
  }, []);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("symbol");
    if (q) setSymbol(q.toUpperCase());
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    loadMe()
      .then(() => undefined)
      .catch((e) => setError(e.message));
  }, [status, loadMe]);

  useEffect(() => {
    if (me?.is_premium) loadAlerts().catch((e) => setError(e.message));
  }, [me?.is_premium, loadAlerts]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const target = parseFloat(price);
    if (!symbol.trim() || !(target > 0)) return setError("Enter a symbol and a price above zero");
    setSaving(true);
    try {
      await api("alerts", {
        method: "POST",
        body: { symbol: resolveSymbol(symbol), condition, target_price: target, notify_email: byEmail, notify_sms: bySms },
      });
      setPrice("");
      await loadAlerts();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't create the alert");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    setAlerts((cur) => cur?.filter((a) => a.id !== id) ?? cur);
    try {
      await api(`alerts/${id}`, { method: "DELETE" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't delete it");
      loadAlerts();
    }
  }

  const active = alerts?.filter((a) => a.active) ?? [];
  const fired = alerts?.filter((a) => !a.active) ?? [];

  return (
    <AppShell>
      <main className="flex-1 w-full max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Price alerts</h1>
          <p className="mt-1 text-sm text-[#71717a]">
            Get an email or a text when a symbol goes above or below your price. Prices are checked about once a
            minute and may be delayed, so alerts can arrive late. Each alert fires once.
          </p>
        </div>

        {status === "loading" || (status === "authenticated" && !me && !error) ? (
          <p className="text-sm text-[#71717a]">Loading…</p>
        ) : status === "unauthenticated" ? (
          <SignInCard what="set price alerts" />
        ) : me && !me.is_premium ? (
          <UpgradeCard feature="Price alerts" />
        ) : me ? (
          <>
            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-300">{error}</div>
            )}

            <form onSubmit={create} className="rounded-2xl border border-[#1e1e24] p-5 space-y-4">
              <h2 className="text-sm font-semibold text-white">New alert</h2>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="Symbol, e.g. AAPL" aria-label="Symbol" className={`${inputCls} w-40`} />
                <select value={condition} onChange={(e) => setCondition(e.target.value as "ABOVE" | "BELOW")} aria-label="Condition" className={inputCls}>
                  <option value="ABOVE">goes above</option>
                  <option value="BELOW">goes below</option>
                </select>
                <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder="Price" aria-label="Target price" className={`${inputCls} w-32`} />
              </div>
              <div className="flex flex-wrap gap-5 text-sm text-[#d4d4d8]">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={byEmail} onChange={(e) => setByEmail(e.target.checked)} /> Email me
                </label>
                <label className={`flex items-center gap-2 ${me.phone_verified ? "" : "opacity-50"}`}>
                  <input type="checkbox" checked={bySms} disabled={!me.phone_verified} onChange={(e) => setBySms(e.target.checked)} /> Text me
                  {!me.phone_verified && <span className="text-xs text-[#71717a]">(verify your phone below first)</span>}
                </label>
              </div>
              <button disabled={saving} className={btnCls}>{saving ? "Saving…" : "Create alert"}</button>
            </form>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-white">
                Active alerts <span className="font-normal text-[#71717a]">({active.length} of {me.limits.alerts})</span>
              </h2>
              {alerts === null ? (
                <p className="text-sm text-[#71717a]">Loading…</p>
              ) : active.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-[#27272a] p-6 text-center text-sm text-[#71717a]">No active alerts.</p>
              ) : (
                <ul className="divide-y divide-[#1e1e24] rounded-2xl border border-[#1e1e24]">
                  {active.map((a) => (
                    <AlertRow key={a.id} a={a} onDelete={() => remove(a.id)} />
                  ))}
                </ul>
              )}
            </section>

            {fired.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-white">Triggered</h2>
                <ul className="divide-y divide-[#1e1e24] rounded-2xl border border-[#1e1e24]">
                  {fired.map((a) => (
                    <AlertRow key={a.id} a={a} onDelete={() => remove(a.id)} />
                  ))}
                </ul>
              </section>
            )}

            <PhoneSettings me={me} onChange={loadMe} />
          </>
        ) : (
          error && <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-300">{error}</div>
        )}
      </main>
    </AppShell>
  );
}

function AlertRow({ a, onDelete }: { a: Alert; onDelete: () => void }) {
  const via = [a.notify_email && "email", a.notify_sms && "text"].filter(Boolean).join(" + ");
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
      <div>
        <span className="font-medium text-white">{a.symbol}</span>{" "}
        <span className="text-[#a1a1aa]">{a.condition === "ABOVE" ? "goes above" : "goes below"}</span>{" "}
        <span className="tabular-nums text-white">{fmtPrice(a.target_price, a.symbol)}</span>
        <span className="ml-2 text-xs text-[#71717a]">by {via}</span>
        {a.triggered && a.triggered_price != null && (
          <span className="ml-2 text-xs text-amber-300">
            fired at {fmtPrice(a.triggered_price, a.symbol)}
            {a.triggered_at ? ` on ${new Date(a.triggered_at + "Z").toLocaleString()}` : ""}
          </span>
        )}
      </div>
      <button onClick={onDelete} className="text-xs text-[#a1a1aa] hover:text-rose-400">Delete</button>
    </li>
  );
}

function PhoneSettings({ me, onChange }: { me: Me; onChange: () => Promise<unknown> }) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-[#1e1e24] p-5 space-y-3">
      <h2 className="text-sm font-semibold text-white">Text message alerts</h2>
      {!me.sms_available ? (
        <p className="text-sm text-[#71717a]">Text alerts are coming soon. Email alerts work now.</p>
      ) : me.phone_verified ? (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-[#d4d4d8]">Texts go to <span className="font-medium text-white">{me.phone}</span></span>
          <button
            disabled={busy}
            onClick={() => run(async () => { await api("me/phone", { method: "DELETE" }); await onChange(); })}
            className="text-xs text-[#a1a1aa] hover:text-rose-400"
          >
            Remove number
          </button>
          <p className="w-full text-xs text-[#71717a]">Up to {me.sms_daily_limit} texts a day. Reply STOP to any text to opt out. Carrier message rates may apply.</p>
        </div>
      ) : !sentTo ? (
        <form
          onSubmit={(e) => { e.preventDefault(); run(async () => { const r = await api<{ phone: string }>("me/phone", { method: "POST", body: { phone } }); setSentTo(r.phone); }); }}
          className="space-y-3"
        >
          <p className="text-sm text-[#a1a1aa]">Add your mobile number and we&apos;ll text you a 6-digit code to confirm it.</p>
          <div className="flex flex-wrap gap-3">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" autoComplete="tel" placeholder="+1 916 555 0123" aria-label="Mobile number" className={`${inputCls} w-52`} />
            <button disabled={busy || phone.trim().length < 8} className={btnCls}>{busy ? "Sending…" : "Send code"}</button>
          </div>
          <p className="text-xs text-[#71717a]">By adding your number you agree to receive StockAI alert texts. Reply STOP to opt out. Carrier message rates may apply.</p>
        </form>
      ) : (
        <form
          onSubmit={(e) => { e.preventDefault(); run(async () => { await api("me/phone/verify", { method: "POST", body: { code } }); await onChange(); }); }}
          className="space-y-3"
        >
          <p className="text-sm text-[#a1a1aa]">We texted a code to {sentTo}. It expires in 10 minutes.</p>
          <div className="flex flex-wrap gap-3">
            <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="123456" aria-label="Verification code" className={`${inputCls} w-32 tracking-widest`} />
            <button disabled={busy || code.length !== 6} className={btnCls}>{busy ? "Checking…" : "Verify"}</button>
            <button type="button" onClick={() => { setSentTo(null); setCode(""); }} className="text-xs text-[#a1a1aa] hover:text-white">Use a different number</button>
          </div>
        </form>
      )}
      {msg && <p className="text-sm text-red-300">{msg}</p>}
    </section>
  );
}
