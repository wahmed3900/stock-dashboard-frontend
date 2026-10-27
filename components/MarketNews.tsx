import React, { useState, useEffect } from 'react';

// Define TypeScript interfaces for market news and indices
interface MarketArticle {
  id: string;
  title: string;
  source: string;
  time: string;
  url: string;
  category: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

interface MarketIndex {
  symbol: string;
  name: string;
  region: 'US' | 'Europe' | 'Asia';
  value: string;
  change: string;
  isPositive: boolean;
}

export const MarketNews: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(false);

  // Mock data representing global stock market coverage (All 7 major markets / regions focus)
  const indices: MarketIndex[] = [
    { symbol: '^DJI', name: 'Dow Jones', region: 'US', value: '43,210.50', change: '+0.45%', isPositive: true },
    { symbol: '^GSPC', name: 'S&P 500', region: 'US', value: '5,850.20', change: '+0.62%', isPositive: true },
    { symbol: '^IXIC', name: 'Nasdaq Composite', region: 'US', value: '18,518.60', change: '+0.88%', isPositive: true },
    { symbol: '^FTSE', name: 'FTSE 100', region: 'Europe', value: '8,240.10', change: '-0.15%', isPositive: false },
    { symbol: '^N225', name: 'Nikkei 225', region: 'Asia', value: '38,981.75', change: '+1.20%', isPositive: true },
    { symbol: '^HSI', name: 'Hang Seng', region: 'Asia', value: '20,845.30', change: '-0.75%', isPositive: false },
    { symbol: '000001.SS', name: 'Shanghai Composite', region: 'Asia', value: '3,260.40', change: '+0.30%', isPositive: true },
  ];

  const articles: MarketArticle[] = [
    {
      id: '1',
      title: 'Wall Street Futures Edge Higher as Tech Giants Prepare Earnings',
      source: 'Bloomberg',
      time: '15m ago',
      url: '#',
      category: 'US',
      sentiment: 'bullish',
    },
    {
      id: '2',
      title: 'Nikkei Surges Past Key Resistance Amid Weakening Yen Trends',
      source: 'Reuters',
      time: '42m ago',
      url: '#',
      category: 'Asia',
      sentiment: 'bullish',
    },
    {
      id: '3',
      title: 'European Markets Slip as Energy Sector Drags Down FTSE and DAX',
      source: 'Financial Times',
      time: '1h ago',
      url: '#',
      category: 'Europe',
      sentiment: 'bearish',
    },
    {
      id: '4',
      title: 'Hang Seng Volatility Continues Following New Economic Stimulus Measures',
      source: 'WSJ',
      time: '2h ago',
      url: '#',
      category: 'Asia',
      sentiment: 'neutral',
    },
    {
      id: '5',
      title: 'Shanghai Composite Finds Footing After Early Morning Sell-Off',
      source: 'CNBC',
      time: '3h ago',
      url: '#',
      category: 'Asia',
      sentiment: 'neutral',
    },
  ];

  const filteredArticles = selectedRegion === 'ALL' 
    ? articles 
    : articles.filter(article => article.category === selectedRegion);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 bg-slate-900 text-slate-100 rounded-xl shadow-2xl">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Global Market News & Ticker</h2>
          <p className="text-sm text-slate-400 mt-1">Real-time updates across major global indices and financial hubs.</p>
        </div>
        
        {/* Region Filter Buttons */}
        <div className="flex gap-2 mt-4 md:mt-0">
          {['ALL', 'US', 'Europe', 'Asia'].map((region) => (
            <button
              key={region}
              onClick={() => setSelectedRegion(region)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                selectedRegion === region
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {region}
            </button>
          ))}
        </div>
      </div>

      {/* Ticker Grid - All 7 Markets */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">Major Indices Overview</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {indices.map((index) => (
            <div 
              key={index.symbol}
              className="bg-slate-800/60 border border-slate-700/50 p-3 rounded-lg hover:border-slate-600 transition-all"
            >
              <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                <span>{index.name}</span>
                <span className="bg-slate-700 px-1.5 py-0.5 rounded text-[10px]">{index.region}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-200">{index.value}</span>
                <span className={`text-xs font-semibold ${index.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {index.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Breaking News Feed */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">Latest Market Headlines</h3>
        <div className="space-y-3">
          {filteredArticles.map((article) => (
            <a
              key={article.id}
              href={article.url}
              className="block bg-slate-800/40 border border-slate-700/40 p-4 rounded-lg hover:bg-slate-800 transition-all group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h4 className="text-sm font-medium text-slate-100 group-hover:text-blue-400 transition-colors">
                  {article.title}
                </h4>
                <span className={`self-start sm:self-center px-2 py-0.5 text-[10px] uppercase font-bold rounded-full ${
                  article.sentiment === 'bullish' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50' :
                  article.sentiment === 'bearish' ? 'bg-rose-950 text-rose-400 border border-rose-800/50' :
                  'bg-slate-700 text-slate-300'
                }`}>
                  {article.sentiment}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                <span className="font-semibold text-slate-300">{article.source}</span>
                <span>•</span>
                <span>{article.time}</span>
                <span>•</span>
                <span className="text-blue-400 font-medium">Market: {article.category}</span>
              </div>
            </a>
          ))}
        </div>
      </div>

    </div>
  );
};

export default MarketNews;
