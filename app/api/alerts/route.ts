import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { ApiResponse } from '@/types/api';

const AlertSchema = z.object({
    listingId: z.string().uuid(),
    targetPrice: z.number().positive(),
});

export async function GET(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json<ApiResponse<null>>(
            { success: false, error: { code: 'UNAUTHORIZED', message: 'Anmeldung erforderlich' } },
            { status: 401 }
        );
    }

    const { data, error } = await supabase
        .from('price_alerts')
        .select('*, listings(product_url, store_name, price)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        return NextResponse.json<ApiResponse<null>>(
            { success: false, error: { code: 'DB_ERROR', message: error.message } },
            { status: 500 }
        );
    }

    return NextResponse.json<ApiResponse<typeof data>>({ success: true, data });
}

export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json<ApiResponse<null>>(
            { success: false, error: { code: 'UNAUTHORIZED', message: 'Anmeldung erforderlich' } },
            { status: 401 }
        );
    }

    const body = await request.json().catch(() => ({}));
    const parsed = AlertSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json<ApiResponse<null>>(
            { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.message } },
            { status: 422 }
        );
    }

    const { data, error } = await supabase
        .from('price_alerts')
        .insert({
            user_id: user.id,
            listing_id: parsed.data.listingId,
            target_price: parsed.data.targetPrice,
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json<ApiResponse<null>>(
            { success: false, error: { code: 'DB_ERROR', message: error.message } },
            { status: 500 }
        );
    }

    return NextResponse.json<ApiResponse<typeof data>>({ success: true, data }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get('id');

    if (!alertId) {
        return NextResponse.json<ApiResponse<null>>(
            { success: false, error: { code: 'MISSING_PARAM', message: 'Alert ID required' } },
            { status: 400 }
        );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json<ApiResponse<null>>(
            { success: false, error: { code: 'UNAUTHORIZED', message: 'Anmeldung erforderlich' } },
            { status: 401 }
        );
    }

    const { error } = await supabase
        .from('price_alerts')
        .delete()
        .eq('id', alertId)
        .eq('user_id', user.id);

    if (error) {
        return NextResponse.json<ApiResponse<null>>(
            { success: false, error: { code: 'DB_ERROR', message: error.message } },
            { status: 500 }
        );
    }

    return NextResponse.json<ApiResponse<{ deleted: boolean }>>({ success: true, data: { deleted: true } });
}
