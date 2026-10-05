// Server-only: fetch one ticker for the public pages, cached by Next.js between rebuilds.
import { cache } from "react";
import { normalize, type View } from "@/lib/stockView";
import { TICKER_REVALIDATE } from "@/lib/site";

const BACKEND_URL =
  process.env.BACKEND_URL ?? "https://stock-dashboard-backend-634072894074.us-west4.run.app";

// Returns null when the ticker doesn't exist. Throws on outages, so Next.js keeps
// serving the last good version of the page instead of caching an error.
export const getStock = cache(async (symbol: string): Promise<View | null> => {
  const path = encodeURIComponent(symbol).replace(/%5E/gi, "^").replace(/%3D/gi, "=");
  const res = await fetch(`${BACKEND_URL}/api/stock/${path}?period=3mo`, {
    next: { revalidate: TICKER_REVALIDATE },
  });
  if ([400, 404, 422].includes(res.status)) return null;
  if (!res.ok) throw new Error(`Backend returned ${res.status} for ${symbol}`);
  const view = normalize(await res.json(), symbol);
  return view.price == null ? null : view;
});
