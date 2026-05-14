import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import type { ApiResponse } from '@/types/api';

export async function GET(request: NextRequest) {
    const supabase = createServiceClient();

    const { data, error } = await supabase
        .from('scraper_runs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);

    if (error) {
        return NextResponse.json<ApiResponse<null>>(
            { success: false, error: { code: 'DB_ERROR', message: error.message } },
            { status: 500 }
        );
    }

    return NextResponse.json<ApiResponse<typeof data>>({ success: true, data });
}
