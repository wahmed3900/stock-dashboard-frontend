// SEC EDGAR helpers shared by the insider filings and signal alert routes.
// SEC requires a User-Agent with a contact email.
export const SEC_HEADERS = { "User-Agent": "StockAI wahmed07860786@gmail.com" };

const DAY_MS = 24 * 60 * 60 * 1000;
let cikCache: Map<string, string> | null = null;
let cikLoadedAt = 0;

export type Form4 = { accession: string; date: string; url: string };

/** Map a ticker (AAPL) to its 10-digit SEC CIK. Refreshes once a day. */
export async function getCik(ticker: string): Promise<string | undefined> {
  if (!cikCache || Date.now() - cikLoadedAt > DAY_MS) {
    const response = await fetch("https://www.sec.gov/files/company_tickers.json", {
      headers: SEC_HEADERS,
      next: { revalidate: 86400 },
    });
    if (!response.ok) throw new Error("SEC ticker data is temporarily unavailable");
    const rows = (await response.json()) as Record<string, { ticker: string; cik_str: number }>;
    cikCache = new Map(
      Object.values(rows).map((row) => [row.ticker.toUpperCase(), String(row.cik_str).padStart(10, "0")]),
    );
    cikLoadedAt = Date.now();
  }
  return cikCache.get(ticker.toUpperCase());
}

/** Recent Form 4 filings for a company, newest first. */
export async function fetchForm4(cik: string, { limit = Infinity, revalidate = 900 } = {}): Promise<Form4[]> {
  const response = await fetch(`https://data.sec.gov/submissions/CIK${cik}.json`, {
    headers: SEC_HEADERS,
    next: { revalidate },
  });
  if (!response.ok) throw new Error(`SEC filing data unavailable (${response.status})`);
  const recent = (await response.json()).filings?.recent;
  const filings: Form4[] = [];
  if (!recent) return filings;
  for (let i = 0; i < recent.form.length && filings.length < limit; i++) {
    if (recent.form[i] !== "4") continue;
    const accession: string = recent.accessionNumber[i];
    filings.push({
      accession,
      date: recent.filingDate[i],
      url: `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${accession.replaceAll("-", "")}/${recent.primaryDocument[i].split("/").map(encodeURIComponent).join("/")}`,
    });
  }
  return filings;
}
