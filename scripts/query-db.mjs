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

async function main() {
    console.log("Querying Supabase stores...");
    const { data: stores, error } = await supabase
        .from('stores')
        .select('id, name, domain');

    if (error) throw error;

    console.log(`Found ${stores.length} stores:`);
    for (const s of stores) {
        console.log(`- ID: ${s.id}, Name: ${s.name}, Domain: ${s.domain}`);
    }
}

main().catch(err => {
    console.error('Error querying db:', err.message);
    process.exit(1);
});
