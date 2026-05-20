import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// ── Smart Helper Functions for Semantic Similarity ──────────────────────────

function extractWeightGrams(label: string | null): number | null {
  if (!label) return null;
  const clean = label.toLowerCase().replace(/\s+/g, '');
  const match = clean.match(/^(\d+(?:\.\d+)?)(kg|g|l|ml)$/);
  if (!match) return null;
  const num = parseFloat(match[1]);
  const unit = match[2];
  if (unit === 'kg' || unit === 'l') return num * 1000;
  return num;
}

const BRANDS = [
  'kissan', 'mdh', 'trs', 'haldiram', 'ashoka', 'patanjali',
  'aashirvaad', 'heera', 'amul', 'everest', 'catch', 'kohinoor', 
  'maggi', 'pillsbury', 'daawat', 'tilda', 'india gate'
];

function getBrand(name: string): string | null {
  const nameLower = name.toLowerCase();
  for (const brand of BRANDS) {
    if (nameLower.includes(brand)) return brand;
  }
  return null;
}

function tokenize(str: string): string[] {
  return str.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(t => t.length >= 2);
}

function normalizeName(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const supabase = createServiceClient();

    // 1. Fetch product with exact listings
    const { data: product, error: productError } = await supabase
      .from('products')
      .select(`
        *,
        listings (*)
      `)
      .eq('id', id)
      .single();

    if (productError || !product) {
      console.error('Error fetching product from Supabase:', productError);
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const exactListings = product.listings || [];

    // ── Smart Fallback for Product Image URL ─────────────────────────
    const firstListingWithImage = exactListings.find((l: any) => l.image_url && l.image_url.trim() !== '');
    const productImageUrl = product.image_url || (firstListingWithImage ? firstListingWithImage.image_url : null);

    // 2. Advanced Semantic Comparison Logic (Same or Similar products)
    const brand = getBrand(product.name);
    const category = product.category;
    const currentWeightGrams = extractWeightGrams(exactListings[0]?.weight_label);
    const currentNameLower = product.name.toLowerCase();

    // Atta / Wheat interchangeability check
    const isFlourAtta = /atta|wheat|flour|chapati/.test(currentNameLower);
    // Ghee interchangeability check
    const isGhee = /ghee|butter/.test(currentNameLower);

    // Fetch all listings in the same category to scan for similar offers
    const categoryQuery = supabase
      .from('listings')
      .select('*');

    const { data: categoryListings, error: listingsError } = category
      ? await categoryQuery.ilike('product_category', `%${category}%`)
      : await categoryQuery.limit(2000);

    let matchedListings = [...exactListings];
    let alternativesList: any[] = [];

    if (!listingsError && categoryListings) {
      const parsedMatches = categoryListings.filter((l: any) => {
        // Skip if already in exact listings
        if (exactListings.some((el: any) => el.id === l.id)) return false;

        const otherNameLower = (l.product_name || '').toLowerCase();

        // B. Weight match filter (must be within +/- 20% range)
        if (currentWeightGrams) {
          const otherWeightGrams = extractWeightGrams(l.weight_label);
          if (otherWeightGrams) {
            const ratio = otherWeightGrams / currentWeightGrams;
            if (ratio < 0.8 || ratio > 1.2) return false;
          }
        }

        // C. Smart semantic rules
        if (isFlourAtta) {
          // Atta and Wheat flour are the same category/product
          return /atta|wheat|flour|chapati/.test(otherNameLower);
        }

        if (isGhee) {
          // Ghee and clarified butter match
          return /ghee|butter/.test(otherNameLower);
        }

        // For other categories, enforce matching at least 2 primary tokens
        const currentTokens = tokenize(product.name).filter(t => t !== brand && t !== 'grams' && t !== 'kg');
        const otherTokens = tokenize(l.product_name || '');
        const intersection = currentTokens.filter(t => otherTokens.includes(t));
        
        return intersection.length >= Math.min(2, currentTokens.length);
      });

      // Split matches into same brand (or no brand) and alternative brands
      const sameBrandMatches: any[] = [];
      const alternativeListings: any[] = [];

      parsedMatches.forEach((l: any) => {
        const otherBrand = getBrand(l.product_name || '');
        if (brand && otherBrand && otherBrand !== brand) {
          alternativeListings.push(l);
        } else {
          sameBrandMatches.push(l);
        }
      });

      // Group same brand listings by store and pick the cheapest
      const storeMap = new Map<string, any>();
      exactListings.forEach((el: any) => storeMap.set(el.store_name, el));

      sameBrandMatches.forEach((match: any) => {
        if (!storeMap.has(match.store_name)) {
          storeMap.set(match.store_name, match);
        } else {
          const existing = storeMap.get(match.store_name);
          const currentPrice = Number(match.price);
          const existingPrice = Number(existing.price);
          const currentInStock = match.availability !== 'OUT_OF_STOCK';
          const existingInStock = existing.availability !== 'OUT_OF_STOCK';

          if ((currentInStock && !existingInStock) || (currentPrice < existingPrice && currentInStock === existingInStock)) {
            storeMap.set(match.store_name, match);
          }
        }
      });

      matchedListings = Array.from(storeMap.values());

      // Group alternative brand listings by product ID or name
      const alternativesGrouped = new Map<string, any>();
      alternativeListings.forEach((l: any) => {
        const key = l.product_id || l.product_name || l.id;
        if (!alternativesGrouped.has(key)) {
          alternativesGrouped.set(key, {
            id: l.product_id || l.id,
            name: l.product_name,
            brand: getBrand(l.product_name) || 'Other',
            imageUrl: l.image_url,
            category: l.product_category,
            weightLabel: l.weight_label || null,
            prices: []
          });
        }
        
        const group = alternativesGrouped.get(key);
        const slug = l.store_name.toLowerCase().replace(/\s+/g, '');
        group.prices.push({
          storeSlug: slug,
          storeName: l.store_name,
          price: Number(l.price),
          pricePerKg: l.price_per_kg ? Number(l.price_per_kg) : null,
          inStock: l.availability !== 'OUT_OF_STOCK',
          url: l.product_url,
          storeHandle: l.store_handle || null,
          variantId: l.variant_id || null,
        });
      });

      // Sort prices within each alternative, compute bestPrice
      alternativesList = Array.from(alternativesGrouped.values()).map((alt: any) => {
        alt.prices.sort((a: any, b: any) => a.price - b.price);
        alt.bestPrice = alt.prices[0]?.price || 0;
        alt.bestPricePerKg = alt.prices[0]?.pricePerKg || null;
        alt.inStock = alt.prices.some((p: any) => p.inStock);
        return alt;
      });

      // Sort alternative products by their lowest price
      alternativesList.sort((a: any, b: any) => a.bestPrice - b.bestPrice);
    }

    // Sort listings by price
    matchedListings.sort((a: any, b: any) => Number(a.price) - Number(b.price));

    const exactListingIds = new Set((exactListings || []).map((l: any) => l.id));
    const normalizedProductName = normalizeName(product.name || '');

    // Fetch last 30 days of price history
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: historyData, error: historyError } = await supabase
      .from('price_history')
      .select('*')
      .eq('product_id', id)
      .gte('recorded_at', thirtyDaysAgo)
      .order('recorded_at', { ascending: true });

    if (historyError) {
      console.error('Error fetching price history:', historyError);
    }

    // Map listings to prices array expected by the modal
    const prices = matchedListings.map((l: any) => {
      const slug = l.store_name.toLowerCase().replace(/\s+/g, '');
      const listingName = l.product_name || '';
      const normalizedListingName = normalizeName(listingName);
      const isExactMatch = exactListingIds.has(l.id)
        || normalizedListingName === normalizedProductName;

      return {
        id: l.id,
        storeSlug: slug,
        price: Number(l.price),
        pricePerKg: l.price_per_kg ? Number(l.price_per_kg) : null,
        inStock: l.availability !== 'OUT_OF_STOCK',
        listingName,
        listingWeight: l.weight_label || null,
        isExactMatch,
        url: l.product_url,
        storeHandle: l.store_handle || null,
        variantId: l.variant_id || null,
        updatedAt: l.updated_at ? new Date(l.updated_at).toISOString() : new Date().toISOString(),
      };
    });

    // Map history
    const historyList = historyData || [];
    let mappedHistory = historyList.map((h: any) => ({
      storeSlug: h.store_slug || '',
      price: Number(h.price),
      inStock: h.in_stock !== false,
      recordedAt: h.recorded_at ? new Date(h.recorded_at).toISOString() : new Date().toISOString(),
    }));

    // Backfill day-0 data point if history is empty
    if (mappedHistory.length === 0 && prices.length > 0) {
      mappedHistory = prices.flatMap((p: any) => [
        {
          storeSlug: p.storeSlug,
          price: p.price,
          inStock: p.inStock,
          recordedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          storeSlug: p.storeSlug,
          price: p.price,
          inStock: p.inStock,
          recordedAt: new Date().toISOString(),
        },
      ]);
    }

    // Compute analytics from history
    const allPrices = mappedHistory.map((h: any) => h.price);
    const analytics = allPrices.length > 0 ? {
      allTimeHigh: Math.max(...allPrices),
      allTimeLow: Math.min(...allPrices),
      avg30d: allPrices.reduce((a, b) => a + b, 0) / allPrices.length,
      currentBest: prices.find((p: any) => p.inStock)?.price ?? null,
      isBuyNow: prices.find((p: any) => p.inStock)?.price
        ? prices.find((p: any) => p.inStock)!.price < (allPrices.reduce((a, b) => a + b, 0) / allPrices.length) * 0.97
        : false,
    } : null;

    // Return mapped response compatible with the modal
    return NextResponse.json({
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        category: product.category,
        brand: product.brand,
        imageUrl: productImageUrl,
        searchTerms: product.search_terms,
        createdAt: product.created_at ? new Date(product.created_at).toISOString() : new Date().toISOString(),
        updatedAt: product.updated_at ? new Date(product.updated_at).toISOString() : new Date().toISOString(),
        prices,
      },
      alternatives: alternativesList.slice(0, 6),
      history: mappedHistory,
      analytics,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' }
    });
  } catch (error: any) {
    console.error('Error fetching product details API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
