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
        // 1. Primary: Prefix match (starts with) - Limit 5
        const { data: prefixMatches } = await supabase
            .from('products')
            .select('name, category, price, image_url, store_count')
            .ilike('name', `${queryLower}%`)
            .limit(5);

        // 2. Secondary: Substring match (contains) - Limit 3
        let substringMatches: any[] = [];
        if ((prefixMatches?.length ?? 0) < 8) {
            const { data } = await supabase
                .from('products')
                .select('name, category, price, image_url, store_count')
                .ilike('name', `%${queryLower}%`)
                .not('name', 'ilike', `${queryLower}%`)
                .limit(8 - (prefixMatches?.length ?? 0));
            substringMatches = data ?? [];
        }

        const combined = [...(prefixMatches ?? []), ...substringMatches];
        const unique = combined.filter((v, i, a) => a.findIndex(t => (t.name === v.name)) === i);

        const formatted = unique.map(p => ({
            name: p.name,
            category: p.category || 'general',
            price: p.price,
            image: p.image_url,
            storeCount: p.store_count || 1
        }));

        return NextResponse.json({ success: true, data: formatted });
    } catch (e: any) {
        console.error('[Autocomplete API] Failed:', e.message);
        return NextResponse.json({ success: false, error: 'Failed to fetch suggestions' }, { status: 500 });
    }
}
