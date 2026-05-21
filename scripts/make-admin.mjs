#!/usr/bin/env node
/**
 * scripts/make-admin.mjs
 * ─────────────────────────────────────────────────────────────
 * Registers a user as admin in the admin_users table.
 *
 * Usage:
 *   node scripts/make-admin.mjs <email>
 *
 * Requirements:
 *   - NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be
 *     set in your .env.local (or environment).
 *   - The user must have already signed up via the app first.
 * ─────────────────────────────────────────────────────────────
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local manually (no dotenv dependency needed)
try {
    const envPath = resolve(__dirname, '../.env.local');
    const lines = readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
        const [key, ...rest] = line.split('=');
        if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
    }
} catch { /* .env.local not found — rely on environment variables */ }

const url     = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !service) {
    console.error('❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const email = process.argv[2];
if (!email) {
    console.error('❌  Usage: node scripts/make-admin.mjs <email>');
    process.exit(1);
}

const supabase = createClient(url, service, { auth: { persistSession: false } });

// 1. Find user by email
const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers();
if (listErr) { console.error('❌  Failed to list users:', listErr.message); process.exit(1); }

const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
if (!user) {
    console.error(`❌  No user found with email: ${email}`);
    console.error('    The user must sign up through the app before being made admin.');
    process.exit(1);
}

// 2. Insert into admin_users (upsert safe)
const { error: insertErr } = await supabase
    .from('admin_users')
    .upsert({ user_id: user.id, role: 'admin' }, { onConflict: 'user_id' });

if (insertErr) {
    console.error('❌  Failed to add admin:', insertErr.message);
    process.exit(1);
}

console.log(`✅  ${email} (${user.id}) is now an admin.`);
console.log('    They can access /admin after logging in.');
