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

const email = 'admin@bharatstores.com';
const password = 'BharatAdmin2026!';

async function createAdmin() {
    console.log(`Creating auth user: ${email}...`);
    
    // 1. Create the user using admin Auth API (bypasses email confirmation)
    const { data: { user }, error: authErr } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
    });

    if (authErr) {
        if (authErr.message.includes('already exists') || authErr.message.includes('already registered')) {
            console.log(`User ${email} already exists in auth.users. Fetching existing user...`);
            const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers();
            if (listErr) throw listErr;
            const existingUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
            if (!existingUser) throw new Error('Could not find existing user.');
            
            // Promote existing user
            console.log(`Promoting existing user ID ${existingUser.id} to admin...`);
            const { error: insertErr } = await supabase
                .from('admin_users')
                .upsert({ user_id: existingUser.id, role: 'admin' }, { onConflict: 'user_id' });
            
            if (insertErr) throw insertErr;
            console.log(`✅ Success! ${email} is registered and active as an admin.`);
            return;
        }
        throw authErr;
    }

    if (!user) throw new Error('Failed to create user object.');

    console.log(`User created successfully with ID: ${user.id}`);
    console.log(`Adding to admin_users table...`);

    // 2. Add to admin_users table
    const { error: dbErr } = await supabase
        .from('admin_users')
        .insert({ user_id: user.id, role: 'admin' });

    if (dbErr) throw dbErr;

    console.log(`✅ Success! admin account created and promoted.`);
}

createAdmin().catch(err => {
    console.error('❌ Error creating admin:', err.message);
    process.exit(1);
});
