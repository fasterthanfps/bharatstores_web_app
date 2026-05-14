import { createClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';
import { BarChart3, ShoppingBag, MousePointer, Store, TrendingUp } from 'lucide-react';
import { formatEUR } from '@/lib/utils/currency';

export const metadata: Metadata = { title: 'Admin – Analytics' };

export default async function AdminPage() {
    const supabase = await createClient();

    // Fetch key metrics in parallel
    const [
        { count: totalProducts },
        { count: totalListings },
        { count: totalClicks },
        { data: topProducts },
        { data: recentRuns },
    ] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('listings').select('*', { count: 'exact', head: true }),
        supabase.from('clicks').select('*', { count: 'exact', head: true }),
        supabase
            .from('clicks')
            .select('listing_id, listings(products(name))')
            .eq('converted', true)
            .limit(5),
        supabase
            .from('scraper_runs')
            .select('*')
            .order('started_at', { ascending: false })
            .limit(5),
    ]);

    const metrics = [
        { label: 'Produkte', value: totalProducts ?? 0, icon: ShoppingBag, color: 'text-blue-400' },
        { label: 'Listings', value: totalListings ?? 0, icon: Store, color: 'text-emerald-400' },
        { label: 'Klicks', value: totalClicks ?? 0, icon: MousePointer, color: 'text-orange-400' },
    ];

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>

            {/* Metric cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {metrics.map((metric) => (
                    <div key={metric.label} className="glass-card p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
                                <metric.icon className={`h-5 w-5 ${metric.color}`} />
                            </div>
                            <span className="text-sm text-gray-400">{metric.label}</span>
                        </div>
                        <p className="text-3xl font-bold text-white">
                            {metric.value.toLocaleString('de-DE')}
                        </p>
                    </div>
                ))}
            </div>

            {/* Recent scraper runs */}
            <div className="glass-card p-6">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
                    <TrendingUp className="h-5 w-5 text-orange-400" />
                    Letzte Scraper-Läufe
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/8 text-left text-gray-500 text-xs uppercase tracking-wider">
                                <th className="pb-3 pr-4">Status</th>
                                <th className="pb-3 pr-4">Produkte</th>
                                <th className="pb-3 pr-4">Gestartet</th>
                                <th className="pb-3">Dauer</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {recentRuns?.map((run) => {
                                const duration = run.finished_at && run.started_at
                                    ? Math.round((new Date(run.finished_at).getTime() - new Date(run.started_at).getTime()) / 1000)
                                    : null;

                                return (
                                    <tr key={run.id} className="text-gray-300">
                                        <td className="py-3 pr-4">
                                            <StatusBadge status={run.status} />
                                        </td>
                                        <td className="py-3 pr-4">{run.products_found ?? '–'}</td>
                                        <td className="py-3 pr-4 text-gray-500 text-xs">
                                            {run.started_at
                                                ? new Date(run.started_at).toLocaleString('de-DE')
                                                : '–'}
                                        </td>
                                        <td className="py-3 text-gray-500 text-xs">
                                            {duration != null ? `${duration}s` : '–'}
                                        </td>
                                    </tr>
                                );
                            })}
                            {(!recentRuns || recentRuns.length === 0) && (
                                <tr>
                                    <td colSpan={4} className="py-6 text-center text-gray-600 text-sm">
                                        Noch keine Scraper-Läufe aufgezeichnet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string | null }) {
    const config: Record<string, { label: string; cls: string }> = {
        success: { label: 'Erfolgreich', cls: 'bg-emerald-500/15 text-emerald-400' },
        running: { label: 'Läuft', cls: 'bg-blue-500/15 text-blue-400' },
        error: { label: 'Fehler', cls: 'bg-red-500/15 text-red-400' },
        partial: { label: 'Teilweise', cls: 'bg-amber-500/15 text-amber-400' },
    };
    const c = config[status ?? ''] ?? { label: status ?? '–', cls: 'bg-gray-500/15 text-gray-400' };
    return (
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${c.cls}`}>
            {c.label}
        </span>
    );
}
