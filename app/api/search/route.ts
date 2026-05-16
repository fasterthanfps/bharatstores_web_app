import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import {
    FRESH_TTL_MS,
    SYNONYM_MAP,
    groupListingsByProduct,
    splitExactVsRelated,
    shapeListings,
    saveAndReturnListings
} from '@/lib/search/engine';

// ── Background scrape ─────────────────────────────────────────────────────────
function triggerBackgroundScrape(query: string, sortCol: string) {
    void (async () => {
        try {
            const { ScraperOrchestrator } = await import('@/lib/scraper');
            const orchestrator = new ScraperOrchestrator();
            const scraperResults: any = await Promise.race([
                orchestrator.runAll(query),
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

// ── GET handler ────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
    const query = req.nextUrl.searchParams.get('q')?.trim();
    const sort = req.nextUrl.searchParams.get('sort') ?? 'price';
    if (!query || query.length < 2) {
        return NextResponse.json({ success: false, error: 'Query too short' }, { status: 400 });
    }

    const supabase = await createClient();
    const queryLower = query.toLowerCase();
    const sortCol = sort === 'price_per_kg' ? 'price_per_kg' : 'price';
    const freshCutoff = new Date(Date.now() - FRESH_TTL_MS).toISOString();
    const synonyms = SYNONYM_MAP[queryLower] ?? [];
    const allTerms = [queryLower, ...synonyms];

    const orClauses = allTerms
        .map(t => `name.ilike.%${t}%`)
        .join(',');

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
    const finalResults = hasFresh ? freshResults : currentGrouped;

    const { exact, related } = splitExactVsRelated(finalResults);

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
            },
        });
    }

    // ── 2. No valid cache — run scrapers live ─────────────────────────────────
    try {
        const { ScraperOrchestrator } = await import('@/lib/scraper');
        const orchestrator = new ScraperOrchestrator();

        const scraperResults: any = await Promise.race([
            orchestrator.runAll(query),
            new Promise<null>((_, reject) =>
                setTimeout(() => reject(new Error('Scraper timeout')), 35000)
            ),
        ]);

        if (scraperResults) {
            const serviceClient = createServiceClient();
            const liveListings = await saveAndReturnListings(scraperResults, query, serviceClient, sortCol);
            
            const liveGrouped = groupListingsByProduct(liveListings, queryLower, synonyms, sortCol);
            const { exact: e, related: r } = splitExactVsRelated(liveGrouped);

            return NextResponse.json({
                success: true,
                data: { 
                    listings: liveGrouped, 
                    exactCount: e.length, 
                    relatedCount: r.length, 
                    total: liveGrouped.length,
                    fresh: true, 
                    cached: false 
                },
            });
        }
    } catch (e: any) {
        console.error('[Search API] Live scrape failed:', e.message);
    }

    return NextResponse.json({ success: true, data: { listings: [], total: 0, fresh: false } });
}
