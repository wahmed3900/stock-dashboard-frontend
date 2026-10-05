// Public address of the site. Set NEXT_PUBLIC_SITE_URL on Vercel when you add a custom domain.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://stock-dashboard-frontend-one.vercel.app"
).replace(/\/$/, "");

// How often each public ticker page is rebuilt, in seconds (6 hours).
// Lower it for fresher numbers; raise it to cut backend calls.
export const TICKER_REVALIDATE = 21600;
