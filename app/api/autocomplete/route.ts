import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
    const query = req.nextUrl.searchParams.get('q')?.trim();
    if (!query || query.length < 2) {
        return NextResponse.json({ success: true, data: [] });
    }

    const supabase = await createClient();
    const queryLower = query.toLowerCase();

    try {
        // 1. Primary: Prefix match (starts with) - Limit 6
        const { data: prefixMatches } = await supabase
            .from('products')
            .select('name, category')
            .ilike('name', `${queryLower}%`)
            .limit(6);

        // 2. Secondary: Substring match (contains) - Limit 4
        // To fill out the dropdown if prefix matches are few
        let substringMatches: any[] = [];
        if ((prefixMatches?.length ?? 0) < 8) {
            const { data } = await supabase
                .from('products')
                .select('name, category')
                .ilike('name', `%${queryLower}%`)
                .not('name', 'ilike', `${queryLower}%`) // Exclude ones we already found
                .limit(8 - (prefixMatches?.length ?? 0));
            substringMatches = data ?? [];
        }

        const combined = [...(prefixMatches ?? []), ...substringMatches];

        // Deduplicate just in case (should be handled by the .not() but good for safety)
        const unique = combined.filter((v, i, a) => a.findIndex(t => (t.name === v.name)) === i);

        // Format for frontend
        const formatted = unique.map(p => ({
            name: p.name,
            category: p.category || 'general'
        }));

        return NextResponse.json({ success: true, data: formatted });
    } catch (e: any) {
        console.error('[Autocomplete API] Failed:', e.message);
        return NextResponse.json({ success: false, error: 'Failed to fetch suggestions' }, { status: 500 });
    }
}
