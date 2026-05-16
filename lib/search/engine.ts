// ── Config & Constants ────────────────────────────────────────────────────────
export const FRESH_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours (up from 30 mins)

export const SYNONYM_MAP: Record<string, string[]> = {
    curd: ['dahi', 'yogurt', 'yoghurt', 'lassi'],
    dahi: ['curd', 'yogurt', 'yoghurt'],
    yogurt: ['dahi', 'curd', 'yoghurt'],
    yoghurt: ['yogurt', 'dahi', 'curd'],
    lemon: ['nimbu', 'lime', 'citrus'],
    nimbu: ['lemon', 'lime'],
    ghee: ['clarified butter', 'butter ghee'],
    atta: ['wheat flour', 'chapati flour', 'whole wheat flour'],
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
    rice: ['chawal', 'basmati'],
    basmati: ['rice', 'chawal'],
};

// ── Relevance Scoring ─────────────────────────────────────────────────────────
/**
 * Scores a listing for relevance to a query.
 * Returns a score 0-120 (higher = more relevant).
 */
export function scoreRelevance(listing: any, queryLower: string, synonyms: string[]): number {
    const name = (listing.product_name ?? listing.name ?? '').toLowerCase();
    const category = (listing.product_category ?? '').toLowerCase();
    const searchTerms = (listing.search_terms ?? []) as string[];

    // ── Tier 0: Absolute Exact Match ──────────────────────────────────────────
    if (name === queryLower) return 120;

    // Tokenize product name — split on non-alphanumeric, filter short noise
    const nameTokens = name.split(/[^a-z0-9]+/).filter((t: string) => t.length >= 2);

    // "Significant" tokens: strip weight/unit suffixes (200g, 1kg, 500ml, etc.)
    const weightUnitRe = /^\d+(g|kg|ml|l|oz|lb|pc|pcs|pack|x)$/;
    const significantTokens = nameTokens.filter((t: string) => !weightUnitRe.test(t) && !/^\d+$/.test(t));

    // ── Tier 0.5: Significant Tokens Match ─────────────────────────────────────
    const qTokens = queryLower.split(/[^a-z0-9]+/).filter(t => t.length >= 2);
    if (qTokens.length > 0 && qTokens.length === significantTokens.length && qTokens.every((t, i) => t === significantTokens[i])) return 115;

    // Check if query appears as an exact token in the name
    const escaped = queryLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const wordBoundary = new RegExp(`\\b${escaped}\\b`);
    const isFirstToken = significantTokens[0] === queryLower;
    const hasWordBoundary = wordBoundary.test(name);

    // ── Tier 1: Word-boundary match AND query is first token ───────────────────
    if (hasWordBoundary && isFirstToken) return 100;

    // ── Tier 1b: Word-boundary match anywhere in name ──────────────────────────
    if (hasWordBoundary) return 90;

    // ── Tier 2: Name starts with query ─────────────────────────────────────────
    if (name.startsWith(queryLower)) return 85;

    // ── Tier 3: Direct substring ───────────────────────────────────────────────
    if (name.includes(queryLower)) {
        if (!queryLower.includes(' ')) {
            const trueTokenMatch = nameTokens.some((token: string) =>
                token === queryLower || token.startsWith(queryLower)
            );
            if (trueTokenMatch) return 75;
            return 0; // Embedded false positive
        }
        return 80; 
    }

    // ── Tier 4: Synonym word-boundary match ────────────────────────────────────
    for (const syn of synonyms) {
        const synEsc = syn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const synWords = syn.split(/\s+/);
        const synRe = new RegExp(`\\b${synEsc}\\b`);
        if (synRe.test(name)) return 65;
        if (name.includes(syn) || nameTokens.some((t: string) => t === synWords[0])) return 55;
    }

    // ── Tier 5: Brand Boost ────────────────────────────────────────────────────
    const nameHasQueryToken = nameTokens.some((t: string) =>
        t === queryLower || t.startsWith(queryLower)
    );
    if (nameHasQueryToken || queryLower.includes(' ')) {
        const popularBrands = [
            'kissan', 'mdh', 'trs', 'haldiram', 'ashoka', 'patanjali',
            'aashirvaad', 'heera', 'amul', 'everest', 'catch', 'kohinoor', 'maggi'
        ];
        for (const brand of popularBrands) {
            if (nameTokens.includes(brand)) return 110;
        }
    }

    // ── Tier 6: Search-terms tag match ─────────────────────────────────────────
    if (searchTerms.some(t => t.toLowerCase() === queryLower)) return 40;
    if (searchTerms.some(t => t.toLowerCase().startsWith(queryLower))) return 30;

    // ── Tier 7: Multi-word query token overlap ─────────────────────────────────
    if (queryLower.includes(' ')) {
        const queryTokens = queryLower.split(/\s+/).filter(t => t.length >= 3);
        let overlapCount = 0;
        for (const qt of queryTokens) {
            if (nameTokens.includes(qt)) overlapCount++;
        }
        if (overlapCount > 0 && overlapCount >= Math.ceil(queryTokens.length / 2)) return 50 + (overlapCount * 5);
    }

    // ── Tier 8: Category match ──────────────────────────────────────────────────
    if (category && (category.includes(queryLower) || queryLower.includes(category))) return 25;

    return 0;
}

