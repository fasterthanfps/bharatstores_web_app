'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Play, RefreshCw, CheckCircle, AlertCircle, Clock, Loader2 } from 'lucide-react';
import type { ApiResponse } from '@/types/api';

interface ScraperRun {
    id: string;
    status: string | null;
    products_found: number | null;
    errors: unknown;
    started_at: string | null;
    finished_at: string | null;
}

export default function ScrapersPage() {
    const [triggerQuery, setTriggerQuery] = useState('basmati rice');
    const [triggerResult, setTriggerResult] = useState<string>('');
    const queryClient = useQueryClient();

    const { data, isLoading, refetch } = useQuery<ApiResponse<ScraperRun[]>>({
        queryKey: ['scraper-status'],
        queryFn: () => fetch('/api/scraper/status').then((r) => r.json()),
        refetchInterval: 5000, // Poll every 5s
    });

    const triggerMutation = useMutation({
        mutationFn: async (query: string) => {
            const res = await fetch('/api/scraper/run', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${prompt('Gib den CRON_SECRET ein:')}`,
                },
                body: JSON.stringify({ query }),
            });
            return res.json();
        },
        onSuccess: (data) => {
            setTriggerResult(JSON.stringify(data, null, 2));
            queryClient.invalidateQueries({ queryKey: ['scraper-status'] });
        },
        onError: (err: Error) => {
            setTriggerResult(`Fehler: ${err.message}`);
        },
    });

    const runs = data?.data ?? [];

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold text-white">Scraper-Steuerung</h1>

            {/* Manual trigger */}
            <div className="glass-card p-6 space-y-4">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                    <Play className="h-5 w-5 text-orange-400" />
                    Scraper manuell starten
                </h2>
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={triggerQuery}
                        onChange={(e) => setTriggerQuery(e.target.value)}
                        placeholder="Suchbegriff (z.B. basmati rice)"
                        className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-gray-600 focus:border-orange-500/60 focus:outline-none focus:ring-1 focus:ring-orange-500/30 transition-colors text-sm"
                    />
                    <button
                        onClick={() => triggerMutation.mutate(triggerQuery)}
                        disabled={triggerMutation.isPending}
                        id="trigger-scraper-btn"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold hover:from-orange-400 hover:to-amber-400 disabled:opacity-70 transition-all"
                    >
                        {triggerMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Play className="h-4 w-4" />
                        )}
                        {triggerMutation.isPending ? 'Läuft...' : 'Starten'}
                    </button>
                </div>
                {triggerResult && (
                    <pre className="rounded-xl bg-gray-900 border border-white/5 p-4 text-xs text-gray-300 overflow-auto max-h-48">
                        {triggerResult}
                    </pre>
                )}
            </div>

            {/* Run history */}
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                        <Clock className="h-5 w-5 text-orange-400" />
                        Letzte Läufe
                    </h2>
                    <button
                        onClick={() => refetch()}
                        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                        Aktualisieren
                    </button>
                </div>

                <div className="space-y-3">
                    {runs.map((run) => {
                        const duration = run.finished_at && run.started_at
                            ? Math.round((new Date(run.finished_at).getTime() - new Date(run.started_at).getTime()) / 1000)
                            : null;

                        return (
                            <div key={run.id} className="flex items-center gap-4 rounded-xl bg-white/3 border border-white/5 px-4 py-3">
                                <StatusIcon status={run.status} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-white capitalize">
                                            {run.status ?? 'Unbekannt'}
                                        </span>
                                        {run.products_found != null && (
                                            <span className="text-xs text-gray-500">
                                                · {run.products_found} Produkte
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        {run.started_at
                                            ? new Date(run.started_at).toLocaleString('de-DE')
                                            : '–'}
                                        {duration != null && ` · ${duration}s`}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                    {runs.length === 0 && !isLoading && (
                        <p className="text-center text-gray-600 text-sm py-6">
                            Noch keine Läufe aufgezeichnet.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatusIcon({ status }: { status: string | null }) {
    if (status === 'success') return <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />;
    if (status === 'error') return <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />;
    if (status === 'running') return <Loader2 className="h-5 w-5 text-blue-400 animate-spin flex-shrink-0" />;
    return <Clock className="h-5 w-5 text-amber-400 flex-shrink-0" />;
}
