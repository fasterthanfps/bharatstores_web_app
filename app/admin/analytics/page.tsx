'use client';

import { useState, useEffect } from 'react';
import { STORE_CONFIG } from '@/lib/stores';
import { TrendingUp, MousePointerClick, Zap, Smartphone } from 'lucide-react';

type Range = '1d' | '7d' | '30d';

// ── Helpers ────────────────────────────────────────────────────────────────────
async function fetchAnalytics(groupBy: string, range: Range) {
  const res = await fetch(`/api/analytics/clicks?groupBy=${groupBy}&range=${range}`);
  const json = await res.json();
  return json.data;
}

// ── Top Stats Row ──────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="rounded-2xl border p-5 flex flex-col gap-3" style={{ background: '#1C1A17', borderColor: '#2C2820' }}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#6B5E52' }}>{label}</p>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center`} style={{ background: color + '20' }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
      </div>
      <p className="text-3xl font-black leading-none" style={{ fontFamily: 'Fraunces, serif', color: '#FAF7F2' }}>
        {value}
      </p>
      {sub && <p className="text-xs" style={{ color: '#6B5E52' }}>{sub}</p>}
    </div>
  );
}

// ── Clicks By Store (CSS bar chart) ────────────────────────────────────────────
function StoreBarChart({ data }: { data: { storeSlug: string; count: number }[] }) {
  const maxCount = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="space-y-3">
      {data.map(row => {
        const config = Object.entries(STORE_CONFIG).find(([k]) =>
          k === row.storeSlug || row.storeSlug?.includes(k)
        );
        const label = config?.[1].label ?? row.storeSlug;
        const color = config?.[1].textColor ?? '#8B2020';
        const pct   = Math.round((row.count / maxCount) * 100);
        return (
          <div key={row.storeSlug} className="flex items-center gap-3">
            <span className="w-28 text-xs font-bold flex-shrink-0" style={{ color: '#E8E0D4' }}>{label}</span>
            <div className="flex-1 h-6 rounded-xl overflow-hidden" style={{ background: '#2C2820' }}>
              <div
                className="h-full rounded-xl transition-all duration-700"
                style={{ width: `${pct}%`, background: color, minWidth: '8px' }}
              />
            </div>
            <span className="w-12 text-right text-xs font-black tabular-nums" style={{ color: '#9C8E84' }}>
              {row.count.toLocaleString()}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Analytics Page ─────────────────────────────────────────────────────────────
export default function AnalyticsDashboard() {
  const [range, setRange]         = useState<Range>('7d');
  const [summary, setSummary]     = useState<any>(null);
  const [storeData, setStoreData] = useState<any[]>([]);
  const [queryData, setQueryData] = useState<any[]>([]);
  const [deviceData, setDeviceData] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchAnalytics('summary', range),
      fetchAnalytics('store', range),
      fetchAnalytics('query', range),
      fetchAnalytics('device', range),
    ]).then(([s, st, q, d]) => {
      setSummary(s);
      setStoreData(st ?? []);
      setQueryData(q ?? []);
      setDeviceData(d ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [range]);

  const totalClicks  = summary?.totalClicks ?? 0;
  const topStore     = summary?.topStore?.name ?? '—';
  const topQuery     = summary?.topQuery?.query ?? '—';
  const mobilePct    = summary?.mobilePct ?? 0;

  const RANGE_TABS: Range[] = ['1d', '7d', '30d'];

  return (
    <div className="min-h-screen" style={{ background: '#0F0D0B', color: '#E8E0D4' }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-10">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-black" style={{ fontFamily: 'Fraunces, serif', color: '#FAF7F2' }}>
              Click Analytics
            </h1>
            <p className="text-sm mt-1" style={{ color: '#6B5E52' }}>
              Anonymized tracking data · GDPR compliant
            </p>
          </div>
          {/* Range tabs */}
          <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: '#1C1A17', border: '1px solid #2C2820' }}>
            {RANGE_TABS.map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                  range === r ? 'text-white' : ''
                }`}
                style={{
                  background: range === r ? '#8B2020' : 'transparent',
                  color:      range === r ? '#fff'    : '#6B5E52',
                }}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl border h-28 animate-pulse" style={{ background: '#1C1A17', borderColor: '#2C2820' }} />
            ))}
          </div>
        )}

        {!loading && (
          <>
            {/* ── 1. TOP STATS ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Clicks" value={totalClicks.toLocaleString()}
                sub={`Last ${range}`} icon={MousePointerClick} color="#8B2020" />
              <StatCard label="Top Store" value={topStore}
                sub={`${summary?.topStore?.count ?? 0} clicks`} icon={TrendingUp} color="#2563EB" />
              <StatCard label="Top Query" value={topQuery}
                sub={`${summary?.topQuery?.count ?? 0} clicks`} icon={Zap} color="#059669" />
              <StatCard label="Mobile Traffic" value={`${mobilePct}%`}
                sub="vs desktop" icon={Smartphone} color="#7C3AED" />
            </div>

            {/* ── 2. CLICKS BY STORE ── */}
            <div className="rounded-2xl border p-6 space-y-5" style={{ background: '#1C1A17', borderColor: '#2C2820' }}>
              <h2 className="text-sm font-black uppercase tracking-widest" style={{ color: '#9C8E84' }}>
                Clicks by Store
              </h2>
              {storeData.length > 0 ? (
                <StoreBarChart data={storeData} />
              ) : (
                <p className="text-sm py-4 text-center" style={{ color: '#6B5E52' }}>No data yet for this range</p>
              )}
            </div>

            {/* ── 3. TOP SEARCH QUERIES ── */}
            <div className="rounded-2xl border overflow-hidden" style={{ background: '#1C1A17', borderColor: '#2C2820' }}>
              <div className="px-6 py-4 border-b" style={{ borderColor: '#2C2820' }}>
                <h2 className="text-sm font-black uppercase tracking-widest" style={{ color: '#9C8E84' }}>
                  Top Search Queries
                </h2>
              </div>
              {queryData.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr className="border-b" style={{ borderColor: '#2C2820' }}>
                      {['#', 'Query', 'Clicks'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: '#6B5E52' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queryData.slice(0, 10).map((row: any, i: number) => (
                      <tr key={row.query ?? i} className="border-b hover:bg-white/5 transition-colors" style={{ borderColor: '#2C2820' }}>
                        <td className="px-5 py-3 text-xs tabular-nums" style={{ color: '#6B5E52' }}>{i + 1}</td>
                        <td className="px-5 py-3 text-sm font-semibold" style={{ color: '#E8E0D4' }}>{row.query}</td>
                        <td className="px-5 py-3 text-sm font-black tabular-nums" style={{ color: '#8B2020' }}>{row.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm py-6 text-center" style={{ color: '#6B5E52' }}>No query data yet</p>
              )}
            </div>

            {/* ── 4. DEVICE BREAKDOWN ── */}
            <div className="rounded-2xl border p-6" style={{ background: '#1C1A17', borderColor: '#2C2820' }}>
              <h2 className="text-sm font-black uppercase tracking-widest mb-5" style={{ color: '#9C8E84' }}>
                Device Breakdown
              </h2>
              <div className="flex flex-wrap gap-4">
                {(deviceData.length > 0 ? deviceData : [
                  { deviceType: 'mobile', pct: mobilePct, count: 0 },
                  { deviceType: 'desktop', pct: 100 - mobilePct, count: 0 },
                ]).map((d: any) => {
                  const colors: Record<string, string> = { mobile: '#7C3AED', desktop: '#2563EB', tablet: '#059669' };
                  const color = colors[d.deviceType] ?? '#6B5E52';
                  return (
                    <div key={d.deviceType} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: color + '20' }}>
                        <Smartphone className="h-5 w-5" style={{ color }} />
                      </div>
                      <div>
                        <p className="text-xs font-black capitalize" style={{ color: '#E8E0D4' }}>{d.deviceType}</p>
                        <p className="text-2xl font-black leading-tight" style={{ fontFamily: 'Fraunces, serif', color }}>
                          {d.pct ?? 0}%
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
