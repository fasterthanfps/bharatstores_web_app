'use client';

import { useState, useEffect, useRef } from 'react';
import type { StoreHealth, ScraperLog, ScraperStatusType } from '@/lib/types';

const MOCK_STORES: StoreHealth[] = [
  { id: '1', name: 'Dookan', logoInitials: 'DO', color: '#2563EB', status: 'online', lastScraped: new Date(Date.now() - 1800000).toISOString(), productCount: 1243, avgResponseMs: 820, errorRate: 0.2 },
  { id: '2', name: 'Jamoona', logoInitials: 'JA', color: '#7C3AED', status: 'online', lastScraped: new Date(Date.now() - 3600000).toISOString(), productCount: 876, avgResponseMs: 1100, errorRate: 0.5 },
  { id: '3', name: 'Swadesh', logoInitials: 'SW', color: '#DC2626', status: 'slow', lastScraped: new Date(Date.now() - 7200000).toISOString(), productCount: 542, avgResponseMs: 6200, errorRate: 1.2 },
  { id: '4', name: 'Grocera', logoInitials: 'GR', color: '#059669', status: 'online', lastScraped: new Date(Date.now() - 900000).toISOString(), productCount: 2100, avgResponseMs: 440, errorRate: 0.0 },
  { id: '5', name: 'Angaadi', logoInitials: 'AN', color: '#EA580C', status: 'error', lastScraped: new Date(Date.now() - 86400000).toISOString(), productCount: 198, avgResponseMs: 0, errorRate: 100, lastErrorMsg: 'Connection timeout after 30s' },
  { id: '6', name: 'Little India', logoInitials: 'LI', color: '#B45309', status: 'online', lastScraped: new Date(Date.now() - 5400000).toISOString(), productCount: 721, avgResponseMs: 980, errorRate: 0.8 },
  { id: '7', name: 'Spice Village', logoInitials: 'SV', color: '#0891B2', status: 'online', lastScraped: new Date(Date.now() - 10800000).toISOString(), productCount: 389, avgResponseMs: 1340, errorRate: 0.3 },
  { id: '8', name: 'Namma Markt', logoInitials: 'NM', color: '#65A30D', status: 'online', lastScraped: new Date(Date.now() - 14400000).toISOString(), productCount: 623, avgResponseMs: 760, errorRate: 0.1 },
];

