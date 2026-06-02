import { createClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';
import { BarChart3, ShoppingBag, MousePointer, Store, TrendingUp, FileText } from 'lucide-react';

export const metadata: Metadata = { title: 'Admin – Analytics' };
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
    const supabase = await createClient();

    // Fetch key metrics in parallel
    const [
        { count: totalProducts },
        { count: totalListings },
        { count: totalClicks },
        { data: topProducts },
        { data: recentRuns },
        { count: totalBlogPosts },
        { count: recentClicks },
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
        supabase.from('blog_posts').select('*', { count: 'exact', head: true }),
        supabase
            .from('clicks')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

    const metrics = [
        { label: 'Produkte',      value: totalProducts  ?? 0, icon: ShoppingBag, color: 'text-blue-600'          },
        { label: 'Listings',      value: totalListings  ?? 0, icon: Store,        color: 'text-emerald-600'       },
        { label: 'Klicks',        value: totalClicks    ?? 0, icon: MousePointer, color: 'text-masala-accent'     },
        { label: 'Blog Posts',    value: totalBlogPosts ?? 0, icon: FileText,     color: 'text-purple-600'        },
        { label: 'Klicks (7 Tage)', value: recentClicks ?? 0, icon: TrendingUp,  color: 'text-masala-accent'     },
    ];

    return (
        <div className="space-y-8 text-masala-text">
            <h1 className="text-2xl font-black text-masala-text">Analytics Dashboard</h1>

            {/* Metric cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {metrics.map((metric) => (
                    <div key={metric.label} className="rounded-xl bg-white border border-masala-border p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-masala-muted border border-masala-border">
                                <metric.icon className={`h-5 w-5 ${metric.color}`} />
                            </div>
                            <span className="text-xs font-bold text-masala-text-muted uppercase tracking-wider">{metric.label}</span>
                        </div>
                        <p className="text-3xl font-black text-masala-text tracking-tight">
                            {metric.value.toLocaleString('de-DE')}
                        </p>
                    </div>
                ))}
            </div>

            {/* Recent scraper runs */}
            <div className="rounded-xl bg-white border border-masala-border p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-base font-bold text-masala-text mb-4">
                    <TrendingUp className="h-5 w-5 text-masala-accent" />
                    Letzte Scraper-Läufe
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-masala-border text-left text-masala-text-muted text-xs uppercase tracking-wider">
                                <th className="pb-3 pr-4 font-bold">Status</th>
                                <th className="pb-3 pr-4 font-bold">Produkte</th>
                                <th className="pb-3 pr-4 font-bold">Gestartet</th>
                                <th className="pb-3 font-bold">Dauer</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-masala-border">
                            {recentRuns?.map((run) => {
                                const duration = run.finished_at && run.started_at
                                    ? Math.round((new Date(run.finished_at).getTime() - new Date(run.started_at).getTime()) / 1000)
                                    : null;

                                return (
                                    <tr key={run.id} className="text-masala-text font-semibold hover:bg-masala-muted/30 transition-colors">
                                        <td className="py-3 pr-4">
                                            <StatusBadge status={run.status} />
                                        </td>
                                        <td className="py-3 pr-4">{run.products_found ?? '–'}</td>
                                        <td className="py-3 pr-4 text-masala-text-muted text-xs font-normal">
                                            {run.started_at
                                                ? new Date(run.started_at).toLocaleString('de-DE')
                                                : '–'}
                                        </td>
                                        <td className="py-3 text-masala-text-muted text-xs font-normal">
                                            {duration != null ? `${duration}s` : '–'}
                                        </td>
                                    </tr>
                                );
                            })}
                            {(!recentRuns || recentRuns.length === 0) && (
                                <tr>
                                    <td colSpan={4} className="py-6 text-center text-masala-text-light text-sm font-medium">
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
        success: { label: 'Erfolgreich', cls: 'bg-emerald-100 border border-emerald-200 text-emerald-800' },
        running: { label: 'Läuft', cls: 'bg-blue-100 border border-blue-200 text-blue-800' },
        error: { label: 'Fehler', cls: 'bg-red-100 border border-red-200 text-red-800' },
        partial: { label: 'Teilweise', cls: 'bg-amber-100 border border-amber-200 text-amber-800' },
    };
    const c = config[status ?? ''] ?? { label: status ?? '–', cls: 'bg-gray-100 border border-gray-200 text-gray-800' };
    return (
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold border ${c.cls}`}>
            {c.label}
        </span>
    );
}
