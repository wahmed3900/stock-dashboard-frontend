// Browser-side helper for the signed-in API bridge at /api/app/*
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function api<T = any>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(`/api/app/${path}`, {
    method: init?.method ?? "GET",
    headers: { "content-type": "application/json" },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {}
  if (!res.ok) {
    let msg = json?.detail ?? `Something went wrong (${res.status})`;
    if (Array.isArray(msg)) msg = msg.map((d: any) => d.msg?.replace(/^Value error, /, "")).join(" ");
    throw new ApiError(res.status, msg);
  }
  return json as T;
}

export type Me = {
  email: string;
  tier: "free" | "pro" | "premium" | "basic";
  plan_name: string;
  is_premium: boolean;
  phone: string | null;
  phone_verified: boolean;
  sms_available: boolean;
  sms_daily_limit: number;
  limits: { watchlist: number; alerts: number };
};