const MOCK_LOGS: ScraperLog[] = [
  { id: '1', timestamp: new Date(Date.now() - 120000).toISOString(), store: 'Grocera', status: 'success', message: 'Scrape complete', productCount: 2100, durationMs: 440 },
  { id: '2', timestamp: new Date(Date.now() - 300000).toISOString(), store: 'Dookan', status: 'success', message: 'Scrape complete', productCount: 1243, durationMs: 820 },
  { id: '3', timestamp: new Date(Date.now() - 600000).toISOString(), store: 'Angaadi', status: 'error', message: 'Connection timeout after 30s', durationMs: 30000 },
  { id: '4', timestamp: new Date(Date.now() - 900000).toISOString(), store: 'Swadesh', status: 'warning', message: 'Slow response (6.2s)', productCount: 542, durationMs: 6200 },
  { id: '5', timestamp: new Date(Date.now() - 1800000).toISOString(), store: 'Jamoona', status: 'success', message: 'Scrape complete', productCount: 876, durationMs: 1100 },
];

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function StatusBadge({ status, errorMsg }: { status: ScraperStatusType; errorMsg?: string }) {
  const cfg = {
    online: { cls: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', label: 'Online' },
    error: { cls: 'bg-red-100 text-red-700', dot: 'bg-red-500', label: 'Error' },
    slow: { cls: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500', label: 'Slow' },
  }[status];

  return (
    <div className="relative group flex items-center gap-1.5">
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.cls}`}>
        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
        {cfg.label}
      </span>
      {errorMsg && (
        <div className="absolute left-0 top-full mt-1 z-10 hidden group-hover:block bg-masala-text text-white text-xs rounded-xl px-3 py-2 w-48 shadow-xl">
          {errorMsg}
        </div>
      )}
    </div>
  );
}

export default function ScrapersDashboard() {
  const [stores, setStores] = useState(MOCK_STORES);
  const [logs, setLogs] = useState(MOCK_LOGS);
  const [countdown, setCountdown] = useState(30);
  const [lastSync, setLastSync] = useState(new Date().toISOString());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          setLastSync(new Date().toISOString());
          return 30;
        }
        return c - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const onlineCount = stores.filter(s => s.status === 'online').length;
  const errorCount = stores.filter(s => s.status === 'error').length;
  const totalProducts = stores.reduce((a, s) => a + s.productCount, 0);
  const avgDuration = Math.round(stores.filter(s => s.avgResponseMs > 0).reduce((a, s) => a + s.avgResponseMs, 0) / stores.filter(s => s.avgResponseMs > 0).length);

  const STATS = [
    { label: 'Total Products', value: totalProducts.toLocaleString(), color: 'text-emerald-400' },
    { label: 'Stores Online', value: `${onlineCount} / ${stores.length}`, color: 'text-blue-400' },
    { label: 'Avg Response', value: `${avgDuration}ms`, color: 'text-yellow-400' },
    { label: 'Errors (24h)', value: errorCount.toString(), color: errorCount > 0 ? 'text-red-400' : 'text-emerald-400' },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#0F0D0B', color: '#E8E0D4' }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black" style={{ fontFamily: 'Fraunces, serif', color: '#FAF7F2' }}>
              Scraper Health Dashboard
            </h1>
            <p className="text-sm mt-1" style={{ color: '#6B5E52' }}>
              Last sync: {timeAgo(lastSync)} · Auto-refresh in {countdown}s
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: '#6B5E52' }}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {STATS.map((stat) => (
            <div key={stat.label} className="rounded-2xl p-5 border" style={{ background: '#1C1A17', borderColor: '#2C2820' }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#6B5E52' }}>{stat.label}</p>
              <p className={`text-3xl font-black ${stat.color}`} style={{ fontFamily: 'Fraunces, serif' }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Store Table */}
        <div className="rounded-2xl border overflow-hidden mb-8" style={{ background: '#1C1A17', borderColor: '#2C2820' }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: '#2C2820' }}>
            <h2 className="font-black text-sm uppercase tracking-widest" style={{ color: '#9C8E84' }}>Store Status</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b" style={{ borderColor: '#2C2820' }}>
                  {['Store', 'Status', 'Last Scraped', 'Products', 'Avg Response', 'Error Rate', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: '#6B5E52' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stores.map((store) => (
                  <tr key={store.id} className="border-b transition-colors hover:bg-white/5" style={{ borderColor: '#2C2820' }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg text-white text-[10px] font-black flex items-center justify-center flex-shrink-0" style={{ backgroundColor: store.color }}>
                          {store.logoInitials}
                        </span>
                        <span className="text-sm font-semibold" style={{ color: '#E8E0D4' }}>{store.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={store.status} errorMsg={store.lastErrorMsg} />
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#6B5E52' }}>{timeAgo(store.lastScraped)}</td>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: '#E8E0D4' }}>{store.productCount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: store.avgResponseMs > 5000 ? '#FBBF24' : '#6B5E52' }}>
                      {store.avgResponseMs > 0 ? `${store.avgResponseMs}ms` : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: store.errorRate > 5 ? '#F87171' : '#6B5E52' }}>
                      {store.errorRate.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          setLogs(prev => [{
                            id: Date.now().toString(),
                            timestamp: new Date().toISOString(),
                            store: store.name,
                            status: 'success',
                            message: 'Manual rescrape triggered',
                          }, ...prev.slice(0, 9)]);
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold transition-colors"
                        style={{ background: '#2C2820', color: '#E8E0D4', border: '1px solid #3C3830' }}
                      >
                        Rescrape
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Log */}
        <div className="rounded-2xl border overflow-hidden" style={{ background: '#1C1A17', borderColor: '#2C2820' }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: '#2C2820' }}>
            <h2 className="font-black text-sm uppercase tracking-widest" style={{ color: '#9C8E84' }}>Recent Scrape Events</h2>
          </div>
          <div className="p-4 space-y-2 font-mono text-xs">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 px-3 py-2 rounded-xl" style={{ background: '#0F0D0B' }}>
                <span style={{ color: '#6B5E52' }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                <span className="font-bold" style={{ color: '#9C8E84', minWidth: '90px' }}>[{log.store}]</span>
                <span className={log.status === 'success' ? 'text-emerald-400' : log.status === 'error' ? 'text-red-400' : 'text-yellow-400'}>
                  {log.message}
                </span>
                {log.productCount !== undefined && (
                  <span style={{ color: '#6B5E52' }}>· {log.productCount} products</span>
                )}
                {log.durationMs !== undefined && (
                  <span style={{ color: '#6B5E52' }}>· {log.durationMs}ms</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
