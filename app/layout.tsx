import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "StockAI: AI technical analysis for any market",
  description:
    "AI-powered technical analysis for stocks, ETFs, crypto, forex, commodities, indices and bonds. RSI, MACD and Bollinger Bands, explained in plain English.",
  openGraph: {
    title: "StockAI: AI technical analysis for any market",
    description:
      "RSI, MACD and Bollinger Bands for stocks, crypto, forex and more, with an AI summary in plain English. Not financial advice.",
    siteName: "StockAI",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
