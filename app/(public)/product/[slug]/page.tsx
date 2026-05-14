import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Package, ArrowLeft, TrendingUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import ComparisonGrid from '@/components/comparison/ComparisonGrid';
import PriceHistoryChart from '@/components/product/PriceHistoryChart';
import type { ListingWithStore } from '@/types/api';

interface ProductPageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
    const { slug } = await params;
    const supabase = await createClient();

    const { data: product } = await supabase
        .from('products')
        .select('name, category')
        .eq('slug', slug)
        .maybeSingle();

    if (!product) return { title: 'Produkt nicht gefunden' };

    return {
        title: `${product.name} – Preisvergleich`,
        description: `Vergleiche Preise für ${product.name} bei Grocera, Jamoona und Little India.`,
    };
}

export default async function ProductPage({ params }: ProductPageProps) {
    const { slug } = await params;
    const supabase = await createClient();

    // Fetch product
    const { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

    if (!product) notFound();

    // Fetch listings for this product
    const { data: rawListings } = await supabase
        .from('listings')
        .select('*, stores(id, name, logo_url)')
        .eq('product_id', product.id)
        .order('price', { ascending: true });

    const listings: ListingWithStore[] = (rawListings ?? []).map((l) => {
        const store = l.stores as { id: string; name: string; logo_url: string | null } | null;
        return {
            ...l,
            stores: undefined,
            store_logo_url: store?.logo_url ?? null,
            product_name: product.name,
            product_slug: product.slug,
            product_category: product.category,
        } as ListingWithStore;
    });

    // Fetch price history for the first listing (cheapest)
    const cheapestListingId = listings[0]?.id;
    let priceHistory: Array<{ recorded_at: string; price: number; availability: string }> = [];

    if (cheapestListingId) {
        const { data: history } = await supabase
            .from('price_history')
            .select('recorded_at, price, availability')
            .eq('listing_id', cheapestListingId)
            .order('recorded_at', { ascending: true })
            .limit(60);
        priceHistory = (history ?? [])
            .filter((h) => h.recorded_at !== null)
            .map((h) => ({
                recorded_at: h.recorded_at as string,
                price: h.price,
                availability: h.availability,
            }));
    }

    const lowestPrice = listings[0]?.price ?? 0;
    const highestPrice = listings[listings.length - 1]?.price ?? 0;

    return (
        <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8">
            <div className="mx-auto max-w-4xl space-y-8">
                {/* Back link */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Zurück zur Suche
                </Link>

                {/* Product header */}
                <div className="glass-card p-6 flex gap-5 flex-wrap">
                    <div className="flex-shrink-0 w-24 h-24 rounded-2xl bg-white/5 border border-white/8 overflow-hidden flex items-center justify-center">
                        {product.image_url ? (
                            <Image
                                src={product.image_url}
                                alt={product.name}
                                width={96}
                                height={96}
                                className="object-contain"
                                unoptimized
                            />
                        ) : (
                            <Package className="h-10 w-10 text-gray-600" />
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <span className="text-xs uppercase tracking-wider text-orange-400 font-medium">
                            {product.category}
                        </span>
                        <h1 className="text-2xl font-bold text-white mt-1">{product.name}</h1>
                        {product.brand && (
                            <p className="text-sm text-gray-400 mt-1">{product.brand}</p>
                        )}

                        <div className="flex items-center gap-6 mt-4">
                            <div>
                                <p className="text-xs text-gray-500">Ab</p>
                                <p className="text-xl font-bold text-orange-400">
                                    {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(lowestPrice)}
                                </p>
                            </div>
                            {highestPrice > lowestPrice && (
                                <div>
                                    <p className="text-xs text-gray-500">Bis</p>
                                    <p className="text-lg font-semibold text-gray-300">
                                        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(highestPrice)}
                                    </p>
                                </div>
                            )}
                            <div>
                                <p className="text-xs text-gray-500">Shops</p>
                                <p className="text-lg font-semibold text-white">{listings.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Price History Chart */}
                {priceHistory.length > 1 && (
                    <div className="glass-card p-6">
                        <h2 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
                            <TrendingUp className="h-5 w-5 text-orange-400" />
                            Preisverlauf
                        </h2>
                        <PriceHistoryChart data={priceHistory} />
                    </div>
                )}

                {/* Comparison Grid */}
                <div>
                    <h2 className="text-lg font-semibold text-white mb-4">Preisvergleich</h2>
                    <ComparisonGrid
                        listings={listings}
                        query={product.name}
                        fresh={true}
                    />
                </div>
            </div>
        </div>
    );
}
