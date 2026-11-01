// Insider-filing alert emails, sent through Resend: one email per user listing
// each followed ticker's new Form 4 filings.
import type { Form4 } from "@/lib/sec";
import { SITE_URL } from "@/lib/site";

export type Alert = { ticker: string; filings: Form4[] };

const RESEND_URL = "https://api.resend.com/emails";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export function buildAlertHtml(items: Alert[]): string {
  const blocks = items.map((item) => {
    const rows = item.filings
      .map(
        (f) =>
          `<tr>` +
          `<td style="padding:10px 0;border-top:1px solid #eef0f3;color:#475467;">${esc(f.date)}</td>` +
          `<td style="padding:10px 0;border-top:1px solid #eef0f3;text-align:right;">` +
          `<a href="${esc(f.url)}" style="color:#2563eb;text-decoration:none;font-weight:600;">View filing &rarr;</a></td>` +
          `</tr>`,
      )
      .join("");
    const count = item.filings.length;
    return (
      `<div style="background:#ffffff;border:1px solid #e4e7ec;border-radius:12px;padding:20px 24px;margin-bottom:16px;">` +
      `<div style="font-size:20px;font-weight:700;color:#101828;">${esc(item.ticker)}</div>` +
      `<div style="font-size:14px;color:#667085;margin:4px 0 12px;">${count} new insider filing${count === 1 ? "" : "s"} (Form 4)</div>` +
      `<table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;border-collapse:collapse;">${rows}</table>` +
      `</div>`
    );
  });

  return (
    `<div style="background:#f5f7fa;padding:32px 16px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">` +
    `<div style="max-width:560px;margin:0 auto;">` +
    `<div style="font-size:13px;font-weight:700;letter-spacing:1px;color:#2563eb;text-transform:uppercase;margin-bottom:6px;">StockAI Signal</div>` +
    `<div style="font-size:24px;font-weight:700;color:#101828;margin-bottom:20px;">New insider activity on your tickers</div>` +
    blocks.join("") +
    `<a href="${SITE_URL}/alerts" style="display:inline-block;background:#2563eb;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin-top:4px;">Manage your alerts</a>` +
    `<p style="font-size:12px;color:#98a2b3;line-height:1.5;margin-top:24px;">Data from SEC EDGAR filings. For informational purposes only, not investment advice.</p>` +
    `</div></div>`
  );
}

/** Email one user all their new filings in a single message. Never throws. */
export async function sendAlerts(email: string, items: Alert[]): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set; skipping alert to %s", email);
    return;
  }
  try {
    const response = await fetch(RESEND_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.ALERT_FROM ?? "StockAI <onboarding@resend.dev>",
        to: [email],
        subject: `Insider activity: ${items.map((i) => i.ticker).join(", ")}`,
        html: buildAlertHtml(items),
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) console.error("Alert email to %s failed: %s %s", email, response.status, await response.text());
  } catch (error) {
    console.error("Alert email to %s failed: %s", email, error);
  }
}
