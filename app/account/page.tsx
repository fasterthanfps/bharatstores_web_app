import { createClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';
import { ShoppingBag, Sparkles, ExternalLink } from 'lucide-react';
import { formatEUR } from '@/lib/utils/currency';
import { getProductPlaceholder } from '@/lib/utils/image';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Suggested Products' };

export default async function AccountPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Fetch user's recent clicks to determine interest
    const { data: userClicks } = await supabase
        .from('clicks')
        .select('listing_id, referrer, listings(product_url, store_name, price, image_url, products(name, slug, image_url, category))')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(100);

    const clickedListingIds = new Set<string>();
    const userCategories = new Set<string>();
    const searchTerms: string[] = [];

    if (userClicks) {
        userClicks.forEach((click) => {
            if (click.listing_id) {
                clickedListingIds.add(click.listing_id);
            }
            const listing = click.listings as any;
            if (listing?.products?.category) {
                userCategories.add(listing.products.category);
            }
            if (click.referrer) {
                const ref = click.referrer.trim();
                if (ref.startsWith('http')) {
                    try {
                        const url = new URL(ref);
                        const q = url.searchParams.get('q');
                        if (q) searchTerms.push(q.toLowerCase());
                    } catch {}
                } else if (ref.length > 2) {
                    searchTerms.push(ref.toLowerCase());
                }
            }
        });
    }

    // 2. Query suggested listings matching interests
    let suggestions: any[] = [];
    const topCategories = Array.from(userCategories);

    if (topCategories.length > 0 || searchTerms.length > 0) {
        let orClauses: string[] = [];
        topCategories.forEach(cat => {
            orClauses.push(`category.eq.${cat}`);
        });

        const uniqueTerms = Array.from(new Set(searchTerms)).slice(0, 3);
        uniqueTerms.forEach(term => {
            const cleanTerm = term.replace(/[^a-zA-Z0-9\s]/g, '').trim();
            if (cleanTerm.length >= 2) {
                orClauses.push(`name.ilike.%${cleanTerm}%`);
            }
        });

        if (orClauses.length > 0) {
            const { data } = await supabase
                .from('listings')
                .select('*, stores(name, logo_url), products!inner(name, slug, category, image_url)')
                .or(orClauses.join(','), { foreignTable: 'products' })
                .limit(50);

            if (data) {
                // Filter out clicked listings and shuffle/take 12
                suggestions = data
                    .filter(item => !clickedListingIds.has(item.id))
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 12);
            }
        }
    }

    // 3. Fallback: if no history or no results match the history, get popular products
    if (suggestions.length === 0) {
        const { data: defaultListings } = await supabase
            .from('listings')
            .select('*, stores(name, logo_url), products!inner(name, slug, category, image_url)')
            .limit(40);

        if (defaultListings) {
            suggestions = defaultListings
                .filter(item => !clickedListingIds.has(item.id))
                .sort(() => Math.random() - 0.5)
                .slice(0, 12);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-serif font-black text-masala-text flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-masala-accent stroke-[2.5]" />
                    Suggested for You
                </h2>
                {suggestions.length > 0 && (
                    <span className="text-xs font-bold text-masala-text-light bg-masala-muted/60 px-3 py-1 rounded-full border border-masala-border/40">
                        Based on your search history
                    </span>
                )}
            </div>

            {suggestions.length === 0 && (
                <div className="text-center py-20 bg-white rounded-3xl border border-masala-border/60 p-8 shadow-sm">
                    <div className="w-16 h-16 bg-masala-muted/60 text-masala-text-light flex items-center justify-center rounded-2xl mx-auto mb-4 border border-masala-border/40">
                        <ShoppingBag className="h-7 w-7" />
                    </div>
                    <h3 className="text-base font-serif font-black text-masala-text mb-1">No suggestions available</h3>
                    <p className="text-masala-text-muted text-xs max-w-sm mx-auto mb-6">
                        Explore more products on our platform to get personalized recommendations!
                    </p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-xs font-bold text-white bg-masala-primary hover:bg-masala-secondary px-5 py-2.5 rounded-xl transition-all shadow-sm shadow-masala-primary/10"
                    >
                        Explore products now
                    </Link>
                </div>
            )}

            {suggestions.length > 0 && (
                <div className="grid gap-3">
                    {suggestions.map((listing) => {
                        const resolvedImage = listing.image_url || listing.products?.image_url || getProductPlaceholder(listing.products?.category, listing.products?.name);

                        return (
                            <div 
                                key={listing.id} 
                                className="bg-white rounded-2xl border border-masala-border/60 p-4 flex items-center justify-between gap-4 hover:border-masala-primary/30 transition-all hover:shadow-md hover:shadow-masala-primary/2 animate-fade-in"
                            >
                                <div className="flex items-center gap-4 min-w-0 flex-1">
                                    {/* Product Image */}
                                    <div className="flex-shrink-0 w-14 h-14 rounded-xl border border-masala-border/40 bg-masala-muted/20 overflow-hidden flex items-center justify-center p-1.5 relative">
                                        <img
                                            src={resolvedImage}
                                            alt={listing.products?.name || 'Product'}
                                            className="w-full h-full object-contain mix-blend-multiply"
                                        />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <span className="text-[10px] font-bold text-masala-accent uppercase tracking-wider">
                                            {listing.products?.category || 'Indian Grocery'}
                                        </span>
                                        {listing.products?.slug ? (
                                            <Link 
                                                href={`/product/${listing.products.slug}`} 
                                                className="font-bold text-masala-text text-sm hover:text-masala-primary transition-colors truncate block"
                                            >
                                                {listing.products.name}
                                            </Link>
                                        ) : (
                                            <span className="font-bold text-masala-text text-sm truncate block">
                                                {listing.products?.name ?? 'Unknown Product'}
                                            </span>
                                        )}
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <span className="inline-block text-[9px] font-extrabold text-masala-primary bg-masala-muted px-2 py-0.5 rounded-md border border-masala-border/30">
                                                {listing.store_name ?? 'Shop'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 flex-shrink-0">
                                    <div className="text-right">
                                        {listing.price && (
                                            <p className="text-sm font-black text-masala-text">
                                                {formatEUR(listing.price)}
                                            </p>
                                        )}
                                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-masala-accent bg-masala-accent/5 px-2 py-0.5 rounded-md border border-masala-accent/20 mt-1">
                                            <Sparkles className="h-2.5 w-2.5 stroke-[2.5]" />
                                            Suggested
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1 border-l border-masala-border/50 pl-4">
                                        {listing.product_url && (
                                            <a
                                                href={listing.product_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2.5 text-masala-text-muted hover:text-masala-primary hover:bg-masala-muted/60 rounded-xl transition-all"
                                                title="Buy on Store"
                                            >
                                                <ExternalLink className="h-4 w-4 stroke-[2.5]" />
                                            </a>
                                        )}
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
