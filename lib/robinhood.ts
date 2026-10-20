// Server-only client for the Robinhood Crypto Trading API (v1).
// Requests are signed with an Ed25519 private key, so this must never be imported
// from a client component. Docs: https://docs.robinhood.com/crypto/trading/
import { createPrivateKey, sign, type KeyObject } from "crypto";

const BASE_URL = "https://trading.robinhood.com";

// DER prefix that wraps a raw 32-byte Ed25519 seed as a PKCS#8 private key.
const ED25519_PKCS8_PREFIX = Buffer.from("302e020100300506032b657004220420", "hex");

export class RobinhoodError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function robinhoodConfigured() {
  return Boolean(process.env.ROBINHOOD_API_KEY && process.env.ROBINHOOD_PRIVATE_KEY);
}

export function keyFromBase64Seed(seedBase64: string): KeyObject {
  const seed = Buffer.from(seedBase64.trim(), "base64");
  if (seed.length !== 32) throw new Error("ROBINHOOD_PRIVATE_KEY must be a base64-encoded 32-byte Ed25519 key");
  return createPrivateKey({ key: Buffer.concat([ED25519_PKCS8_PREFIX, seed]), format: "der", type: "pkcs8" });
}

// message = api_key + timestamp + path + method + body (body omitted when empty)
export function signRequest(key: KeyObject, apiKey: string, timestamp: number | string, path: string, method: string, body = "") {
  const message = `${apiKey}${timestamp}${path}${method}${body}`;
  return sign(null, Buffer.from(message, "utf-8"), key).toString("base64");
}

let cachedKey: KeyObject | null = null;

export async function robinhood<T = any>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  const apiKey = process.env.ROBINHOOD_API_KEY;
  const privateKey = process.env.ROBINHOOD_PRIVATE_KEY;
  if (!apiKey || !privateKey) throw new RobinhoodError(503, "Robinhood is not connected. Add ROBINHOOD_API_KEY and ROBINHOOD_PRIVATE_KEY on Vercel.");
  cachedKey ??= keyFromBase64Seed(privateKey);

  const bodyText = body === undefined ? "" : JSON.stringify(body);
  const timestamp = Math.floor(Date.now() / 1000);
  const res = await fetch(BASE_URL + path, {
    method,
    headers: {
      "x-api-key": apiKey,
      "x-timestamp": String(timestamp),
      "x-signature": signRequest(cachedKey, apiKey, timestamp, path, method, bodyText),
      "content-type": "application/json; charset=utf-8",
    },
    body: bodyText || undefined,
    cache: "no-store",
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {}
  if (!res.ok) {
    const detail =
      json?.errors?.map((e: any) => [e.attr, e.detail].filter(Boolean).join(": ")).join("; ") ||
      json?.detail ||
      text ||
      `Robinhood returned ${res.status}`;
    throw new RobinhoodError(res.status, detail);
  }
  return (json ?? text) as T;
}

// Only the signed-in emails listed in ROBINHOOD_ALLOWED_EMAILS can use the account.
// With the variable unset, nobody can.
export function canUseRobinhood(email: string | null | undefined) {
  if (!email) return false;
  const allowed = (process.env.ROBINHOOD_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.toLowerCase());
}
