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
        online:  { dot: 'bg-emerald-500', pill: 'bg-emerald-50 border border-emerald-200 text-emerald-800', label: 'Online' },
        success: { dot: 'bg-emerald-500', pill: 'bg-emerald-50 border border-emerald-200 text-emerald-800', label: 'Success' },
        slow:    { dot: 'bg-yellow-500',  pill: 'bg-yellow-50 border border-yellow-200 text-yellow-800',   label: 'Partial' },
        partial: { dot: 'bg-yellow-500',  pill: 'bg-yellow-50 border border-yellow-200 text-yellow-800',   label: 'Partial' },
        error:   { dot: 'bg-red-500',     pill: 'bg-red-50 border border-red-200 text-red-800',           label: 'Error'   },
        running: { dot: 'bg-blue-500 animate-pulse', pill: 'bg-blue-50 border border-blue-200 text-blue-800', label: 'Running' },
        unknown: { dot: 'bg-gray-400',   pill: 'bg-gray-50 border border-gray-200 text-gray-600',         label: 'No data' },
    };
    const c = cfg[status ?? 'unknown'] ?? cfg.unknown;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${c.pill}`}>
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
    const [triggering, setTriggering]   = useState<string | null>(null);
    const [pollingRun, setPollingRun]   = useState<{ runId: string; storeId: string } | null>(null);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [diagnosing, setDiagnosing]   = useState(false);
    const [diagnosticsReport, setDiagnosticsReport] = useState<any[] | null>(null);

    const fetchData = useCallback(async () => {
        try {
            const [storesRes, runsRes] = await Promise.all([
                fetch('/api/admin/stores'),
                fetch('/api/admin/scraper-runs'),
            ]);

            if (!storesRes.ok || !runsRes.ok) throw new Error('Failed to load data');

            const storesJson: Store[]      = await storesRes.json();
            const runsJson:   ScraperRun[] = await runsRes.json();

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
                fetchData();
            } else {
                setTriggering(null);
            }
        } catch {
            setTriggering(null);
        }
    }

    async function handleRunDiagnostics() {
        setDiagnosing(true);
        setDiagnosticsReport(null);
        try {
            const res = await fetch('/api/admin/diagnose', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const json = await res.json();
            if (json.success) {
                setDiagnosticsReport(json.reports);
                fetchData();
            } else {
                alert('Diagnostics failed: ' + (json.error || 'Unknown error'));
            }
        } catch (e: any) {
            alert('Diagnostics failed: ' + e.message);
        } finally {
            setDiagnosing(false);
        }
    }

    const onlineCount   = stores.filter(s => s.computedStatus === 'online').length;
    const errorCount    = stores.filter(s => s.computedStatus === 'error').length;
    const totalProducts = recentRuns.reduce((a, r) => a + (r.products_found ?? 0), 0);

    const STATS = [
        { label: 'Stores Online',    value: `${onlineCount} / ${stores.length}`, color: 'text-emerald-700' },
        { label: 'Errors',           value: errorCount.toString(),                color: errorCount > 0 ? 'text-red-700' : 'text-emerald-700' },
        { label: 'Products (runs)',  value: totalProducts.toLocaleString(),       color: 'text-blue-700' },
        { label: 'Total Runs',       value: recentRuns.length.toString(),         color: 'text-masala-accent' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24 gap-3 text-masala-text-muted">
                <Loader2 className="h-5 w-5 animate-spin text-masala-accent" />
                <span className="text-sm font-semibold">Loading scraper data…</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-red-600">
                <WifiOff className="h-8 w-8" />
                <p className="text-sm font-bold">{error}</p>
                <button onClick={fetchData} className="text-xs text-masala-text-muted hover:text-masala-text transition-colors">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 text-masala-text">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-black text-masala-text">Scraper Health</h1>
                    <p className="text-xs text-masala-text-muted mt-1">Live store status from <code className="text-masala-accent font-bold">scraper_runs</code> table</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        disabled={diagnosing || !!triggering}
                        onClick={handleRunDiagnostics}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-masala-accent/10 text-masala-accent border border-masala-accent/30 hover:bg-masala-accent/25 transition-all disabled:opacity-55 disabled:cursor-not-allowed"
                    >
                        {diagnosing ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Diagnosing...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Run Selector Tests
                            </>
                        )}
                    </button>
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-masala-text-muted bg-white border border-masala-border hover:bg-masala-muted hover:text-masala-text transition-all shadow-sm"
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {STATS.map((s) => (
                    <div key={s.label} className="rounded-xl bg-white border border-masala-border p-5 shadow-sm">
                        <p className="text-[10px] text-masala-text-muted uppercase tracking-wider font-extrabold mb-2">{s.label}</p>
                        <p className={`text-3xl font-black ${s.color} tracking-tight`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Diagnostics Report Panel */}
            {diagnosticsReport && (
                <div className="rounded-xl bg-white border border-masala-accent/30 p-6 space-y-4 shadow-md">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-masala-accent animate-pulse" />
                            <h2 className="text-sm font-bold text-masala-text uppercase tracking-wide">Scraper Selector Diagnostic Test Results</h2>
                        </div>
                        <button 
                            onClick={() => setDiagnosticsReport(null)}
                            className="text-xs text-masala-text-muted hover:text-masala-text font-bold transition-colors"
                        >
                            ✕ Dismiss
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {diagnosticsReport.map((report) => {
                            const isHealthy = report.status === 'healthy';
                            return (
                                <div 
                                    key={report.storeId} 
                                    className={`p-4 rounded-xl border ${
                                        isHealthy 
                                            ? 'bg-emerald-50/20 border-emerald-200' 
                                            : 'bg-red-50/20 border-red-200'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-bold text-masala-text text-sm">{report.storeName}</h3>
                                        <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full border ${
                                            isHealthy ? 'bg-emerald-100 border-emerald-200 text-emerald-800' : 'bg-red-100 border-red-200 text-red-800'
                                        }`}>
                                            {report.status}
                                        </span>
                                    </div>
                                    <div className="space-y-1 text-xs text-masala-text-muted">
                                        <div className="flex justify-between">
                                            <span>Latency:</span>
                                            <span className="font-bold text-masala-text">{report.latencyMs.toLocaleString()}ms</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Items Parsed:</span>
                                            <span className="font-bold text-masala-text">{report.itemCount}</span>
                                        </div>
                                    </div>
                                    {report.errors.length > 0 && (
                                        <div className="mt-3 pt-2.5 border-t border-red-200 space-y-1">
                                            <p className="text-[9px] uppercase tracking-wider font-extrabold text-red-700">Selector Errors:</p>
                                            {report.errors.map((err: string, i: number) => (
                                                <div key={i} className="flex gap-1.5 text-xs text-red-600 leading-tight">
                                                    <span className="text-red-700 font-bold">•</span>
                                                    <span>{err}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Store Table */}
            <div className="rounded-xl bg-white border border-masala-border overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-masala-border bg-masala-bg/20">
                    <h2 className="text-xs font-bold text-masala-text uppercase tracking-widest">Store Status</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px] text-sm">
                        <thead>
                            <tr className="border-b border-masala-border text-left text-xs text-masala-text-muted uppercase tracking-wider bg-masala-muted/30">
                                {['Store', 'Status', 'Last Run', 'Products', 'Duration', 'Actions'].map(h => (
                                    <th key={h} className="px-5 py-3.5 font-bold">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-masala-border">
                            {stores.map((store) => {
                                const isTriggering = triggering === store.id;
                                return (
                                    <tr key={store.id} className="hover:bg-masala-muted/20 transition-colors">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-2.5">
                                                <span className="w-7 h-7 rounded-lg bg-masala-primary/10 text-masala-primary text-[10px] font-extrabold flex items-center justify-center flex-shrink-0">
                                                    {store.name.slice(0, 2).toUpperCase()}
                                                </span>
                                                <div>
                                                    <p className="font-bold text-masala-text">{store.name}</p>
                                                    <p className="text-[10px] text-masala-text-light">{store.domain}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3">
                                            {isTriggering
                                                ? <StatusBadge status="running" />
                                                : <StatusBadge status={store.computedStatus} />
                                            }
                                        </td>
                                        <td className="px-5 py-3 text-masala-text-muted text-xs font-medium">
                                            {timeAgo(store.lastRun?.started_at ?? null)}
                                        </td>
                                        <td className="px-5 py-3 text-masala-text font-bold">
                                            {store.lastRun?.products_found?.toLocaleString() ?? '—'}
                                        </td>
                                        <td className="px-5 py-3 text-masala-text-muted text-xs font-medium">
                                            {store.durationMs != null ? `${(store.durationMs / 1000).toFixed(1)}s` : '—'}
                                        </td>
                                        <td className="px-5 py-3">
                                            <button
                                                disabled={isTriggering || !!triggering}
                                                onClick={() => handleRescrape(store)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-masala-border text-masala-text-muted hover:bg-masala-muted hover:text-masala-text transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
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
                                    <td colSpan={6} className="px-5 py-10 text-center text-masala-text-light text-sm font-bold">
                                        No stores found in the database.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recent Runs Log */}
            <div className="rounded-xl bg-white border border-masala-border overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-masala-border bg-masala-bg/20">
                    <h2 className="text-xs font-bold text-masala-text uppercase tracking-widest">Recent Scrape Runs</h2>
                </div>
                <div className="divide-y divide-masala-border">
                    {recentRuns.map((run) => {
                        const dur = run.finished_at && run.started_at
                            ? ((new Date(run.finished_at).getTime() - new Date(run.started_at).getTime()) / 1000).toFixed(1)
                            : null;
                        return (
                            <div key={run.id} className="flex items-center gap-4 px-6 py-3.5 text-sm hover:bg-masala-muted/10 transition-colors">
                                <StatusBadge status={run.status} />
                                <span className="text-masala-text font-bold w-32 flex-shrink-0">
                                    {run.store_name ?? 'All stores'}
                                </span>
                                <span className="text-masala-text-muted text-xs tabular-nums flex-1 font-medium">
                                    {run.started_at ? new Date(run.started_at).toLocaleString('en-DE') : '—'}
                                </span>
                                <span className="text-masala-text font-bold text-xs w-20 text-right">
                                    {run.products_found != null ? `${run.products_found} products` : ''}
                                </span>
                                <span className="text-masala-text-muted text-xs w-14 text-right font-medium">
                                    {dur ? `${dur}s` : '—'}
                                </span>
                                {run.status === 'error' && run.errors?.length ? (
                                    <div className="flex items-center gap-1 text-red-600 text-xs font-bold" title={run.errors[0]}>
                                        <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-red-600" />
                                        <span className="truncate max-w-[200px]">{run.errors[0]}</span>
                                    </div>
                                ) : run.status === 'success' ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                                ) : null}
                            </div>
                        );
                    })}
                    {recentRuns.length === 0 && (
                        <div className="px-6 py-10 text-center text-masala-text-light text-sm font-bold">
                            No scraper runs recorded yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
