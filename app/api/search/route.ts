import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import {
    FRESH_TTL_MS,
    SYNONYM_MAP,
    groupListingsByProduct,
    splitExactVsRelated,
    shapeListings,
    saveAndReturnListings,
    getCategoryFromQuery
} from '@/lib/search/engine';
import { smartTruncateQuery } from '@/lib/search/normalize';

function parseWeightGrams(weightLabel?: string | null): number | null {
    if (!weightLabel) return null;
    const m = weightLabel.toLowerCase().replace(/\s+/g, '').match(/^(\d+(?:\.\d+)?)(kg|g|mg)$/);
    if (!m) return null;
    const n = Number(m[1]);
    if (m[2] === 'kg') return n * 1000;
    if (m[2] === 'mg') return n / 1000;
    return n;
}

function applyGroupedFilters(grouped: any[], params: {
    stores: string[];
    minPrice: number;
    maxPrice: number;
    inStockOnly: boolean;
    priceMode: 'range' | 'below' | 'above';
    quantity: string;
    brands: string[];
    types: string[];
    sugar: string[];
}) {
    const qtyGrams = parseWeightGrams(params.quantity);
    return grouped.filter((g) => {
        const name = String(g.product_name || '').toLowerCase();
        const category = String(g.product_category || '').toLowerCase();
        const text = `${name} ${category}`;
        const prices = Array.isArray(g.allPrices) ? g.allPrices : [];

        if (params.stores.length > 0) {
            const hasStore = prices.some((p: any) =>
                params.stores.includes(String(p.store_name || '').toLowerCase().replace(/\s+/g, ''))
            );
            if (!hasStore) return false;
        }

        if (params.inStockOnly && !prices.some((p: any) => p.availability !== 'OUT_OF_STOCK')) return false;

        const numericPrices = prices.map((p: any) => Number(p.price)).filter((n: number) => Number.isFinite(n) && n > 0);
        const bestPrice = numericPrices.length ? Math.min(...numericPrices) : Number(g.bestPrice || 0);
        if (params.priceMode === 'below' && params.maxPrice < 100 && !(bestPrice <= params.maxPrice)) return false;
        if (params.priceMode === 'above' && params.minPrice > 0 && !(bestPrice >= params.minPrice)) return false;
        if (params.priceMode === 'range' && !((bestPrice >= params.minPrice) && (bestPrice <= params.maxPrice))) return false;

        if (qtyGrams) {
            const hasQty = prices.some((p: any) => {
                const grams = parseWeightGrams(p.weight_label);
                if (!grams) return false;
                return Math.abs(grams - qtyGrams) <= Math.max(50, qtyGrams * 0.1);
            });
            if (!hasQty) return false;
        }

        if (params.brands.length > 0 && !params.brands.some((b) => text.includes(b))) return false;
        if (params.types.length > 0 && !params.types.some((t) => text.includes(t))) return false;
        if (params.sugar.length > 0) {
            const sugarMatch = params.sugar.some((s) => {
                if (s === 'no-added-sugar') return /no added sugar|without added sugar/.test(text);
                if (s === 'zero-sugar') return /zero sugar|sugar free|sugar-free/.test(text);
                return text.includes(s);
            });
            if (!sugarMatch) return false;
        }

        return true;
    });
}

// ── Background scrape ─────────────────────────────────────────────────────────
function triggerBackgroundScrape(query: string, sortCol: string) {
    void (async () => {
        try {
            const { ScraperOrchestrator } = await import('@/lib/scraper');
            const orchestrator = new ScraperOrchestrator();
            const scrapeQuery = smartTruncateQuery(query);
            console.log(`[Cache] Background scraping for: "${scrapeQuery}" (original: "${query}")`);
            const scraperResults: any = await Promise.race([
                orchestrator.runAll(scrapeQuery),
                new Promise<null>((_, reject) =>
                    setTimeout(() => reject(new Error('Background scrape timeout')), 60000)
                ),
            ]);
            if (scraperResults) {
                const serviceClient = createServiceClient();
                await saveAndReturnListings(scraperResults, query, serviceClient, sortCol);
                console.log(`[Cache] Background refresh done for "${query}"`);
            }
        } catch (e: any) {
            console.error(`[Cache] Background scrape failed for "${query}":`, e.message);
        }
    })();
}

