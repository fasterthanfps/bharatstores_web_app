'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Trash2, CheckCircle, AlertCircle, ExternalLink, Link as LinkIcon } from 'lucide-react';
import { formatEUR } from '@/lib/utils/currency';
import { getProductPlaceholder } from '@/lib/utils/image';
import type { ApiResponse } from '@/types/api';
import Link from 'next/link';

interface Alert {
    id: string;
    target_price: number;
    is_triggered: boolean | null;
    created_at: string | null;
    listings?: {
        product_url: string;
        store_name: string;
        price: number;
        image_url: string | null;
        products?: {
            name: string;
            slug: string;
            category: string;
            image_url: string | null;
        } | null;
    } | null;
}

export default function AlertsPage() {
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery<ApiResponse<Alert[]>>({
        queryKey: ['alerts'],
        queryFn: () => fetch('/api/alerts').then((r) => r.json()),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) =>
            fetch(`/api/alerts?id=${id}`, { method: 'DELETE' }).then((r) => r.json()),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
    });

    const alerts = data?.data ?? [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                    <h2 className="text-lg font-serif font-black text-masala-text">Active Price Alerts</h2>
                    <p className="text-xs text-masala-text-muted mt-0.5">
                        You will be notified by email as soon as a product reaches your target price.
                    </p>
                </div>
                {!isLoading && alerts.length > 0 && (
                    <span className="self-start sm:self-auto text-xs font-bold text-masala-text-light bg-masala-muted/60 px-3 py-1 rounded-full border border-masala-border/40">
                        {alerts.length} {alerts.length === 1 ? 'Alert' : 'Alerts'} Active
                    </span>
                )}
            </div>

            {isLoading && (
                <div className="grid gap-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse bg-white border border-masala-border/60 rounded-2xl p-4 h-20" />
                    ))}
                </div>
            )}

            {!isLoading && alerts.length === 0 && (
                <div className="text-center py-20 bg-white rounded-3xl border border-masala-border/60 p-8 shadow-sm">
                    <div className="w-16 h-16 bg-masala-muted/60 text-masala-text-light flex items-center justify-center rounded-2xl mx-auto mb-4 border border-masala-border/40">
                        <Bell className="h-7 w-7" />
                    </div>
                    <h3 className="text-base font-serif font-black text-masala-text mb-1">No Price Alerts</h3>
                    <p className="text-masala-text-muted text-xs max-w-sm mx-auto mb-6">
                        No price alerts set up yet. Click &quot;Set Price Alert&quot; on any product card.
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-xs font-bold text-white bg-masala-primary hover:bg-masala-secondary px-5 py-2.5 rounded-xl transition-all shadow-sm shadow-masala-primary/10"
                    >
                        Browse Products
                    </Link>
                </div>
            )}

            {alerts.length > 0 && (
                <div className="grid gap-3">
                    {alerts.map((alert) => {
                        const resolvedImage = alert.listings?.image_url || alert.listings?.products?.image_url || getProductPlaceholder(alert.listings?.products?.category, alert.listings?.products?.name);

                        return (
                            <div 
                                key={alert.id} 
                                className="bg-white rounded-2xl border border-masala-border/60 p-4 flex items-center justify-between gap-4 hover:border-masala-primary/30 transition-all hover:shadow-md hover:shadow-masala-primary/2 animate-fade-in"
                            >
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                    {/* Product Image */}
                                    <div className="flex-shrink-0 w-14 h-14 rounded-xl border border-masala-border/40 bg-masala-muted/20 overflow-hidden flex items-center justify-center p-1.5 relative">
                                        <img
                                            src={resolvedImage}
                                            alt={alert.listings?.products?.name || 'Product'}
                                            className="w-full h-full object-contain mix-blend-multiply"
                                        />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-[10px] font-bold text-masala-accent uppercase tracking-wider">
                                                {alert.listings?.products?.category || 'Indian Grocery'}
                                            </span>
                                            <span className="inline-block text-[9px] font-extrabold text-masala-primary bg-masala-muted px-2 py-0.5 rounded-md border border-masala-border/30">
                                                {alert.listings?.store_name ?? 'Shop'}
                                            </span>
                                        </div>

                                        {alert.listings?.products?.slug ? (
                                            <Link 
                                                href={`/product/${alert.listings.products.slug}`} 
                                                className="font-bold text-masala-text text-sm hover:text-masala-primary transition-colors truncate block mt-0.5"
                                            >
                                                {alert.listings.products.name}
                                            </Link>
                                        ) : (
                                            <span className="font-bold text-masala-text text-sm truncate block mt-0.5">
                                                {alert.listings?.products?.name ?? 'Unknown Product'}
                                            </span>
                                        )}

                                        <div className="flex items-center gap-3 mt-1.5 text-xs text-masala-text-muted">
                                            <span>Current: <strong className="text-masala-text font-semibold">{alert.listings?.price ? formatEUR(alert.listings.price) : '—'}</strong></span>
                                            <span className="text-masala-border">•</span>
                                            <span>Target: <strong className="text-masala-primary font-bold">{formatEUR(alert.target_price)}</strong></span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 flex-shrink-0">
                                    <div className="flex flex-col items-end gap-1">
                                        <span
                                            className={`inline-flex items-center gap-1 text-[10px] font-bold rounded-full px-2.5 py-0.5 border ${
                                                alert.is_triggered
                                                    ? 'bg-masala-success-bg text-masala-success border-masala-success/20'
                                                    : 'bg-orange-50 text-orange-600 border-orange-200'
                                            }`}
                                        >
                                            {alert.is_triggered ? (
                                                <>
                                                    <CheckCircle className="h-3 w-3" />
                                                    Triggered
                                                </>
                                            ) : (
                                                <>
                                                    <AlertCircle className="h-3 w-3" />
                                                    Active
                                                </>
                                            )}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1 border-l border-masala-border/50 pl-4">
                                        {alert.listings?.product_url && (
                                            <a
                                                href={alert.listings.product_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2.5 text-masala-text-muted hover:text-masala-primary hover:bg-masala-muted/60 rounded-xl transition-all"
                                                title="View in shop"
                                            >
                                                <ExternalLink className="h-4 w-4 stroke-[2.5]" />
                                            </a>
                                        )}
                                        <button
                                            onClick={() => deleteMutation.mutate(alert.id)}
                                            disabled={deleteMutation.isPending}
                                            className="p-2.5 text-masala-text-muted hover:text-red-600 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                                            title="Delete Alert"
                                        >
                                            <Trash2 className="h-4 w-4 stroke-[2.5]" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
