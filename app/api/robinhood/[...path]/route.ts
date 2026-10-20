// Server-side bridge to the Robinhood Crypto Trading API.
// The API key and private key stay on the server, and only emails listed in
// ROBINHOOD_ALLOWED_EMAILS can reach the account (it trades real money).
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { canUseRobinhood, robinhood, robinhoodConfigured, RobinhoodError } from "@/lib/robinhood";

const SYMBOL = /^[A-Z0-9]{1,15}-USD$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type OrderInput = {
  symbol: string;
  side: "buy" | "sell";
  type: "market" | "limit";
  asset_quantity?: string;
  quote_amount?: string;
  limit_price?: string;
};

const positive = (v: unknown) => typeof v === "string" && /^\d+(\.\d+)?$/.test(v) && Number(v) > 0;

function buildOrder(input: OrderInput) {
  if (!SYMBOL.test(input.symbol ?? "")) throw new RobinhoodError(400, "Pick a symbol like BTC-USD.");
  if (input.side !== "buy" && input.side !== "sell") throw new RobinhoodError(400, "Side must be buy or sell.");
  const hasQty = positive(input.asset_quantity);
  const hasAmount = positive(input.quote_amount);

  const base = { client_order_id: randomUUID(), symbol: input.symbol, side: input.side, type: input.type };
  if (input.type === "market") {
    // Robinhood market orders take an asset quantity only.
    if (!hasQty) throw new RobinhoodError(400, "Enter a coin quantity for a market order.");
    return { ...base, market_order_config: { asset_quantity: input.asset_quantity } };
  }
  if (input.type === "limit") {
    if (!positive(input.limit_price)) throw new RobinhoodError(400, "Enter a limit price.");
    if (hasQty === hasAmount) throw new RobinhoodError(400, "Enter either a coin quantity or a USD amount, not both.");
    return {
      ...base,
      limit_order_config: {
        limit_price: input.limit_price,
        ...(hasQty ? { asset_quantity: input.asset_quantity } : { quote_amount: input.quote_amount }),
      },
    };
  }
  throw new RobinhoodError(400, "Order type must be market or limit.");
}

async function route(req: NextRequest, segments: string[]) {
  const key = `${req.method} ${segments.join("/")}`;

  if (key === "GET status") return { connected: robinhoodConfigured() };
  if (key === "GET account") return robinhood("GET", "/api/v1/crypto/trading/accounts/");
  if (key === "GET holdings") return robinhood("GET", "/api/v1/crypto/trading/holdings/");
  if (key === "GET orders") return robinhood("GET", "/api/v1/crypto/trading/orders/?limit=50");
  if (key === "GET pairs") return robinhood("GET", "/api/v1/crypto/trading/trading_pairs/?limit=200");

  if (key === "GET prices") {
    const symbols = (req.nextUrl.searchParams.get("symbols") ?? "")
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter((s) => SYMBOL.test(s))
      .slice(0, 30);
    if (!symbols.length) return { results: [] };
    return robinhood("GET", `/api/v1/crypto/marketdata/best_bid_ask/?${symbols.map((s) => `symbol=${s}`).join("&")}`);
  }

  if (key === "POST orders") {
    const order = buildOrder((await req.json()) as OrderInput);
    return robinhood("POST", "/api/v1/crypto/trading/orders/", order);
  }

  const [first, id, action] = segments;
  if (req.method === "POST" && first === "orders" && UUID.test(id ?? "") && action === "cancel" && segments.length === 3) {
    await robinhood("POST", `/api/v1/crypto/trading/orders/${id}/cancel/`);
    return { ok: true };
  }

  throw new RobinhoodError(404, "Not found");
}

async function handle(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ detail: "Please sign in" }, { status: 401 });
  if (!canUseRobinhood(email)) {
    return NextResponse.json({ detail: "This account isn't allowed to use Robinhood trading." }, { status: 403 });
  }

  try {
    return NextResponse.json(await route(req, path));
  } catch (e: any) {
    const status = e instanceof RobinhoodError ? e.status : 500;
    if (status >= 500) console.error("Robinhood error:", e);
    return NextResponse.json({ detail: e.message ?? "Robinhood request failed" }, { status });
  }
}

export const GET = handle;
export const POST = handle;
