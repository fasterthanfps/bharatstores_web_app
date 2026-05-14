import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

// ── Config ────────────────────────────────────────────────────────────────────
const FRESH_TTL_MS = 30 * 60 * 1000; // 30 minutes

// ── Synonym Map ───────────────────────────────────────────────────────────────
// When a user searches a term that might have few direct hits, we also search synonyms.
// Key = canonical query, Value = synonyms to try (in order of preference).
const SYNONYM_MAP: Record<string, string[]> = {
    curd: ['dahi', 'yogurt', 'yoghurt', 'lassi'],
    dahi: ['curd', 'yogurt', 'yoghurt'],
    yogurt: ['dahi', 'curd', 'yoghurt'],
    yoghurt: ['yogurt', 'dahi', 'curd'],
    lemon: ['nimbu', 'lime', 'citrus'],
    nimbu: ['lemon', 'lime'],
    ghee: ['clarified butter', 'butter ghee'],
    atta: ['wheat flour', 'chapati flour'],
    besan: ['gram flour', 'chickpea flour'],
    toor: ['pigeon pea', 'arhar'],
    moong: ['mung', 'green gram'],
    rajma: ['kidney bean', 'red bean'],
    masoor: ['red lentil'],
    chana: ['chickpea', 'gram'],
    jeera: ['cumin'],
    haldi: ['turmeric'],
    methi: ['fenugreek'],
    ajwain: ['carom seeds'],
    hing: ['asafoetida'],
    imli: ['tamarind'],
    namkeen: ['savoury snacks', 'snacks'],
    poha: ['flattened rice'],
    sooji: ['semolina', 'rava'],
    daliya: ['broken wheat', 'cracked wheat'],
    chai: ['tea', 'masala chai'],
    lassi: ['yogurt drink', 'dahi'],
    paneer: ['cottage cheese', 'fresh cheese'],
    jam: ['preserve', 'fruit spread', 'marmalade', 'jelly'],
    preserve: ['jam', 'fruit spread', 'marmalade'],
    marmalade: ['jam', 'preserve', 'fruit spread'],
};

// ── Relevance Scoring ─────────────────────────────────────────────────────────
/**
 * Scores a listing for relevance to a query.
 * Returns a score 0-100 (higher = more relevant).
 * 100 = exact word-boundary match in product name (e.g. "Kissan Jam").
 * 85  = query is a true standalone substring token in name.
 * 40  = query is embedded inside a longer word (false positive, e.g. "jam" in "jamoona").
 * 0   = no meaningful match.
 */
function scoreRelevance(listing: any, queryLower: string, synonyms: string[]): number {
    const name = (listing.product_name ?? listing.name ?? '').toLowerCase();
    const category = (listing.product_category ?? '').toLowerCase();
    const searchTerms = (listing.search_terms ?? []) as string[];
    const escaped = queryLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // ── Tier 1: Exact word-boundary match (highest confidence) ─────────────────
    const wordBoundary = new RegExp(`\\b${escaped}\\b`);
    if (wordBoundary.test(name)) return 100;

    // ── Tier 2: Name starts with query ─────────────────────────────────────────
    if (name.startsWith(queryLower)) return 95;

    // ── Tier 3: True substring — but only if the match is at a token boundary ──
    // This prevents false positives like "jam" matching inside "jamoona".
    // We split the product name into tokens and check if any token starts with the query.
    if (name.includes(queryLower)) {
        const nameTokens = name.split(/[^a-z0-9]+/);
        const trueSubstring = nameTokens.some((token: string) =>
            token === queryLower || token.startsWith(queryLower)
        );
        if (trueSubstring) return 85; // genuine substring (e.g. "jamun" starts with "jam")
        return 40;                    // embedded false positive (e.g. "jamoona" contains "jam" in middle)
    }

    // ── Tier 4: Search terms exact/partial match ────────────────────────────────
    if (searchTerms.some(t => t.toLowerCase() === queryLower)) return 80;
    if (searchTerms.some(t => t.toLowerCase().includes(queryLower))) return 70;

    // ── Tier 5: Synonym word-boundary match ────────────────────────────────────
    for (const syn of synonyms) {
        const synEsc = syn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const synRe = new RegExp(`\\b${synEsc}\\b`);
        if (synRe.test(name)) return 65;
        if (name.includes(syn)) return 55;
    }

    // ── Tier 6: Token overlap ───────────────────────────────────────────────────
    const qTokens = queryLower.split(/\s+/).filter(t => t.length >= 3);
    const nameTokens2 = name.split(/[^a-z0-9]+/).filter((t: string) => t.length >= 2);
    for (const qt of qTokens) {
        for (const nt of nameTokens2) {
            if (nt === qt) return 50;
            if (nt.includes(qt) || qt.includes(nt)) return 40;
        }
    }

    // ── Tier 7: Category match ──────────────────────────────────────────────────
    if (category && (category.includes(queryLower) || queryLower.includes(category))) return 30;

    return 0;
}

