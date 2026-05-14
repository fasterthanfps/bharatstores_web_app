import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

// ── Config ────────────────────────────────────────────────────────────────────
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
            const { exact, related } = splitExactVsRelated(scored, queryLower, synonyms);

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

// ── Relevance Scoring (Synced with route.ts) ───────────────────────────────────
function scoreRelevance(listing: any, queryLower: string, synonyms: string[]): number {
    const name = (listing.product_name ?? listing.name ?? '').toLowerCase();
    const category = (listing.product_category ?? '').toLowerCase();
    const searchTerms = (listing.search_terms ?? []) as string[];
    const escaped = queryLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const wordBoundary = new RegExp(`\\b${escaped}\\b`);
    if (wordBoundary.test(name)) return 100;
    if (name.startsWith(queryLower)) return 95;

    if (name.includes(queryLower)) {
        const nameTokens = name.split(/[^a-z0-9]+/);
        const trueSubstring = nameTokens.some((token: string) =>
            token === queryLower || token.startsWith(queryLower)
        );
        if (trueSubstring) return 85;
        return 40;
    }

    if (searchTerms.some(t => t.toLowerCase() === queryLower)) return 80;
    if (searchTerms.some(t => t.toLowerCase().includes(queryLower))) return 70;

    for (const syn of synonyms) {
        const synEsc = syn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const synRe = new RegExp(`\\b${synEsc}\\b`);
        if (synRe.test(name)) return 65;
        if (name.includes(syn)) return 55;
    }

    // Popular Brand Boost (e.g., Kissan, Maggi, MDH)
    const popularBrands = ['kissan', 'maggi', 'mdh', 'trs', 'haldiram', 'ashoka', 'patanjali', 'aashirvaad', 'heera'];
    for (const brand of popularBrands) {
        if (name.includes(brand)) {
            // Only boost if it also matches the query somehow
            if (name.includes(queryLower) || synonyms.some(s => name.includes(s))) {
                return 110; // Top tier boost for branded matches
            }
        }
    }

    const qTokens = queryLower.split(/\s+/).filter(t => t.length >= 3);
    const nameTokens2 = name.split(/[^a-z0-9]+/).filter((t: string) => t.length >= 2);
    for (const qt of qTokens) {
        for (const nt of nameTokens2) {
            if (nt === qt) return 50;
            if (nt.includes(qt) || qt.includes(nt)) return 40;
        }
    }

    if (category && (category.includes(queryLower) || queryLower.includes(category))) return 30;
    return 0;
}

function sortByRelevance(listings: any[], queryLower: string, synonyms: string[], priceCol: string): any[] {
    return listings
        .map(l => ({ ...l, _score: scoreRelevance(l, queryLower, synonyms) }))
        .sort((a, b) => {
            if (b._score !== a._score) return b._score - a._score;
            const aInStock = a.availability === 'IN_STOCK' ? 0 : 1;
            const bInStock = b.availability === 'IN_STOCK' ? 0 : 1;
            if (aInStock !== bInStock) return aInStock - bInStock;
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

    const { data: allStores } = await supabase
        .from('stores')
        .select('id, name, logo_url, domain');
    const storeMap = new Map<string, any>((allStores ?? []).map((s: any) => [s.domain, s]));

    for (const result of scraperResults) {
        if (!result.listings || result.listings.length === 0) continue;

        for (const item of result.listings) {
            if (!item.name) continue;
            if ((item.price <= 0 || isNaN(item.price)) &&
                item.availability !== 'OUT_OF_STOCK' &&
                item.availability !== 'UPCOMING') continue;

            const storeDomain = STORE_DOMAIN_MAP[item.storeId];
            if (!storeDomain) continue;
            const store = storeMap.get(storeDomain);
            if (!store) continue;

            // Clean name of redundant phrases
            const cleanName = item.name
                .replace(/\s*[|-]?\s*Details in the shop/gi, '')
                .replace(/\s*[|-]?\s*Details im shop/gi, '')
                .trim();

            const productCategory = inferCategory(cleanName, query);
            const slug = cleanName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '')
                .slice(0, 80);

            try {
                const { data: product } = await supabase
                    .from('products')
                    .upsert(
                        { name: cleanName, slug, category: productCategory, search_terms: [queryLower] },
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
