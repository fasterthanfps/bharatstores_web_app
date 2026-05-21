'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, Loader2, WifiOff, AlertTriangle, CheckCircle2 } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type ScraperStatus = 'online' | 'slow' | 'error' | 'unknown';
type RunStatus     = 'running' | 'success' | 'error' | 'partial';

interface Store {
    id: string;
    name: string;
    domain: string;
    is_active: boolean;
    scraper_type: string;
}

interface ScraperRun {
    id: string;
    store_id: string | null;
    store_name: string | null;
    status: RunStatus | null;
    products_found: number | null;
    errors: string[] | null;
    started_at: string | null;
    finished_at: string | null;
}

interface StoreViewModel extends Store {
    lastRun: ScraperRun | null;
    computedStatus: ScraperStatus;
    durationMs: number | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(iso: string | null): string {
    if (!iso) return '—';
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
}

function computeStatus(run: ScraperRun | null): ScraperStatus {
    if (!run) return 'unknown';
    if (run.status === 'error') return 'error';
    if (run.status === 'partial') return 'slow';
    if (run.status === 'success' || run.status === 'running') return 'online';
    return 'unknown';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ScraperStatus | RunStatus | null }) {
    const cfg: Record<string, { dot: string; pill: string; label: string }> = {
        online:  { dot: 'bg-emerald-500', pill: 'bg-emerald-500/15 text-emerald-300', label: 'Online' },
        success: { dot: 'bg-emerald-500', pill: 'bg-emerald-500/15 text-emerald-300', label: 'Success' },
        slow:    { dot: 'bg-yellow-500',  pill: 'bg-yellow-500/15  text-yellow-300',  label: 'Partial' },
        partial: { dot: 'bg-yellow-500',  pill: 'bg-yellow-500/15  text-yellow-300',  label: 'Partial' },
        error:   { dot: 'bg-red-500',     pill: 'bg-red-500/15     text-red-300',     label: 'Error'   },
        running: { dot: 'bg-blue-500 animate-pulse', pill: 'bg-blue-500/15 text-blue-300', label: 'Running' },
        unknown: { dot: 'bg-gray-600',   pill: 'bg-gray-700/50    text-gray-500',    label: 'No data' },
    };
    const c = cfg[status ?? 'unknown'] ?? cfg.unknown;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.pill}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
            {c.label}
        </span>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ScrapersDashboard() {
    const [stores, setStores]           = useState<StoreViewModel[]>([]);
    const [recentRuns, setRecentRuns]   = useState<ScraperRun[]>([]);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState<string | null>(null);
    const [triggering, setTriggering]   = useState<string | null>(null); // storeId currently triggering
    const [pollingRun, setPollingRun]   = useState<{ runId: string; storeId: string } | null>(null);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ── Fetch live data from Supabase via API ────────────────────────────────
    const fetchData = useCallback(async () => {
        try {
            const [storesRes, runsRes] = await Promise.all([
                fetch('/api/admin/stores'),
                fetch('/api/admin/scraper-runs'),
            ]);

            if (!storesRes.ok || !runsRes.ok) throw new Error('Failed to load data');

            const storesJson: Store[]      = await storesRes.json();
            const runsJson:   ScraperRun[] = await runsRes.json();

            // Index latest run per store
            const latestRun: Record<string, ScraperRun> = {};
            for (const run of runsJson) {
                const key = run.store_id ?? run.store_name ?? '__global__';
                if (!latestRun[key] || new Date(run.started_at ?? 0) > new Date(latestRun[key].started_at ?? 0)) {
                    latestRun[key] = run;
                }
            }

            const vms: StoreViewModel[] = storesJson.map((s) => {
                const lr = latestRun[s.id] ?? null;
                const dur = lr?.finished_at && lr?.started_at
                    ? new Date(lr.finished_at).getTime() - new Date(lr.started_at).getTime()
                    : null;
                return {
                    ...s,
                    lastRun: lr,
                    computedStatus: computeStatus(lr),
                    durationMs: dur,
                };
            });

            setStores(vms);
            setRecentRuns(runsJson.slice(0, 10));
            setError(null);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Failed to load');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ── Polling for a running scrape ─────────────────────────────────────────
    useEffect(() => {
        if (!pollingRun) {
            if (pollingRef.current) clearInterval(pollingRef.current);
            return;
        }

        pollingRef.current = setInterval(async () => {
            try {
                const res = await fetch(`/api/admin/scraper-status?runId=${pollingRun.runId}`);
                const { run } = await res.json();
                if (run?.status && run.status !== 'running') {
                    setPollingRun(null);
                    setTriggering(null);
                    fetchData();
                }
            } catch { /* ignore */ }
        }, 3000);

        return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
    }, [pollingRun, fetchData]);

    // ── Trigger a per-store rescrape ─────────────────────────────────────────
    async function handleRescrape(store: StoreViewModel) {
        setTriggering(store.id);
        try {
            const res = await fetch('/api/admin/trigger-scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ storeId: store.id, storeName: store.name }),
            });
            const json = await res.json();
            if (json.runId) {
                setPollingRun({ runId: json.runId, storeId: store.id });
                // Refresh immediately so new "running" run appears
                fetchData();
            } else {
                setTriggering(null);
            }
        } catch {
            setTriggering(null);
        }
    }

    // ── Stats ────────────────────────────────────────────────────────────────
    const onlineCount   = stores.filter(s => s.computedStatus === 'online').length;
    const errorCount    = stores.filter(s => s.computedStatus === 'error').length;
    const totalProducts = recentRuns.reduce((a, r) => a + (r.products_found ?? 0), 0);

    const STATS = [
        { label: 'Stores Online',    value: `${onlineCount} / ${stores.length}`, color: 'text-emerald-400' },
        { label: 'Errors',           value: errorCount.toString(),                color: errorCount > 0 ? 'text-red-400' : 'text-emerald-400' },
        { label: 'Products (runs)',  value: totalProducts.toLocaleString(),       color: 'text-blue-400' },
        { label: 'Total Runs',       value: recentRuns.length.toString(),         color: 'text-orange-400' },
    ];

    // ── Render ────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex items-center justify-center py-24 gap-3 text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading scraper data…</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-red-400">
                <WifiOff className="h-8 w-8" />
                <p className="text-sm font-medium">{error}</p>
                <button onClick={fetchData} className="text-xs text-gray-500 hover:text-white transition-colors">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Scraper Health</h1>
                    <p className="text-sm text-gray-500 mt-1">Live store status from <code className="text-orange-400">scraper_runs</code> table</p>
                </div>
                <button
                    onClick={fetchData}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-gray-400 bg-white/5 hover:bg-white/10 hover:text-white transition-all"
                >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Refresh
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {STATS.map((s) => (
                    <div key={s.label} className="glass-card p-5">
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-2">{s.label}</p>
                        <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Store Table */}
            <div className="glass-card overflow-hidden">
                <div className="px-6 py-4 border-b border-white/8">
                    <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-widest">Store Status</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-sm">
                        <thead>
                            <tr className="border-b border-white/8 text-left text-xs text-gray-500 uppercase tracking-wider">
                                {['Store', 'Status', 'Last Run', 'Products', 'Duration', 'Actions'].map(h => (
                                    <th key={h} className="px-5 py-3 font-semibold">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {stores.map((store) => {
                                const isTriggering = triggering === store.id;
                                return (
                                    <tr key={store.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-2.5">
                                                <span className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-300 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                                                    {store.name.slice(0, 2).toUpperCase()}
                                                </span>
                                                <div>
                                                    <p className="font-medium text-white">{store.name}</p>
                                                    <p className="text-[10px] text-gray-600">{store.domain}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3">
                                            {isTriggering
                                                ? <StatusBadge status="running" />
                                                : <StatusBadge status={store.computedStatus} />
                                            }
                                        </td>
                                        <td className="px-5 py-3 text-gray-500 text-xs">
                                            {timeAgo(store.lastRun?.started_at ?? null)}
                                        </td>
                                        <td className="px-5 py-3 text-gray-300 font-semibold">
                                            {store.lastRun?.products_found?.toLocaleString() ?? '—'}
                                        </td>
                                        <td className="px-5 py-3 text-gray-500 text-xs">
                                            {store.durationMs != null ? `${(store.durationMs / 1000).toFixed(1)}s` : '—'}
                                        </td>
                                        <td className="px-5 py-3">
                                            <button
                                                disabled={isTriggering || !!triggering}
                                                onClick={() => handleRescrape(store)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-gray-300 hover:bg-orange-500/20 hover:text-orange-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                {isTriggering
                                                    ? <><Loader2 className="h-3 w-3 animate-spin" /> Running…</>
                                                    : <><RefreshCw className="h-3 w-3" /> Rescrape</>
                                                }
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {stores.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-5 py-10 text-center text-gray-600 text-sm">
                                        No stores found in the database.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recent Runs Log */}
            <div className="glass-card overflow-hidden">
                <div className="px-6 py-4 border-b border-white/8">
                    <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-widest">Recent Scrape Runs</h2>
                </div>
                <div className="divide-y divide-white/5">
                    {recentRuns.map((run) => {
                        const dur = run.finished_at && run.started_at
                            ? ((new Date(run.finished_at).getTime() - new Date(run.started_at).getTime()) / 1000).toFixed(1)
                            : null;
                        return (
                            <div key={run.id} className="flex items-center gap-4 px-6 py-3 text-sm">
                                <StatusBadge status={run.status} />
                                <span className="text-gray-300 font-medium w-32 flex-shrink-0">
                                    {run.store_name ?? 'All stores'}
                                </span>
                                <span className="text-gray-500 text-xs tabular-nums flex-1">
                                    {run.started_at ? new Date(run.started_at).toLocaleString('en-DE') : '—'}
                                </span>
                                <span className="text-gray-500 text-xs w-20 text-right">
                                    {run.products_found != null ? `${run.products_found} products` : ''}
                                </span>
                                <span className="text-gray-600 text-xs w-14 text-right">
                                    {dur ? `${dur}s` : '—'}
                                </span>
                                {run.status === 'error' && run.errors?.length ? (
                                    <div className="flex items-center gap-1 text-red-400 text-xs" title={run.errors[0]}>
                                        <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                                        <span className="truncate max-w-[200px]">{run.errors[0]}</span>
                                    </div>
                                ) : run.status === 'success' ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                                ) : null}
                            </div>
                        );
                    })}
                    {recentRuns.length === 0 && (
                        <div className="px-6 py-10 text-center text-gray-600 text-sm">
                            No scraper runs recorded yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