export interface GroupedListing {
    id: string; // product_id
    product_name: string;
    product_slug: string;
    product_category: string;
    image_url: string;
    _score: number;
    bestPrice: number;
    bestStore: string;
    allPrices: {
        id: string;
        store_name: string;
        price: number;
        availability: string;
        product_url: string;
        image_url: string | null;
        weight_label: string | null;
        price_per_kg: number | null;
        store_handle?: string;
        variant_id?: string;
    }[];
}

export function groupListingsByProduct(listings: any[], queryLower: string, synonyms: string[], priceCol: string): GroupedListing[] {
    const scored = listings.map(l => ({ ...l, _score: scoreRelevance(l, queryLower, synonyms) }));
    const productGroups = new Map<string, any[]>();

    for (const l of scored) {
        const key = l.product_id || l.product_slug || l.id;
        if (!productGroups.has(key)) productGroups.set(key, []);
        productGroups.get(key)!.push(l);
    }

    return Array.from(productGroups.values()).map(group => {
        // Sort group by price to find best
        const sortedGroup = group.sort((a, b) => {
            const pa = Number(a[priceCol] ?? 0);
            const pb = Number(b[priceCol] ?? 0);
            if (pa === 0) return 1;
            if (pb === 0) return -1;
            return pa - pb;
        });

        const best = sortedGroup[0];
        return {
            id: best.product_id || best.id,
            product_name: best.product_name,
            product_slug: best.product_slug,
            product_category: best.product_category,
            image_url: best.image_url,
            _score: best._score,
            bestPrice: Number(best.price),
            bestStore: best.store_name,
            allPrices: sortedGroup.map(l => ({
                id: l.id,
                store_name: l.store_name,
                price: Number(l.price),
                availability: l.availability,
                product_url: l.product_url,
                image_url: l.image_url,
                weight_label: l.weight_label,
                price_per_kg: l.price_per_kg ? Number(l.price_per_kg) : null,
                store_handle: l.store_handle,
                variant_id: l.variant_id,
            }))
        };
    }).sort((a, b) => {
        if (b._score !== a._score) return b._score - a._score;
        return a.bestPrice - b.bestPrice;
    });
}

export function sortByRelevance(listings: any[], queryLower: string, synonyms: string[], priceCol: string): any[] {
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

export function splitExactVsRelated(scored: any[]) {
    // Threshold: 80+ = Exact match section, below = Related products
    const exact = scored.filter(l => (l._score ?? 0) >= 80);
    const related = scored.filter(l => (l._score ?? 0) < 80 && (l._score ?? 0) > 0);
    return { exact, related };
}

export function shapeListings(listings: any[]) {
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

// ── Save scraped results to DB ────────────────────────────────────────────────
export async function saveAndReturnListings(
    scraperResults: any[],
    query: string,
    supabase: any,
    sortCol: string
): Promise<any[]> {
    const allListings: any[] = [];
    const queryLower = query.toLowerCase();

    const STORE_DOMAIN_MAP: Record<string, string> = {
        grocera: 'grocera.de',
        jamoona: 'jamoona.de',
        littleindia: 'little-india.de',
        nammamarkt: 'nammamarkt.com',
        dookan: 'dookan.com',
        swadesh: 'swadesh.de',
        angaadi: 'angaadi.de',
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

                const storeHandle = item.productUrl?.match(/\/products\/([^?#/]+)/)?.[1] || null;
                const variantId = item.productUrl?.match(/[?&]variant=(\d+)/)?.[1] || null;

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
                        store_handle: storeHandle,
                        variant_id: variantId,
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

export function inferCategory(name: string, query: string): string {
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
