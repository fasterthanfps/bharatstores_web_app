'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { formatEUR } from '@/lib/utils/currency';
import type { ApiResponse } from '@/types/api';

interface Alert {
    id: string;
    target_price: number;
    is_triggered: boolean | null;
    created_at: string | null;
    listings?: {
        product_url: string;
        store_name: string;
        price: number;
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
        <div>
            <h1 className="text-2xl font-bold text-white mb-2">Preisalarme</h1>
            <p className="text-sm text-gray-400 mb-8">
                Du wirst benachrichtigt, wenn ein Produkt deinen Wunschpreis erreicht.
            </p>

            {isLoading && (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="skeleton h-20 rounded-2xl" />
                    ))}
                </div>
            )}

            {!isLoading && alerts.length === 0 && (
                <div className="text-center py-20">
                    <Bell className="h-12 w-12 text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-500">Noch keine Preisalarme eingerichtet.</p>
                    <p className="text-sm text-gray-600 mt-2">
                        Klicke auf einem Produkt auf „Preisalarm einrichten".
                    </p>
                </div>
            )}

            {alerts.length > 0 && (
                <div className="space-y-3">
                    {alerts.map((alert) => (
                        <div key={alert.id} className="glass-card p-4 flex items-center gap-4">
                            <div className="flex-shrink-0">
                                {alert.is_triggered ? (
                                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                                ) : (
                                    <AlertCircle className="h-5 w-5 text-orange-400" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-300 truncate">
                                    {alert.listings?.store_name ?? 'Shop'}
                                </p>
                                <p className="text-xs text-gray-500">
                                    Aktuell:{' '}
                                    {alert.listings?.price ? formatEUR(alert.listings.price) : '—'}
                                    {' · '}Ziel: <strong className="text-orange-400">{formatEUR(alert.target_price)}</strong>
                                </p>
                            </div>
                            <span
                                className={`text-xs rounded-full px-2 py-0.5 ${alert.is_triggered
                                        ? 'bg-emerald-500/15 text-emerald-400'
                                        : 'bg-orange-500/15 text-orange-400'
                                    }`}
                            >
                                {alert.is_triggered ? 'Ausgelöst' : 'Aktiv'}
                            </span>
                            <button
                                onClick={() => deleteMutation.mutate(alert.id)}
                                disabled={deleteMutation.isPending}
                                className="flex-shrink-0 p-2 text-gray-600 hover:text-red-400 transition-colors"
                                title="Alarm löschen"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
