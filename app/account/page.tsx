import { createClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';
import { ShoppingBag, Clock, ExternalLink } from 'lucide-react';
import { formatEUR } from '@/lib/utils/currency';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Kaufhistorie' };

export default async function AccountPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: clicks } = await supabase
        .from('clicks')
        .select('*, listings(product_url, store_name, price, products(name, slug))')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50);

    return (
        <div>
            <h1 className="text-2xl font-bold text-white mb-8">Kaufhistorie</h1>

            {(!clicks || clicks.length === 0) && (
                <div className="text-center py-20">
                    <ShoppingBag className="h-12 w-12 text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-500">Du hast noch keine Produkte aufgerufen.</p>
                    <Link
                        href="/"
                        className="mt-4 inline-block text-sm text-orange-400 hover:text-orange-300"
                    >
                        Jetzt Produkte entdecken →
                    </Link>
                </div>
            )}

            {clicks && clicks.length > 0 && (
                <div className="space-y-3">
                    {clicks.map((click) => {
                        const listing = click.listings as {
                            product_url: string;
                            store_name: string;
                            price: number;
                            products?: { name: string; slug: string } | null;
                        } | null;

                        return (
                            <div key={click.id} className="glass-card p-4 flex items-center gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl text-xl bg-orange-500/10 flex-shrink-0">
                                    🛒
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-white text-sm truncate">
                                        {listing?.products?.name ?? 'Unbekanntes Produkt'}
                                    </p>
                                    <p className="text-xs text-orange-400">{listing?.store_name}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    {listing?.price && (
                                        <p className="text-sm font-semibold text-white">{formatEUR(listing.price)}</p>
                                    )}
                                    <p className="text-xs text-gray-500 flex items-center gap-1 justify-end">
                                        <Clock className="h-3 w-3" />
                                        {new Date(click.created_at!).toLocaleDateString('de-DE')}
                                    </p>
                                </div>
                                {listing?.product_url && (
                                    <a
                                        href={listing.product_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-shrink-0 p-2 text-gray-600 hover:text-gray-300 transition-colors"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
