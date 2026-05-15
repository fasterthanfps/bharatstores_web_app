import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import {
    SYNONYM_MAP,
    sortByRelevance,
    splitExactVsRelated,
    saveAndReturnListings
} from '@/lib/search/engine';

/**
 * POST /api/search/refresh?q=<query>
 *
 * Manual cache-bust endpoint. Called by the ↻ refresh button on the UI.
 * Steps:
 *  1. Mark all existing listings for this query as stale
 *  2. Run live scrapers and save fresh results
 *  3. Return the new listings with full scoring/sorting
 */
export async function POST(req: NextRequest) {
    const query = req.nextUrl.searchParams.get('q')?.trim();
    const sort = req.nextUrl.searchParams.get('sort') ?? 'price';
    if (!query || query.length < 2) {
        return NextResponse.json({ success: false, error: 'Query too short' }, { status: 400 });
    }

    const supabase = await createClient();
    const queryLower = query.toLowerCase();
    const sortCol = sort === 'price_per_kg' ? 'price_per_kg' : 'price';
    const synonyms = SYNONYM_MAP[queryLower] ?? [];

    console.log(`[Cache Refresh] Manual refresh triggered for "${query}"`);

    // ── Step 1: Invalidate existing cache for this query ──────────────────────
    const { data: staleProducts } = await supabase
        .from('products')
        .select('id')
        .or(`name.ilike.%${queryLower}%,search_terms.cs.{${queryLower}}`);

    if (staleProducts && staleProducts.length > 0) {
        const staleProductIds = staleProducts.map((p: any) => p.id);
        await supabase
            .from('listings')
            .update({ last_scraped_at: new Date(0).toISOString() })
            .in('product_id', staleProductIds);
    }

    // ── Step 2: Run scrapers live ──────────────────────────────────────────────
    try {
        const { ScraperOrchestrator } = await import('@/lib/scraper');
        const orchestrator = new ScraperOrchestrator();
        const scraperResults: any = await Promise.race([
            orchestrator.runAll(query),
            new Promise<null>((_, reject) =>
                setTimeout(() => reject(new Error('Scraper timeout')), 60000)
            ),
        ]);

        if (scraperResults) {
            const serviceClient = createServiceClient();
            const rawListings = await saveAndReturnListings(scraperResults, query, serviceClient, sortCol);
            
            // Deduplicate
            const seen = new Set<string>();
            const uniqueListings = rawListings.filter(l => {
                if (seen.has(l.id)) return false;
                seen.add(l.id);
                return true;
            });

            const scored = sortByRelevance(uniqueListings, queryLower, synonyms, sortCol);
            const { exact, related } = splitExactVsRelated(scored);

            console.log(`[Cache Refresh] Fresh scrape saved ${uniqueListings.length} listings for "${query}"`);
            
            return NextResponse.json({ 
                success: true, 
                data: { 
                    listings: scored, 
                    exactCount: exact.length, 
                    relatedCount: related.length,
                    fresh: true, 
                    cached: false 
                } 
            });
        }
    } catch (e: any) {
        console.error('[Cache Refresh] Scraper error:', e.message);
    }

    return NextResponse.json({
        success: false,
        error: 'Refresh failed — scrapers timed out or returned no data',
    }, { status: 503 });
}
