import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'StockAI - AI Stock Analyzer',
    short_name: 'StockAI',
    description: 'Automated reading of RSI, MACD, and Bollinger Bands.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#020617',
    theme_color: '#2563eb',
    categories: ['finance', 'business', 'productivity'],
    icons: [
      { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icon-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    screenshots: [
      { src: '/screenshots/wide.png', sizes: '1280x800', type: 'image/png', form_factor: 'wide', label: 'StockAI dashboard' },
      { src: '/screenshots/narrow.png', sizes: '390x844', type: 'image/png', form_factor: 'narrow', label: 'StockAI on mobile' },
    ],
  }
}
