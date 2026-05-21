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

export const WORD_SYNONYMS: Record<string, string[]> = {
    sahi: ['shahi'],
    shahi: ['sahi'],
    paneer: ['cottage', 'cheese'],
    atta: ['aata', 'wheat', 'flour'],
    aata: ['atta', 'wheat', 'flour'],
    dal: ['daal', 'pulses', 'lentil', 'lentils'],
    daal: ['dal', 'pulses', 'lentil', 'lentils'],
    moong: ['mung'],
    mung: ['moong'],
    jeera: ['zeera', 'cumin'],
    zeera: ['jeera', 'cumin'],
    haldi: ['turmeric'],
    turmeric: ['haldi'],
    besan: ['gram', 'chickpea'],
    curd: ['dahi', 'yogurt'],
    dahi: ['curd', 'yogurt'],
    sooji: ['suji', 'rava', 'semolina'],
    suji: ['sooji', 'rava', 'semolina'],
    rava: ['sooji', 'suji', 'semolina'],
    semolina: ['sooji', 'suji', 'rava'],
    masala: ['masalla', 'masale', 'spice', 'spices'],
    masale: ['masala', 'masalla', 'spice', 'spices'],
    spice: ['masala', 'spices'],
    spices: ['masala', 'spice'],
    powder: ['pwd'],
    chana: ['chole', 'chickpeas', 'chickpea'],
    chole: ['chana', 'chickpeas', 'chickpea'],
    urad: ['urid'],
    urid: ['urad'],
    toor: ['tuvar', 'arhar'],
    tuvar: ['toor', 'arhar'],
};

type IntentProfile = {
    keys: string[];
    include: string[];
    exclude: string[];
};

const INTENT_PROFILES: IntentProfile[] = [
    {
        keys: ['atta', 'aata', 'chapati flour', 'wheat flour', 'whole wheat', 'chakki atta'],
        include: ['atta', 'aata', 'chapati flour', 'whole wheat flour', 'wheat flour', 'wheat'],
        exclude: ['noodles', 'pasta', 'instant noodles', 'ramen', 'barley', 'maize', 'corn', 'almond', 'coconut', 'rice flour', 'gram flour', 'besan', 'maida', 'sooji', 'suji', 'rava', 'semolina', 'tapioca', 'juwar', 'jowar', 'bajra', 'ragi', 'millet', 'mathri', 'mathis', 'mathi']
    },
    {
        keys: ['flour', 'wheat'],
        include: ['flour', 'wheat', 'atta', 'aata', 'besan', 'maida', 'sooji', 'suji', 'rava', 'semolina'],
        exclude: ['noodles', 'pasta', 'instant noodles', 'ramen']
    },
    {
        keys: ['rice', 'basmati', 'chawal'],
        include: ['rice', 'basmati', 'sona', 'chawal'],
        exclude: ['noodle', 'flakes', 'pasta']
    },
    {
        keys: ['dal', 'daal', 'lentil', 'pulses', 'toor', 'moong', 'masoor', 'chana', 'rajma'],
        include: ['dal', 'lentil', 'toor', 'moong', 'masoor', 'chana', 'rajma'],
        exclude: ['snack', 'mixture', 'chips']
    },
    {
        keys: ['ghee', 'clarified butter'],
        include: ['ghee', 'clarified butter'],
        exclude: ['noodles', 'snack', 'masala mix']
    },
    {
        keys: ['biscuit', 'cookie'],
        include: ['biscuit', 'cookie', 'digestive', 'cream biscuit'],
        exclude: ['flour', 'atta', 'dal', 'rice']
    }
];

function getActiveIntentProfiles(queryLower: string, synonyms: string[]): IntentProfile[] {
    const qTokens = new Set(queryLower.split(/\s+/).filter(Boolean));
    const synText = synonyms.join(' ');
    return INTENT_PROFILES.filter((p) =>
        p.keys.some((k) => qTokens.has(k) || queryLower.includes(k) || synText.includes(k))
    );
}

