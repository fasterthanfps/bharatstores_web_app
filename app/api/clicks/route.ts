import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { ApiResponse } from '@/types/api';

const ClickSchema = z.object({
    listingId: z.string().uuid('Invalid listing ID'),
    sessionId: z.string().min(1, 'Session ID required').max(128),
});

export async function POST(request: NextRequest) {
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json<ApiResponse<null>>(
            { success: false, error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON' } },
            { status: 400 }
        );
    }

    const parsed = ClickSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json<ApiResponse<null>>(
            { success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.message } },
            { status: 422 }
        );
    }

    const { listingId, sessionId } = parsed.data;
    const supabase = await createClient();

    const { error } = await supabase.from('clicks').insert({
        listing_id: listingId,
        session_id: sessionId,
        referrer: request.headers.get('referer') ?? null,
    });

    if (error) {
        return NextResponse.json<ApiResponse<null>>(
            { success: false, error: { code: 'DB_ERROR', message: error.message } },
            { status: 500 }
        );
    }

    return NextResponse.json<ApiResponse<{ logged: boolean }>>({
        success: true,
        data: { logged: true },
    });
}
