import { createClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';
import { ShoppingBag, Sparkles, ChevronRight } from 'lucide-react';
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
                suggestions = data
                    .filter(item => !clickedListingIds.has(item.id))
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 12);
            }
        }
    }

    // 3. Fallback: popular products
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
        <div className="space-y-4 sm:space-y-6">
            {/* FIX 6 — Section heading: smaller + inline subtitle */}
            <div className="flex items-center justify-between mb-2 sm:mb-4">
                <h2
                    className="text-lg sm:text-2xl font-black text-masala-text flex items-center gap-2"
                    style={{ fontFamily: 'Fraunces, serif' }}
                >
                    <Sparkles className="h-5 w-5 text-masala-accent stroke-[2.5]" />
                    Suggested for You
                </h2>
                <span className="text-[10px] text-masala-text-muted font-medium flex-shrink-0 ml-2">
                    From your searches
                </span>
            </div>

            {suggestions.length === 0 && (
                <div className="text-center py-16 sm:py-20 bg-white rounded-3xl border border-masala-border/60 p-6 sm:p-8 shadow-sm">
                    <div className="w-16 h-16 bg-masala-muted/60 text-masala-text-light flex items-center justify-center rounded-2xl mx-auto mb-4 border border-masala-border/40">
                        <ShoppingBag className="h-7 w-7" />
                    </div>
                    <h3 className="text-base font-black text-masala-text mb-1" style={{ fontFamily: 'Fraunces, serif' }}>
                        No suggestions available
                    </h3>
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

            {/* FIX 7 — Full-width horizontal list on mobile, grid on sm+ */}
            {suggestions.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {suggestions.map((listing) => {
                        const resolvedImage = listing.image_url || listing.products?.image_url || getProductPlaceholder(listing.products?.category, listing.products?.name);

                        return (
                            <div
                                key={listing.id}
                                className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-masala-border hover:border-masala-primary/20 transition-all animate-fade-in"
                            >
                                {/* Product image */}
                                <div className="w-14 h-14 flex-shrink-0 rounded-xl bg-masala-muted/40 flex items-center justify-center overflow-hidden border border-masala-border/40">
                                    <img
                                        src={resolvedImage}
                                        alt={listing.products?.name || 'Product'}
                                        className="w-full h-full object-contain p-1 mix-blend-multiply"
                                    />
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold uppercase text-masala-text-muted mb-0.5 truncate">
                                        {listing.products?.category || 'Indian Grocery'} · {listing.store_name ?? 'Shop'}
                                    </p>
                                    {listing.products?.slug ? (
                                        <Link
                                            href={`/product/${listing.products.slug}`}
                                            className="text-sm font-semibold text-masala-text hover:text-masala-primary transition-colors line-clamp-2 leading-snug block"
                                        >
                                            {listing.products.name}
                                        </Link>
                                    ) : (
                                        <span className="text-sm font-semibold text-masala-text line-clamp-2 leading-snug block">
                                            {listing.products?.name ?? 'Unknown Product'}
                                        </span>
                                    )}
                                    {listing.price && (
                                        <p className="text-sm font-black text-masala-primary mt-1">
                                            {formatEUR(listing.price)}
                                        </p>
                                    )}
                                </div>

                                <ChevronRight className="w-4 h-4 text-masala-text-muted flex-shrink-0" />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
