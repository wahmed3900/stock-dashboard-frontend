// Plain-English readings of the indicators. These sentences make each ticker page
// unique, readable content for search engines and for people new to charts.
import type { View } from "@/lib/stockView";
import { fmtPrice } from "@/lib/symbols";

export function explain(v: View, label: string): string[] {
  const out: string[] = [];

  if (v.rsi != null) {
    const r = v.rsi.toFixed(1);
    if (v.rsi >= 70) out.push(`${label}'s RSI is ${r}, above 70. That's overbought territory: buying has been strong lately, and moves this stretched often cool off or pause.`);
    else if (v.rsi <= 30) out.push(`${label}'s RSI is ${r}, below 30. That's oversold territory: selling has been heavy lately, and moves this stretched often bounce or pause.`);
    else if (v.rsi >= 55) out.push(`${label}'s RSI is ${r}, leaning bullish without being overbought. Buyers have had the edge recently.`);
    else if (v.rsi <= 45) out.push(`${label}'s RSI is ${r}, leaning bearish without being oversold. Sellers have had the edge recently.`);
    else out.push(`${label}'s RSI is ${r}, close to the neutral 50 mark. Momentum isn't strongly favoring buyers or sellers.`);
  }

  if (v.macdHist != null) {
    out.push(
      v.macdHist >= 0
        ? `The MACD histogram is positive, meaning short-term momentum is running above its recent average, which traders read as an upward push.`
        : `The MACD histogram is negative, meaning short-term momentum is running below its recent average, which traders read as a downward push.`
    );
  } else if (v.macd == null) {
    out.push(`There isn't enough price history yet to calculate MACD for ${label}.`);
  }

  if (v.price != null && v.upper != null && v.lower != null) {
    const p = fmtPrice(v.price, v.symbol);
    const range = `${fmtPrice(v.lower, v.symbol)} to ${fmtPrice(v.upper, v.symbol)}`;
    if (v.price >= v.upper) out.push(`At ${p}, ${label} is trading at or above its upper Bollinger Band (${range}), an unusually high level compared with its recent range.`);
    else if (v.price <= v.lower) out.push(`At ${p}, ${label} is trading at or below its lower Bollinger Band (${range}), an unusually low level compared with its recent range.`);
    else {
      const pos = (v.price - v.lower) / (v.upper - v.lower);
      const where = pos > 0.66 ? "the upper part" : pos < 0.33 ? "the lower part" : "the middle";
      out.push(`At ${p}, ${label} sits in ${where} of its Bollinger Band range (${range}).`);
    }
  }

  return out;
}
