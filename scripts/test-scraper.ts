
import { LittleIndiaScraper } from '../lib/scraper/stores/littleindia';

async function test() {
    const scraper = new LittleIndiaScraper();
    const query = 'rice';
    console.log(`Scraping Little India for "${query}"...`);
    const result = await scraper.scrape(query);
    console.log('Result:', JSON.stringify(result, null, 2));
}

test().catch(console.error);