function shapeListings(listings: any[]) {
    return listings.map((l) => {
        const product = l.products as any;
        const store = l.stores as any;
        return {
            ...l,
            products: undefined,
            stores: undefined,
            store_logo_url: store?.logo_url ?? null,
            product_name: product?.name ?? l.product_name ?? null,
            product_slug: product?.slug ?? l.product_slug ?? null,
            product_category: product?.category ?? l.product_category ?? null,
            search_terms: product?.search_terms ?? l.search_terms ?? [],
        };
    });
}

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
        const { exact, related } = splitExactVsRelated(scored, queryLower, synonyms);

        if (exact.length > 0 || freshListings.length >= 5) {
            return NextResponse.json({
                success: true,
                data: {
                    listings: scored,
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
        const { exact, related } = splitExactVsRelated(scored, queryLower, synonyms);

        if (exact.length > 0 || shaped.length >= 3) {
            triggerBackgroundScrape(query, sortCol);
            return NextResponse.json({
                success: true,
                data: {
                    listings: scored,
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
            const listings = await saveAndReturnListings(scraperResults, query, serviceClient, sortCol);
            const scored = sortByRelevance(listings, queryLower, synonyms, sortCol);
            const { exact, related } = splitExactVsRelated(scored, queryLower, synonyms);
            return NextResponse.json({
                success: true,
                data: { listings: scored, exactCount: exact.length, relatedCount: related.length, fresh: true, cached: false },
            });
        }
    } catch (e: any) {
        console.error('[Search API] Live scrape failed:', e.message);
    }

    // ── 3. Last resort ────────────────────────────────────────────────────────
    if (shaped.length > 0) {
        const scored = sortByRelevance(shaped, queryLower, synonyms, sortCol);
        return NextResponse.json({
            success: true,
            data: { listings: scored, fresh: false, cached: true },
        });
    }

    return NextResponse.json({ success: true, data: { listings: [], fresh: false } });
}

// ── Relevance sort helpers ─────────────────────────────────────────────────────

function sortByRelevance(listings: any[], queryLower: string, synonyms: string[], priceCol: string): any[] {
    return listings
        .map(l => ({ ...l, _score: scoreRelevance(l, queryLower, synonyms) }))
        .sort((a, b) => {
            // Primary: relevance score desc
            if (b._score !== a._score) return b._score - a._score;
            // Secondary: in-stock before out-of-stock
            const aInStock = a.availability === 'IN_STOCK' ? 0 : 1;
            const bInStock = b.availability === 'IN_STOCK' ? 0 : 1;
            if (aInStock !== bInStock) return aInStock - bInStock;
            // Tertiary: price asc (skip 0-price items to the end)
            const pa = a[priceCol] ?? 0;
            const pb = b[priceCol] ?? 0;
            if (pa === 0 && pb !== 0) return 1;
            if (pb === 0 && pa !== 0) return -1;
            return pa - pb;
        });
}

function splitExactVsRelated(scored: any[], queryLower: string, synonyms: string[]) {
    const exact = scored.filter(l => l._score >= 80);
    const related = scored.filter(l => l._score < 80 && l._score > 0);
    return { exact, related };
}

// ── Save scraped results to DB ────────────────────────────────────────────────
async function saveAndReturnListings(
    scraperResults: any[],
    query: string,
    supabase: any,
    sortCol: string
): Promise<any[]> {
    const allListings: any[] = [];
    const queryLower = query.toLowerCase();

    const STORE_DOMAIN_MAP: Record<string, string> = {
        grocera: 'grocera.de',
        jamoona: 'jamoona.com',
        littleindia: 'littleindia.de',
        nammamarkt: 'nammamarkt.com',
        dookan: 'eu.dookan.com',
        swadesh: 'swadesh.eu',
        angaadi: 'angaadi-online.de',
        spicevillage: 'spicevillage.eu',
    };

    // Pre-fetch all stores
    const { data: allStores } = await supabase
        .from('stores')
        .select('id, name, logo_url, domain');
    const storeMap = new Map<string, any>((allStores ?? []).map((s: any) => [s.domain, s]));

    for (const result of scraperResults) {
        if (!result.listings || result.listings.length === 0) continue;
        console.log(`[Scraper] ${result.storeName}: ${result.listings.length} items in ${result.durationMs}ms`);

        for (const item of result.listings) {
            if (!item.name) continue;
            if ((item.price <= 0 || isNaN(item.price)) &&
                item.availability !== 'OUT_OF_STOCK' &&
                item.availability !== 'UPCOMING') continue;

            const storeDomain = STORE_DOMAIN_MAP[item.storeId];
            if (!storeDomain) continue;
            const store = storeMap.get(storeDomain);
            if (!store) continue;

            const productCategory = inferCategory(item.name, query);
            const slug = item.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '')
                .slice(0, 80);

            try {
                const { data: product } = await supabase
                    .from('products')
                    .upsert(
                        { name: item.name, slug, category: productCategory, search_terms: [queryLower] },
                        { onConflict: 'slug', ignoreDuplicates: false }
                    )
                    .select()
                    .single();

                if (!product) continue;

                const { data: listing } = await supabase
                    .from('listings')
                    .upsert({
                        product_id: product.id,
                        store_id: store.id,
                        store_name: item.storeName,
                        price: item.price ?? 0,
                        availability: item.availability ?? 'UNKNOWN',
                        product_url: item.productUrl,
                        image_url: item.imageUrl,
                        weight_grams: item.weightGrams,
                        weight_label: item.weightLabel,
                        price_per_kg: item.pricePerKg,
                        last_scraped_at: new Date().toISOString(),
                    }, { onConflict: 'product_id,store_id' })
                    .select()
                    .single();

                if (listing) {
                    allListings.push({
                        ...listing,
                        _score: 0,
                        store_logo_url: store.logo_url ?? null,
                        product_name: product.name ?? null,
                        product_slug: product.slug ?? null,
                        product_category: product.category ?? null,
                        search_terms: product.search_terms ?? [],
                    });
                }
            } catch (e: any) {
                console.error(`[Save] Failed to save ${item.name}:`, e.message);
            }
        }
    }

    console.log(`[Search] "${query}" → ${allListings.length} scraped total`);
    return allListings;
}

function inferCategory(name: string, query: string): string {
    const combined = (name + ' ' + query).toLowerCase();
    if (/rice|chawal|basmati|sona/.test(combined)) return 'rice';
    if (/atta|flour|besan|maida|sooji|suji/.test(combined)) return 'flour';
    if (/dal|lentil|bean|chana|toor|moong|masoor|rajma/.test(combined)) return 'lentils';
    if (/ghee|butter ghee/.test(combined)) return 'oil-ghee';
    if (/oil|cooking oil/.test(combined)) return 'oil-ghee';
    if (/spice|masala|turmeric|cumin|coriander|cardamom|pepper|chilli|haldi|jeera/.test(combined)) return 'spices';
    if (/tea|chai|coffee/.test(combined)) return 'beverages';
    if (/snack|namkeen|chips|biscuit|cookie/.test(combined)) return 'snacks';
    if (/sweet|mithai|halwa|ladoo|barfi/.test(combined)) return 'sweets';
    if (/pickle|chutney|achaar/.test(combined)) return 'condiments';
    if (/paneer|yogurt|yoghurt|curd|dahi|milk|cream|butter|dairy|lassi/.test(combined)) return 'dairy';
    if (/lemon|lime|tomato|onion|potato|vegetable|fruit|nimbu|ginger|garlic/.test(combined)) return 'fresh-produce';
    if (/frozen/.test(combined)) return 'frozen';
    return 'general';
}
