import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import { SITE_URL } from "@/lib/site";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL || "http://localhost:3000"),
  title: "StockAI - AI Stock Analyzer",
  description: "Automated reading of RSI, MACD, and Bollinger Bands for stocks, ETFs, crypto, and forex.",
  openGraph: {
    title: "StockAI - AI Stock Analyzer",
    description: "Automated reading of RSI, MACD, and Bollinger Bands.",
    type: "website",
    url: "/",
    siteName: "StockAI",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} bg-[#09090b] text-white antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
