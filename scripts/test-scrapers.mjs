import { ScraperOrchestrator } from '../lib/scraper/index.js';

async function main() {
    const orchestrator = new ScraperOrchestrator();
    
    const queries = ['cricket', 'jersey', 'ipl'];
    for (const q of queries) {
        console.log(`\n=========================================`);
        console.log(`🔍 SCRAPING FOR QUERY: "${q}"`);
        console.log(`=========================================`);
        
        try {
            const results = await orchestrator.runAll(q);
            console.log(`Scrape finished for "${q}". Got results from ${results.length} stores.`);
            for (const r of results) {
                const count = r.listings?.length ?? 0;
                console.log(`- Store: ${r.storeName} (${r.storeId}) -> Found ${count} items`);
                if (count > 0) {
                    console.log(`  Sample listings:`);
                    for (const item of r.listings.slice(0, 5)) {
                        console.log(`    * "${item.name}" (Price: ${item.price}, Url: ${item.productUrl})`);
                    }
                }
            }
        } catch (err) {
            console.error(`Error scraping for "${q}":`, err);
        }
    }
}

main().catch(console.error);
