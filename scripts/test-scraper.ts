
import { ScraperOrchestrator } from '../lib/scraper';

async function test() {
    const orchestrator = new ScraperOrchestrator();
    const query = 'basmati rice';
    console.log(`Running orchestrator for "${query}"...`);
    
    const startTime = Date.now();
    const results = await orchestrator.runAll(query);
    
    console.log(`\n--- Completed in ${Date.now() - startTime}ms ---`);
    for (const result of results) {
        console.log(`Store: ${result.storeName} (${result.storeId})`);
        console.log(`  Listings found: ${result.listings?.length ?? 0}`);
        if (result.errors && result.errors.length > 0) {
            console.log(`  Errors:`, result.errors);
        }
    }
}

test().catch(console.error);
