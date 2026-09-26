import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "StockAI - AI Stock Analyzer",
  description: "Automated reading of RSI, MACD, and Bollinger Bands for stocks, ETFs, crypto, and forex.",
  keywords: "stock market, crypto, trading, AI analysis, Gemini, real-time data",
  authors: [{ name: "Your Name" }],
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "StockAI - AI Stock Analyzer",
    description: "Automated reading of RSI, MACD, and Bollinger Bands.",
    type: "website",
    url: "https://your-vercel-url.vercel.app",
    siteName: "StockAI",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} bg-slate-950 text-white antialiased`}>
        <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">SA</span>
                </div>
                <div>
                  <h1 className="font-bold text-white text-lg leading-none">StockAI</h1>
                  <span className="text-xs text-slate-400">AI Stock Analyzer</span>
                </div>
              </Link>
            </div>
            <nav className="flex items-center gap-6">
              <Link href="/" className="text-sm text-slate-300 hover:text-white transition-colors">Home</Link>
              <Link href="/Market" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">Dashboard</Link>
              <div className="flex items-center gap-2 text-xs">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-slate-400">Live</span>
              </div>
            </nav>
          </div>
        </header>
        <main className="min-h-screen">{children}</main>
        <footer className="border-t border-slate-800 bg-slate-900/30 py-6">
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-400">© 2026 StockAI. Powered by Gemini AI</p>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span>⚡ Real-time</span>
              <span>•</span>
              <span>🤖 AI Analysis</span>
              <span>•</span>
              <span>📊 Live Data</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
