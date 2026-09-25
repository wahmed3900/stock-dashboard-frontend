// Server-side bridge between the browser and the StockAI API.
// It reads the Google sign-in session here on the server and tells the API who
// the user is, proving itself with INTERNAL_API_KEY. That key never reaches the browser.
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const BACKEND_URL =
  process.env.BACKEND_URL ?? "https://stock-dashboard-backend-634072894074.us-west4.run.app";

// Only these API paths can be reached through the bridge.
const ALLOWED: { re: RegExp; methods: string[]; publicOk?: boolean }[] = [
  { re: /^stock\/[A-Za-z0-9^=.\-]{1,15}$/, methods: ["GET"], publicOk: true },
  { re: /^plans$/, methods: ["GET"], publicOk: true },
  { re: /^me$/, methods: ["GET"] },
  { re: /^me\/phone$/, methods: ["POST", "DELETE"] },
  { re: /^me\/phone\/verify$/, methods: ["POST"] },
  { re: /^watchlist$/, methods: ["GET", "POST"] },
  { re: /^watchlist\/[A-Za-z0-9^=.\-]{1,15}$/, methods: ["DELETE"] },
  { re: /^alerts$/, methods: ["GET", "POST"] },
  { re: /^alerts\/[a-f0-9]{24}$/, methods: ["DELETE"] },
  { re: /^create-checkout-session$/, methods: ["POST"] },
  { re: /^billing-portal$/, methods: ["POST"] },
];

async function handle(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const p = path.map(encodeURIComponent).join("/").replace(/%5E/gi, "^").replace(/%3D/gi, "=");
  const rule = ALLOWED.find((r) => r.re.test(p) && r.methods.includes(req.method));
  if (!rule) return NextResponse.json({ detail: "Not found" }, { status: 404 });

  const session = await auth();
  const email = session?.user?.email;
  if (!email && !rule.publicOk) {
    return NextResponse.json({ detail: "Please sign in" }, { status: 401 });
  }

  const headers: Record<string, string> = { "content-type": "application/json" };
  const key = process.env.INTERNAL_API_KEY;
  if (email && key) {
    headers["x-internal-key"] = key;
    headers["x-user-email"] = email;
    if (session?.user?.name) headers["x-user-name"] = session.user.name;
  } else if (email && !key) {
    console.error("INTERNAL_API_KEY is not set on Vercel; signed-in features won't work");
  }

  const url = `${BACKEND_URL}/api/${p}${req.nextUrl.search}`;
  const body = req.method === "GET" || req.method === "DELETE" ? undefined : await req.text();
  try {
    const res = await fetch(url, { method: req.method, headers, body, cache: "no-store" });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "content-type": res.headers.get("content-type") ?? "application/json" },
    });
  } catch {
    return NextResponse.json({ detail: "The server is unreachable right now" }, { status: 502 });
  }
}

export { handle as GET, handle as POST, handle as DELETE };
