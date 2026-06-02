import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { saveAndReturnListings } from '@/lib/search/engine';

export async function POST(request: NextRequest) {
    // 1. Auth — must be an authenticated admin (session cookie, not CRON_SECRET)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: isAdmin } = await supabase.rpc('is_admin', { uid: user.id });
    if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Parse body
    const body = await request.json().catch(() => ({})) as {
        storeId?: string;
        storeName?: string;
        query?: string;
    };
    const { storeId, storeName, query = 'basmati rice' } = body;

    // 3. Create a scraper_run audit record
    const service = createServiceClient();
    const { data: runRecord } = await service
        .from('scraper_runs')
        .insert({
            status: 'running',
            store_id: storeId ?? null,
            store_name: storeName ?? null,
            started_at: new Date().toISOString(),
        })
        .select('id')
        .single();

    const runId = runRecord?.id;

    // 4. Fire-and-forget the actual scrape so the response returns immediately
    void (async () => {
        try {
            const { ScraperOrchestrator } = await import('@/lib/scraper');
            const orchestrator = new ScraperOrchestrator();

            // Map store UUID to scraper store slug
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

            // Save the listings to the database so they are updated
            if (results && results.length > 0) {
                await saveAndReturnListings(results, query, service, 'price');
            }

            const allErrors: string[] = [];
            let totalListings = 0;

            for (const result of results) {
                if (result.errors.length) {
                    allErrors.push(...result.errors.map((e) => `[${result.storeName}] ${e}`));
                }
                totalListings += result.listings.length;
            }

            if (runId) {
                await service
                    .from('scraper_runs')
                    .update({
                        status: allErrors.length > 0 ? 'partial' : 'success',
                        products_found: totalListings,
                        errors: allErrors.length > 0 ? allErrors : null,
                        finished_at: new Date().toISOString(),
                    })
                    .eq('id', runId);
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            if (runId) {
                await service
                    .from('scraper_runs')
                    .update({ status: 'error', errors: [message], finished_at: new Date().toISOString() })
                    .eq('id', runId);
            }
        }
    })();

    // 5. Return immediately with the run ID so client can poll status
    return NextResponse.json({ success: true, runId }, { status: 202 });
}

