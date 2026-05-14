import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { ScraperOrchestrator } from '@/lib/scraper';
import { slugify } from '@/lib/utils/slug';
import type { ScrapedListing } from '@/types/scraper';
import type { ApiResponse, ScraperRunResponse } from '@/types/api';

// Validate CRON_SECRET for Vercel cron + manual triggers
function validateAuth(request: NextRequest): boolean {
    const authHeader = request.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) return false;
    return authHeader === `Bearer ${cronSecret}`;
}

export async function POST(request: NextRequest) {
    // Auth check
    if (!validateAuth(request)) {
        return NextResponse.json<ApiResponse<null>>(
            { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or missing CRON_SECRET' } },
            { status: 401 }
        );
    }

    const body = await request.json().catch(() => ({})) as { query?: string; storeIds?: string[] };
    const { query = 'basmati rice', storeIds } = body;
    const start = Date.now();

    const supabase = createServiceClient();
    const orchestrator = new ScraperOrchestrator();

    // Create a scraper_run audit record
    const { data: runRecord } = await supabase
        .from('scraper_runs')
        .insert({ status: 'running', started_at: new Date().toISOString() })
        .select('id')
        .single();

    const runId = runRecord?.id;
    const allErrors: string[] = [];
    let totalListings = 0;

    try {
        const results = storeIds?.length
            ? await orchestrator.runSelected(query, storeIds)
            : await orchestrator.runAll(query);

        for (const result of results) {
            if (result.errors.length) {
                allErrors.push(...result.errors.map((e) => `[${result.storeName}] ${e}`));
            }

            // Get or resolve store_id
            const { data: store } = await supabase
                .from('stores')
                .select('id')
                .eq('domain', `${result.storeId}.${result.storeId === 'jamoona' ? 'com' : 'de'}`)
                .maybeSingle();

            for (const listing of result.listings) {
                await upsertListing(supabase, listing, store?.id ?? null);
                totalListings++;
            }
        }

        // Update scraper_run record
        if (runId) {
            await supabase
                .from('scraper_runs')
                .update({
                    status: allErrors.length > 0 ? 'partial' : 'success',
                    products_found: totalListings,
                    errors: allErrors.length > 0 ? allErrors : null,
                    finished_at: new Date().toISOString(),
                })
                .eq('id', runId);
        }

        return NextResponse.json<ApiResponse<ScraperRunResponse>>({
            success: true,
            data: {
                success: true,
                storesRan: results.length,
                totalListings,
                durationMs: Date.now() - start,
                errors: allErrors,
            },
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        if (runId) {
            await supabase
                .from('scraper_runs')
                .update({ status: 'error', errors: [message], finished_at: new Date().toISOString() })
                .eq('id', runId);
        }
        return NextResponse.json<ApiResponse<null>>(
            { success: false, error: { code: 'SCRAPER_ERROR', message } },
            { status: 500 }
        );
    }
}

// Also support Vercel CRON (GET with Authorization header)
export async function GET(request: NextRequest) {
    return POST(request);
}

async function upsertListing(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase: any,
    listing: ScrapedListing,
    storeId: string | null
) {
    if (!listing.name || listing.price <= 0) return;

    const slug = slugify(listing.name);

    // Find or create product
    let productId: string | null = null;
    const { data: existingProduct } = await supabase
        .from('products')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

    if (existingProduct) {
        productId = existingProduct.id;
    } else {
        const { data: newProduct } = await supabase
            .from('products')
            .insert({
                name: listing.name,
                slug,
                category: 'grocery',
                image_url: listing.imageUrl ?? null,
                search_terms: [listing.name.toLowerCase(), slug],
            })
            .select('id')
            .single();
        productId = newProduct?.id ?? null;
    }

    if (!productId || !storeId) return;

    // Upsert listing
    const { data: upserted } = await supabase
        .from('listings')
        .upsert(
            {
                product_id: productId,
                store_id: storeId,
                store_name: listing.storeName,
                price: listing.price,
                compare_price: listing.comparePrice ?? null,
                currency: 'EUR',
                availability: listing.availability,
                product_url: listing.productUrl,
                image_url: listing.imageUrl ?? null,
                weight_grams: listing.weightGrams ?? null,
                weight_label: listing.weightLabel ?? null,
                price_per_kg: listing.pricePerKg ?? null,
                last_scraped_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'product_id,store_id' }
        )
        .select('id')
        .single();

    // Also append to price_history
    if (upserted?.id) {
        await supabase.from('price_history').insert({
            listing_id: upserted.id,
            price: listing.price,
            availability: listing.availability,
        });

        // Check price alerts
        await checkPriceAlerts(supabase, upserted.id, listing.price);
    }
}

async function checkPriceAlerts(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase: any,
    listingId: string,
    currentPrice: number
) {
    const { data: alerts } = await supabase
        .from('price_alerts')
        .select('id, target_price, user_id')
        .eq('listing_id', listingId)
        .eq('is_triggered', false);

    if (!alerts?.length) return;

    for (const alert of alerts) {
        if (currentPrice <= alert.target_price) {
            await supabase
                .from('price_alerts')
                .update({ is_triggered: true, notified_at: new Date().toISOString() })
                .eq('id', alert.id);
            // DEFER: PRODUCTION — send email via Resend
        }
    }
}
