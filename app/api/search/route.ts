import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import {
    FRESH_TTL_MS,
    SYNONYM_MAP,
    sortByRelevance,
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

    // Build combined search terms (query + synonyms for broader DB match)
    const allTerms = [queryLower, ...synonyms];

    // ── 1. Fetch all cached listings (fresh + stale) for query + synonyms ──────
    const orClauses = allTerms
        .map(t => `name.ilike.%${t}%`)
        .join(',');

    const { data: allCached } = await supabase
        .from('listings')
        .select(`*, stores ( name, logo_url, domain ), products!inner ( name, slug, category, search_terms )`)
        .or(orClauses, { foreignTable: 'products' })
        .order(sortCol, { ascending: true })
        .limit(200);

    // Deduplicate
    const seen = new Set<string>();
    const filtered = (allCached ?? []).filter((l) => {
        if (seen.has(l.id)) return false;
        seen.add(l.id);
        return true;
    });

    const shaped = shapeListings(filtered);

    // Separate fresh vs stale
    const freshListings = shaped.filter((l) => l.last_scraped_at && l.last_scraped_at >= freshCutoff);
    const hasFresh = freshListings.length > 0;
    const hasStale = shaped.length > 0 && !hasFresh;

    // Score + sort + split for fresh data
    if (hasFresh) {
        const scored = sortByRelevance(freshListings, queryLower, synonyms, sortCol);
        // Filter out zero-score listings (noise/false positives)
        const relevant = scored.filter(l => l._score > 0);
        const { exact, related } = splitExactVsRelated(relevant);

        if (exact.length > 0 || relevant.length >= 5) {
            return NextResponse.json({
                success: true,
                data: {
                    listings: relevant,
                    exactCount: exact.length,
                    relatedCount: related.length,
                    fresh: true,
                    cached: true,
                },
            });
        }
    }

    // Stale cache: return now, refresh in background
    if (hasStale) {
        const scored = sortByRelevance(shaped, queryLower, synonyms, sortCol);
        const relevant = scored.filter(l => l._score > 0);
        const { exact, related } = splitExactVsRelated(relevant);

        if (exact.length > 0 || relevant.length >= 3) {
            triggerBackgroundScrape(query, sortCol);
            return NextResponse.json({
                success: true,
                data: {
                    listings: relevant,
                    exactCount: exact.length,
                    relatedCount: related.length,
                    fresh: false,
                    cached: true,
                    refreshing: true,
                },
            });
        }
    }

    // ── 2. No valid cache — run scrapers live ─────────────────────────────────
    try {
        const { ScraperOrchestrator } = await import('@/lib/scraper');
        const orchestrator = new ScraperOrchestrator();

        const scraperResults: any = await Promise.race([
            orchestrator.runAll(query),
            new Promise<null>((_, reject) =>
                setTimeout(() => reject(new Error('Scraper timeout')), 30000)
            ),
        ]);

        if (scraperResults) {
            const serviceClient = createServiceClient();
            const liveListings = await saveAndReturnListings(scraperResults, query, serviceClient, sortCol);

            // Deduplicate live results
            const seenLive = new Set<string>();
            const uniqueLive = liveListings.filter(l => {
                if (seenLive.has(l.id)) return false;
                seenLive.add(l.id);
                return true;
            });

            const scored = sortByRelevance(uniqueLive, queryLower, synonyms, sortCol);
            const relevant = scored.filter(l => l._score > 0);
            const { exact, related } = splitExactVsRelated(relevant);
            return NextResponse.json({
                success: true,
                data: { listings: relevant, exactCount: exact.length, relatedCount: related.length, fresh: true, cached: false },
            });
        }
    } catch (e: any) {
        console.error('[Search API] Live scrape failed:', e.message);
    }

    // ── 3. Last resort ────────────────────────────────────────────────────────
    if (shaped.length > 0) {
        const scored = sortByRelevance(shaped, queryLower, synonyms, sortCol);
        const relevant = scored.filter(l => l._score > 0);
        return NextResponse.json({
            success: true,
            data: { listings: relevant, fresh: false, cached: true },
        });
    }

    return NextResponse.json({ success: true, data: { listings: [], fresh: false } });
}
