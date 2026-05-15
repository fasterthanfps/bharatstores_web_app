import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { saveAndReturnListings } from '@/lib/search/engine';

export const dynamic = 'force-dynamic';

const POPULAR_SEARCHES = [
    'basmati rice',
    'atta',
    'ghee',
    'paneer',
    'dal',
    'maggi',
    'mdh masala',
    'haldiram',
    'tea',
    'amul'
];

export async function GET(req: NextRequest) {
    // Basic authorization for cron
    const authHeader = req.headers.get('authorization');
    if (
        authHeader !== `Bearer ${process.env.CRON_SECRET}` && 
        process.env.NODE_ENV === 'production'
    ) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { ScraperOrchestrator } = await import('@/lib/scraper');
        const orchestrator = new ScraperOrchestrator();
        const serviceClient = createServiceClient();

        console.log(`[Cron] Starting background cache refresh for top ${POPULAR_SEARCHES.length} items`);

        // Process sequentially to not overload the servers
        const results = [];
        for (const query of POPULAR_SEARCHES) {
            console.log(`[Cron] Scraping: ${query}`);
            try {
                const scraperResults: any = await Promise.race([
                    orchestrator.runAll(query),
                    new Promise<null>((_, reject) =>
                        setTimeout(() => reject(new Error('Scraper timeout')), 45000)
                    ),
                ]);

                if (scraperResults) {
                    const listings = await saveAndReturnListings(scraperResults, query, serviceClient, 'price');
                    results.push({ query, count: listings.length });
                } else {
                    results.push({ query, count: 0, status: 'timeout' });
                }
            } catch (err: any) {
                console.error(`[Cron] Error on ${query}:`, err.message);
                results.push({ query, count: 0, error: err.message });
            }
        }

        console.log(`[Cron] Background cache refresh complete.`);
        return NextResponse.json({ success: true, results });
    } catch (e: any) {
        console.error('[Cron] Failed to run orchestrator:', e.message);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
