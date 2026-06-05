import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    
    // Sign out from Supabase (clears the session cookies via SSG/SSR cookies)
    await supabase.auth.signOut();
    
    // Redirect to login page
    return NextResponse.redirect(new URL('/login', request.url), {
        status: 302,
    });
}