function hasTerm(text: string, term: string): boolean {
    const normalized = text.toLowerCase();
    const t = term.toLowerCase().trim();
    if (!t) return false;
    if (t.includes(' ')) return normalized.includes(t);
    const re = new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
    return re.test(normalized);
}

import { smartTruncateQuery } from './normalize';
import { analyzeProductImageAndName } from './productAnalyzer';
import { getProductImage } from '../services/imageRecovery';

function levenshteinDistance(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

// ── Relevance Scoring ─────────────────────────────────────────────────────────
/**
 * Scores a listing for relevance to a query.
 * Returns a score 0-120 (higher = more relevant).
 */
export function scoreRelevance(listing: any, queryLower: string, synonyms: string[]): number {
    const name = (listing.product_name ?? listing.name ?? '').toLowerCase();
    const category = (listing.product_category ?? '').toLowerCase();
    const searchTerms = (listing.search_terms ?? []) as string[];
    const text = `${name} ${category}`;
    const activeIntentProfiles = getActiveIntentProfiles(queryLower, synonyms);
    if (activeIntentProfiles.length > 0) {
        let includeHit = 0;
        let excludeHit = 0;
        for (const profile of activeIntentProfiles) {
            // Intent should be driven by product name first, category second.
            if (profile.include.some((t) => hasTerm(name, t)) || profile.include.some((t) => hasTerm(category, t))) includeHit++;
            if (profile.exclude.some((t) => hasTerm(name, t))) excludeHit++;
        }
        if (excludeHit > 0) return 2; // Immediately penalize if there's any exclude hit!
        if (includeHit > 0) return 100 + Math.min(includeHit, 2);
    }

    // Use a cleaned "core" query for smarter token matching
    const coreQuery = smartTruncateQuery(queryLower);
    const coreTokens = coreQuery.split(/\s+/).filter(t => t.length >= 2);

    // ── Tier 0: Absolute Exact Match (Original or Core) ────────────────────────
    if (name === queryLower || name === coreQuery) return 120;

    // Tokenize product name — split on non-alphanumeric, filter short noise
    const nameTokens = name.split(/[^a-z0-9]+/).filter((t: string) => t.length >= 2);

    // "Significant" tokens: strip weight/unit suffixes (200g, 1kg, 500ml, etc.)
    const weightUnitRe = /^\d+(g|kg|ml|l|oz|lb|pc|pcs|pack|x)$/;
    const significantTokens = nameTokens.filter((t: string) => !weightUnitRe.test(t) && !/^\d+$/.test(t));

    // ── Tier 0.5: Significant Tokens Match ─────────────────────────────────────
    if (coreTokens.length > 0 && coreTokens.length === significantTokens.length && coreTokens.every((t, i) => t === significantTokens[i])) return 115;

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

    // Only boost popular brands if the product name actually contains at least one of the query terms exactly
    const nameMatchesAnyQueryToken = coreTokens.some((qt) =>
        nameTokens.includes(qt)
    );
    if (nameMatchesAnyQueryToken || nameTokens.some((t: string) => t === queryLower)) {
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
    if (coreTokens.length > 0) {
        let overlapCount = 0;
        for (const qt of coreTokens) {
            const qtSyns = WORD_SYNONYMS[qt] ?? [];
            const isMatch = nameTokens.includes(qt) || qtSyns.some(syn => nameTokens.includes(syn));
            if (isMatch) overlapCount++;
        }
        
        // If ALL core tokens match (or their synonyms match), this is an EXACT or highly relevant match!
        if (overlapCount === coreTokens.length) {
            // Check if brand is matched. If so, give it 110!
            const queryBrand = coreTokens.find(t => ['mdh', 'everest', 'kissan', 'trs', 'haldiram', 'aashirvaad', 'patanjali', 'amul', 'pillsbury', 'fortune'].includes(t));
            if (queryBrand && nameTokens.includes(queryBrand)) {
                return 110; 
            }
            return 95; // Extremely high exact match
        }

        if (overlapCount > 0 && overlapCount >= Math.ceil(coreTokens.length / 2)) {
            return 50 + (overlapCount * 10);
        }
    }

    // ── Tier 8: Category match ──────────────────────────────────────────────────
    const matchedCategory = getCategoryFromQuery(queryLower);
    if (category && matchedCategory === category) return 85; // Boost category-specific landing pages
    if (category && (category.includes(queryLower) || queryLower.includes(category))) return 25;

    // ── Tier 9: Fuzzy Match (Typo Tolerance) ───────────────────────────────────
    if (coreTokens.length > 0) {
        let fuzzyMatches = 0;
        for (const qt of coreTokens) {
            if (qt.length < 4) continue; // Only fuzzy match longer words
            const hasFuzzyMatch = significantTokens.some((nt: string) => {
                if (Math.abs(nt.length - qt.length) > 2) return false;
                const dist = levenshteinDistance(qt, nt);
                return dist <= 2 && dist <= Math.floor(qt.length / 3);
            });
            if (hasFuzzyMatch) fuzzyMatches++;
        }
        if (fuzzyMatches > 0 && fuzzyMatches >= Math.ceil(coreTokens.length / 2)) {
            return 45 + (fuzzyMatches * 5);
        }
    } else if (queryLower.length >= 4) {
        // Single word query typo tolerance
        const hasFuzzyMatch = significantTokens.some((nt: string) => {
            if (Math.abs(nt.length - queryLower.length) > 2) return false;
            const dist = levenshteinDistance(queryLower, nt);
            return dist <= 2 && dist <= Math.floor(queryLower.length / 3);
        });
        if (hasFuzzyMatch) return 45;
    }

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
    originalPrice?: number | null;
    rating?: number;
    ratingCount?: number;
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
        
        // Find the first valid image in the group
        let validImage = sortedGroup.find((l: any) => l.image_url && l.image_url.trim() !== '')?.image_url;

        // Fallback logic: if no image in the exact group, borrow one from a highly similar product
        if (!validImage || validImage.trim() === '') {
            const bestTokens = (best.product_name || '').toLowerCase().split(/[^a-z0-9]+/).filter((t: string) => t.length >= 3 && !/^\d+/.test(t));
            if (bestTokens.length >= 2) {
                const fallbackItem = scored.find((other: any) => {
                    if (!other.image_url || other.image_url.trim() === '') return false;
                    const otherTokens = (other.product_name || '').toLowerCase().split(/[^a-z0-9]+/).filter((t: string) => t.length >= 3 && !/^\d+/.test(t));
                    let overlap = 0;
                    for (const t of bestTokens) {
                        if (otherTokens.includes(t)) overlap++;
                    }
                    // Require at least 2 matching tokens, or 3 if the product name has many tokens
                    const requiredOverlap = Math.max(2, Math.min(3, Math.ceil(bestTokens.length / 2)));
                    return overlap >= requiredOverlap;
                });
                if (fallbackItem) {
                    validImage = fallbackItem.image_url;
                }
            }
        }

        // Tier 2 Fallback: if still no image anywhere, generate a beautiful, realistic, server-cached AI mockup
        if (!validImage || validImage.trim() === '') {
            const slug = best.product_slug || best.id;
            validImage = getProductImage(best.product_name, slug, best.product_category);
        }

        return {
            id: best.product_id || best.id,
            product_name: best.product_name,
            product_slug: best.product_slug,
            product_category: best.product_category,
            image_url: validImage || best.image_url,
            _score: best._score,
            bestPrice: Number(best.price),
            bestStore: best.store_name,
            originalPrice: best.originalPrice ?? null,
            rating: best.rating ? Number(best.rating) : undefined,
            ratingCount: best.ratingCount ? Number(best.ratingCount) : undefined,
            allPrices: sortedGroup.map(l => ({
                id: l.id,
                store_name: l.store_name,
                price: Number(l.price),
                availability: l.availability,
                product_url: l.product_url,
                image_url: l.image_url || validImage, // Inherit best available/generated image for this product
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
        const name = product?.name ?? l.product_name ?? '';
        const rawCategory = product?.category ?? l.product_category ?? '';
        const img = l.image_url ?? null;
        
        // Run visual-textual mismatch analyzer on-the-fly for immediate correction on cached data
        const analysis = analyzeProductImageAndName(name, img, rawCategory);
        const productCategory = analysis.isMismatch && analysis.detectedCategory 
            ? analysis.detectedCategory 
            : rawCategory;

        return {
            ...l,
            products: undefined,
            stores: undefined,
            store_logo_url: store?.logo_url ?? null,
            product_name: name,
            product_slug: product?.slug ?? l.product_slug ?? null,
            product_category: productCategory,
            search_terms: product?.search_terms ?? l.search_terms ?? [],
            originalPrice: l.compare_price ? Number(l.compare_price) : null,
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

            // Clean name of redundant phrases
            const cleanName = item.name
                .replace(/\s*[|-]?\s*Details in the shop/gi, '')
                .replace(/\s*[|-]?\s*Details im shop/gi, '')
                .trim();

            const inferredCategory = inferCategory(cleanName);
            const analysis = analyzeProductImageAndName(cleanName, item.imageUrl, inferredCategory);
            const productCategory = analysis.isMismatch && analysis.detectedCategory 
                ? analysis.detectedCategory 
                : inferredCategory;
            const slug = cleanName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '')
                .slice(0, 80);

            try {
                // Fetch existing product to preserve search_terms
                const { data: existing } = await supabase
                    .from('products')
                    .select('id, search_terms')
                    .eq('slug', slug)
                    .maybeSingle();

                let updatedTerms = existing?.search_terms || [];
                
                // Only add queryLower if it's relevant to the product name
                const synonyms = SYNONYM_MAP[queryLower] ?? [];
                const isRelevant = scoreRelevance({
                    product_name: cleanName,
                    product_category: productCategory,
                    search_terms: []
                }, queryLower, synonyms) > 0;

                if (isRelevant && !updatedTerms.includes(queryLower)) {
                    updatedTerms.push(queryLower);
                }

                const { data: product } = await supabase
                    .from('products')
                    .upsert(
                        { name: cleanName, slug, category: productCategory, search_terms: updatedTerms },
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
                        compare_price: item.comparePrice ?? null,
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

                if (listing && isRelevant) {
                    allListings.push({
                        ...listing,
                        _score: 0,
                        store_logo_url: store.logo_url ?? null,
                        product_name: product.name ?? null,
                        product_slug: product.slug ?? null,
                        product_category: product.category ?? null,
                        search_terms: product.search_terms ?? [],
                        originalPrice: listing.compare_price ? Number(listing.compare_price) : null,
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

export function inferCategory(name: string): string {
    const combined = name.toLowerCase();
    const hasWord = (regex: RegExp) => regex.test(combined);
    if (hasWord(/\b(rusk|rusks|toastea|toast|drycake)\b/)) return 'snacks';
    if (hasWord(/\b(sweet|mithai|halwa|ladoo|barfi|pedha|rasgulla|gulab\s+jamun|kheer|dessert)\b/)) return 'sweets';
    if (hasWord(/\b(paneer|yogurt|yoghurt|curd|dahi|milk|cream|butter|dairy|lassi|cheese)\b/)) return 'dairy';
    if (hasWord(/\b(rice|chawal|basmati|sona|sonamasoori|poha)\b/)) return 'rice';
    if (hasWord(/\b(atta|aata|flour|besan|maida|sooji|suji|rava|semolina)\b/)) return 'flour';
    if (hasWord(/\b(dal|lentil|bean|beans|chana|toor|moong|masoor|rajma|lobia|urad|kabuli)\b/)) return 'lentils';
    if (hasWord(/\b(soap|shampoo|conditioner|toothpaste|toothbrush|hand\s*wash|face\s*wash|body\s*wash|dish\s*wash|cleaner|detergent|scrub|lotion|moisturizer|cream|gel|hair\s*oil|hair\s*cream|hair\s*dye|hair\s*colour|henna|mehendi|talc|talcum|baby\s*powder|face\s*powder|sanitizer|disinfectant|harpic|colgate|pepsodent|sensodyne|pears|dettol|lifebuoy|dove|lux|fiama|cinthol|hamam|mysore\s*sandal|medimix|santoor|margo|himalaya|neem\s*soap|shikakai|reetha|ayur)\b/)) return 'care';
    if (hasWord(/\b(agarbatti|incense|dhoop|pooja|puja|diya|camphor|kapoor|cotton\s+wicks|matchbox)\b/)) return 'pooja';
    if (hasWord(/\b(ghee|butter\s+ghee)\b/)) return 'oil-ghee';
    if (hasWord(/\b(oil|cooking\s+oil|mustard\s+oil|coconut\s+oil|sunflower\s+oil)\b/)) return 'oil-ghee';
    if (hasWord(/\b(chai\s+masala|tea\s+masala|tea\s+spice)\b/)) return 'spices';
    if (hasWord(/\b(tea|chai|coffee|drink|juice|beverage|cocoa|premix)\b/) && !hasWord(/\b(biscuit|cookie|puri|cracker|chips)\b/)) return 'beverages';
    if (hasWord(/\b(spice|masala|turmeric|cumin|coriander|cardamom|pepper|chilli|haldi|jeera|rai|mustard\s+seeds|fennel|methi|fenugreek|hing|asafoetida|cinnamon|cloves|elaichi|ajwain)\b/)) return 'spices';
    if (hasWord(/\b(snack|namkeen|chips|biscuit|cookie|biscuits|cookies|mixture|sev|bhujia|papads|papad|murukku|gathia|mix|khatta\s+meetha|navrattan|panchrattan|dalmoth|chanachur|all\s+in\s+one|puri|crackers|mathri|mathis|mathi|mathia|khakhra|gathiya|pakoda|pakora|chivda|farsan)\b/)) return 'snacks';
    if (hasWord(/\b(pickle|chutney|achaar|sauce|paste|ketchup|spread)\b/)) return 'condiments';
    if (hasWord(/\b(lemon|lime|tomato|onion|potato|vegetable|fruit|nimbu|ginger|garlic)\b/)) return 'fresh-produce';
    if (hasWord(/\b(frozen)\b/)) return 'frozen';
    return 'general';
}

export function getCategoryFromQuery(queryLower: string): string | null {
    const q = queryLower.trim();
    if (q === 'home care' || q === 'personal care' || q === 'beauty care' || q === 'care' || q === 'personal & home care' || q === 'body care') return 'care';
    if (q === 'pooja items' || q === 'pooja') return 'pooja';
    if (q === 'ready to eat' || q === 'ready-to-eat' || q === 'instant' || q === 'instant food') return 'instant';
    if (q === 'wheat flour' || q === 'flour mixes' || q === 'flour' || q === 'atta') return 'flour';
    if (q === 'basmati rice' || q === 'ponni rice' || q === 'rice' || q === 'basmati') return 'rice';
    if (q === 'spices masala' || q === 'spices' || q === 'masala') return 'spices';
    if (q === 'indian sweets' || q === 'sweets' || q === 'mithai') return 'sweets';
    if (q === 'namkeen snacks' || q === 'snacks' || q === 'namkeen') return 'snacks';
    if (q === 'pickles chutney' || q === 'pickles' || q === 'chutney') return 'condiments';
    if (q === 'tea coffee' || q === 'beverages' || q === 'drinks') return 'beverages';
    if (q === 'dal' || q === 'lentils' || q === 'pulses') return 'lentils';
    if (q === 'dairy' || q === 'milk' || q === 'paneer') return 'dairy';
    if (q === 'frozen' || q === 'frozen food') return 'frozen';
    return null;
}
