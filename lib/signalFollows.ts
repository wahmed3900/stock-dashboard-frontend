// MongoDB collection of who follows which ticker for insider-filing alerts.
// Uses the same MONGODB_URI as the backend; connects lazily so a missing env var
// only breaks these routes, not the whole app.
import { MongoClient, type Collection } from "mongodb";

export type SignalFollow = {
  email: string;
  ticker: string;
  cik: string;
  last_seen: string | null; // accession of the newest filing already alerted
};

const g = globalThis as typeof globalThis & { _signalFollows?: Promise<Collection<SignalFollow>> };

export function signalFollows(): Promise<Collection<SignalFollow>> {
  if (!g._signalFollows) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI is not set");
    g._signalFollows = new MongoClient(uri)
      .connect()
      .then(async (client) => {
        const col = client.db(process.env.MONGODB_DB_NAME ?? "stock_dashboard").collection<SignalFollow>("signal_follows");
        await col.createIndex({ email: 1, ticker: 1 }, { unique: true });
        await col.createIndex({ cik: 1 });
        return col;
      })
      .catch((error) => {
        g._signalFollows = undefined;
        throw error;
      });
  }
  return g._signalFollows;
}

export const normalizeTicker = (t: string) => t.trim().toUpperCase();
export const isValidTicker = (t: string) => /^[A-Z0-9.-]{1,10}$/.test(t);
