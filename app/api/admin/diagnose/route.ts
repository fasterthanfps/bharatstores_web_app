import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    // 1. Auth — must be authenticated admin
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: isAdmin } = await supabase.rpc('is_admin', { uid: user.id });
    if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Parse optional request body for targeted diagnosis
    const body = await request.json().catch(() => ({})) as {
        storeId?: string;
    };
    const { storeId } = body;

    const { ScraperOrchestrator } = await import('@/lib/scraper');
    const orchestrator = new ScraperOrchestrator();
    
    // Use a lightweight popular query for diagnostic verification
    const query = 'basmati rice'; 

    try {
        const service = createServiceClient();
        let targetStoreSlug: string | undefined;
        if (storeId) {
            const { data: store } = await service
                .from('stores')
                .select('domain')
                .eq('id', storeId)
                .maybeSingle();

            if (store?.domain) {
                const DOMAIN_TO_SCRAPER_MAP: Record<string, string> = {
                    'grocera.de': 'grocera',
                    'jamoona.com': 'jamoona',
                    'littleindia.de': 'littleindia',
                    'nammamarkt.com': 'nammamarkt',
                    'eu.dookan.com': 'dookan',
                    'swadesh.eu': 'swadesh',
                    'angaadi-online.de': 'angaadi',
                    'spicevillage.eu': 'spicevillage',
                    'dostana-foods.com': 'dostana',
                };
                targetStoreSlug = DOMAIN_TO_SCRAPER_MAP[store.domain];
            }
        }

        const results = targetStoreSlug
            ? await orchestrator.runSelected(query, [targetStoreSlug])
            : await orchestrator.runAll(query);

        const diagnosticReports = results.map(result => {
            const listings = result.listings || [];
            const errors = result.errors || [];
            
            // Asserts on standard WooCommerce/Shopify parsing items
            const checks = {
                hasListings: listings.length > 0,
                hasNames: listings.length > 0 && listings.every(l => typeof l.name === 'string' && l.name.trim().length > 2),
                hasPrices: listings.length > 0 && listings.every(l => typeof l.price === 'number' && l.price > 0),
                hasImageUrls: listings.length > 0 && listings.every(l => !l.imageUrl || l.imageUrl.startsWith('http')),
                hasProductUrls: listings.length > 0 && listings.every(l => typeof l.productUrl === 'string' && l.productUrl.startsWith('http')),
            };

            const isHealthy = !errors.length && checks.hasListings && checks.hasNames && checks.hasPrices && checks.hasProductUrls;
            const failReasons: string[] = [];
            
            if (errors.length) {
                failReasons.push(...errors);
            }
            if (!checks.hasListings) {
                failReasons.push('HTML Selector match failed: No products returned from shop.');
            } else {
                if (!checks.hasNames) failReasons.push('Markup Mismatch: Some products are missing names.');
                if (!checks.hasPrices) failReasons.push('Markup Mismatch: Some products have missing or zero price values.');
                if (!checks.hasProductUrls) failReasons.push('Markup Mismatch: Some products are missing checkout links.');
            }

            return {
                storeId: result.storeId,
                storeName: result.storeName,
                status: isHealthy ? 'healthy' : 'failed',
                latencyMs: result.durationMs,
                itemCount: listings.length,
                errors: failReasons,
                checkedAt: new Date().toISOString()
            };
        });

        // 3. Log diagnostic run as an audited scraper run to automatically update the dashboard
        for (const report of diagnosticReports) {
            await service.from('scraper_runs').insert({
                status: report.status === 'healthy' ? 'success' : 'error',
                store_id: report.storeId,
                store_name: report.storeName,
                products_found: report.itemCount,
                errors: report.errors.length ? report.errors : null,
                started_at: new Date(Date.now() - report.latencyMs).toISOString(),
                finished_at: new Date().toISOString(),
            });
        }

        return NextResponse.json({ success: true, reports: diagnosticReports });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