export async function GET(req: NextRequest) {
    const query = req.nextUrl.searchParams.get('q')?.trim();
    const sort = req.nextUrl.searchParams.get('sort') ?? 'price';
    const stores = (req.nextUrl.searchParams.get('stores') ?? '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    const minPrice = Number(req.nextUrl.searchParams.get('minPrice') ?? 0);
    const maxPrice = Number(req.nextUrl.searchParams.get('maxPrice') ?? 100);
    const inStockOnly = req.nextUrl.searchParams.get('inStock') === 'true';
    const priceMode = (req.nextUrl.searchParams.get('priceMode') as 'range' | 'below' | 'above') ?? 'range';
    const quantity = req.nextUrl.searchParams.get('quantity') ?? '';
    const brands = (req.nextUrl.searchParams.get('brands') ?? '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    const types = (req.nextUrl.searchParams.get('types') ?? '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    const sugar = (req.nextUrl.searchParams.get('sugar') ?? '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    if (!query || query.length < 2) {
        return NextResponse.json({ success: false, error: 'Query too short' }, { status: 400 });
    }

    const supabase = await createClient();
    const queryLower = query.toLowerCase();
    const sortCol = sort === 'pricePerKg' || sort === 'price_per_kg' ? 'price_per_kg' : 'price';
    const freshCutoff = new Date(Date.now() - FRESH_TTL_MS).toISOString();
    const synonyms = SYNONYM_MAP[queryLower] ?? [];
    const coreQuery = smartTruncateQuery(queryLower);
    const allTerms = Array.from(new Set([queryLower, coreQuery, ...synonyms])).filter(t => t.length >= 2);

    const matchedCategory = getCategoryFromQuery(queryLower);
    const orClauses = [
        ...allTerms.map(t => `name.ilike.%${t}%`),
        ...(matchedCategory ? [`category.eq.${matchedCategory}`] : [])
    ].join(',');

    const { data: allCached } = await supabase
        .from('listings')
        .select(`*, stores ( name, logo_url, domain ), products!inner ( name, slug, category, search_terms )`)
        .or(orClauses, { foreignTable: 'products' })
        .order(sortCol, { ascending: true })
        .limit(300);

    const shaped = shapeListings(allCached ?? []);
    
    // Group by product
    const currentGrouped = groupListingsByProduct(shaped, queryLower, synonyms, sortCol);

    // Separate fresh vs stale (based on the best listing in each group)
    const freshResults = currentGrouped.filter((p) => {
        const best = p.allPrices[0];
        // @ts-ignore
        return best && best.last_scraped_at >= freshCutoff;
    });

    const hasFresh = freshResults.length > 0;
    const filteredFresh = applyGroupedFilters(freshResults, { stores, minPrice, maxPrice, inStockOnly, priceMode, quantity, brands, types, sugar });
    const filteredAll = applyGroupedFilters(currentGrouped, { stores, minPrice, maxPrice, inStockOnly, priceMode, quantity, brands, types, sugar });
    const finalResults = hasFresh ? filteredFresh : filteredAll;

    const { exact, related } = splitExactVsRelated(finalResults);

    const inStockProducts = finalResults.filter((p: any) => p.allPrices?.some((price: any) => price.availability !== 'OUT_OF_STOCK'));
    const allPrices = inStockProducts.map((p: any) => p.bestPrice).filter(Boolean);
    const allPerKg = inStockProducts.flatMap((p: any) => p.allPrices?.map((price: any) => price.price_per_kg)).filter(Boolean);
    
    const insights = {
        bestPrice: allPrices.length ? Math.min(...allPrices) : null,
        lowestPerKg: allPerKg.length ? Math.min(...allPerKg) : null,
        storeCount: new Set(finalResults.flatMap((p: any) => p.allPrices?.map((price: any) => price.store_name) ?? [])).size,
        inStockCount: inStockProducts.length,
        bestDeal: inStockProducts[0] ? { name: inStockProducts[0].product_name, price: inStockProducts[0].bestPrice } : null,
    };

    if (finalResults.length > 0) {
        if (!hasFresh) triggerBackgroundScrape(query, sortCol);
        
        return NextResponse.json({
            success: true,
            data: {
                listings: finalResults,
                exactCount: exact.length,
                relatedCount: related.length,
                total: finalResults.length,
                fresh: hasFresh,
                cached: true,
                refreshing: !hasFresh,
                insights,
            },
        });
    }

    // ── 2. No valid cache — run scrapers live ─────────────────────────────────
    try {
        const { ScraperOrchestrator } = await import('@/lib/scraper');
        const orchestrator = new ScraperOrchestrator();
        const scrapeQuery = smartTruncateQuery(query);
        console.log(`[Search API] Live scraping for: "${scrapeQuery}" (original: "${query}")`);

        const scraperResults: any = await Promise.race([
            orchestrator.runAll(scrapeQuery),
            new Promise<null>((_, reject) =>
                setTimeout(() => reject(new Error('Scraper timeout')), 35000)
            ),
        ]);

        if (scraperResults) {
            const serviceClient = createServiceClient();
            const liveListings = await saveAndReturnListings(scraperResults, query, serviceClient, sortCol);
            
            const liveGrouped = groupListingsByProduct(liveListings, queryLower, synonyms, sortCol);
            const filteredLive = applyGroupedFilters(liveGrouped, { stores, minPrice, maxPrice, inStockOnly, priceMode, quantity, brands, types, sugar });
            const { exact: e, related: r } = splitExactVsRelated(filteredLive);

            const liveInStockProducts = filteredLive.filter((p: any) => p.allPrices?.some((price: any) => price.availability !== 'OUT_OF_STOCK'));
            const liveAllPrices = liveInStockProducts.map((p: any) => p.bestPrice).filter(Boolean);
            const liveAllPerKg = liveInStockProducts.flatMap((p: any) => p.allPrices?.map((price: any) => price.price_per_kg)).filter(Boolean);
            
            const liveInsights = {
                bestPrice: liveAllPrices.length ? Math.min(...liveAllPrices) : null,
                lowestPerKg: liveAllPerKg.length ? Math.min(...liveAllPerKg) : null,
                storeCount: new Set(filteredLive.flatMap((p: any) => p.allPrices?.map((price: any) => price.store_name) ?? [])).size,
                inStockCount: liveInStockProducts.length,
                bestDeal: liveInStockProducts[0] ? { name: liveInStockProducts[0].product_name, price: liveInStockProducts[0].bestPrice } : null,
            };

            return NextResponse.json({
                success: true,
                data: { 
                    listings: filteredLive, 
                    exactCount: e.length, 
                    relatedCount: r.length, 
                    total: filteredLive.length,
                    fresh: true, 
                    cached: false,
                    insights: liveInsights,
                },
            });
        }
    } catch (e: any) {
        console.error('[Search API] Live scrape failed:', e.message);
    }

    return NextResponse.json({ success: true, data: { listings: [], total: 0, fresh: false } });
}
