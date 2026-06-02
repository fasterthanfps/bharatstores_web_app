import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Load .env.local
try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
        const [key, ...rest] = line.split('=');
        if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
    }
} catch { /* ignore */ }

const prisma = new PrismaClient();

async function main() {
    console.log("Searching database for products containing 'ipl' in name, slug, category, or search_terms...");
    const products = await prisma.product.findMany({
        where: {
            OR: [
                { name: { contains: 'ipl', mode: 'insensitive' } },
                { slug: { contains: 'ipl', mode: 'insensitive' } },
                { category: { contains: 'ipl', mode: 'insensitive' } },
                { searchTerms: { has: 'ipl' } }
            ]
        },
        include: {
            listings: true
        }
    });

    console.log(`Found ${products.length} products in DB:`);
    for (const p of products) {
        console.log(`- Product ID: ${p.id}`);
        console.log(`  Name: "${p.name}"`);
        console.log(`  Slug: "${p.slug}"`);
        console.log(`  Category: "${p.category}"`);
        console.log(`  Search Terms: ${JSON.stringify(p.searchTerms)}`);
        console.log(`  Listings: ${p.listings.length}`);
        for (const l of p.listings) {
            console.log(`    * Store: ${l.storeName}, Price: ${l.price}, Url: ${l.productUrl}`);
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
