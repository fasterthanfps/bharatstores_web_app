import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local
try {
    const envPath = resolve(__dirname, '../.env.local');
    const lines = readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
        const [key, ...rest] = line.split('=');
        if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
    }
} catch { /* ignore */ }

const url     = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !service) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(url, service, { auth: { persistSession: false } });

const updates = [
    {
        productId: 'a5e38202-945c-49de-9a67-9fb9d7618036', // Delhi Capitals XS
        listingId: 'f0f1c4ed-a091-4cbb-bc04-a58a00602499',
        slug: 'ipl-delhi-capitals-team-jersey-xs-1pc',
        url: 'https://eu.dookan.com/products/ipl-delhi-capitals-team-jersey-xs-1pc?_pos=2&_psq=ipl&_ss=e&_v=1.0'
    },
    {
        productId: 'b3990518-f2c0-4b68-b2df-caa2b3a3819e', // Punjab Kings XS
        listingId: '5000641d-3e33-4ca7-a636-7c8a08e9940c',
        slug: 'ipl-punjab-kings-team-jersey-xs-1pc',
        url: 'https://eu.dookan.com/products/ipl-punjab-kings-team-jersey-xs-1pc?_pos=3&_psq=ipl&_ss=e&_v=1.0'
    },
    {
        productId: 'ccaaafa1-be04-4666-89be-dfaf11549e31', // Rajasthan Royals XS
        listingId: 'ca427ed1-083b-438f-aa88-7c896b22f413',
        slug: 'ipl-rajasthan-royals-team-jersey-xs-1pc',
        url: 'https://eu.dookan.com/products/ipl-rajasthan-royals-team-jersey-xs-1pc?_pos=8&_psq=ipl&_ss=e&_v=1.0'
    },
    {
        productId: 'a12d23fd-0e78-4750-96b3-41c649bd12a4', // Kolkata Knight Riders XS
        listingId: '5ac275fc-0775-4a50-91b7-00fe9712fc1f',
        slug: 'ipl-kolkata-knight-riders-team-jersey-xs-1pc',
        url: 'https://eu.dookan.com/products/ipl-kolkata-knight-riders-team-jersey-xs-1pc?_pos=7&_psq=ipl&_ss=e&_v=1.0'
    },
    {
        productId: '9d41f314-c63f-46af-92b8-a8b7b344d164', // Chennai Super Kings XS
        listingId: 'b8efe8bd-964b-4328-9de7-16253a69d810',
        slug: 'ipl-2024-chennai-super-kings-team-jersey-xs-1pc',
        url: 'https://eu.dookan.com/products/ipl-2024-chennai-super-kings-team-jersey-xs-1pc?_pos=10&_psq=ipl&_ss=e&_v=1.0'
    }
];

async function main() {
    console.log("Fixing broken XS jersey slugs and URLs...");
    
    for (const update of updates) {
        console.log(`\nUpdating Product ID: ${update.productId}`);
        
        // Update product slug
        const { error: prodError } = await supabase
            .from('products')
            .update({ slug: update.slug })
            .eq('id', update.productId);

        if (prodError) {
            console.error(`❌ Error updating product: ${prodError.message}`);
        } else {
            console.log(`✅ Updated product slug to: ${update.slug}`);
        }

        // Update listing product_url
        const { error: listError } = await supabase
            .from('listings')
            .update({ product_url: update.url })
            .eq('id', update.listingId);

        if (listError) {
            console.error(`❌ Error updating listing: ${listError.message}`);
        } else {
            console.log(`✅ Updated listing URL to: ${update.url}`);
        }
    }
    console.log("\nDone!");
}

main().catch(err => {
    console.error(err);
});
