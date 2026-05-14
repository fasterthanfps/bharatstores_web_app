'use client';

import { getSessionId } from './sessionId';

/**
 * POST /api/clicks to log an affiliate click, then redirect via /api/go.
 * Returns true if the click was logged successfully.
 */
export async function trackClick(listingId: string): Promise<boolean> {
    const sessionId = getSessionId();
    try {
        await fetch('/api/clicks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ listingId, sessionId }),
        });
        return true;
    } catch {
        return false;
    }
}

/** Build the affiliate redirect URL */
export function buildGoUrl(listingId: string): string {
    const sessionId = getSessionId();
    return `/api/go?lid=${encodeURIComponent(listingId)}&sid=${encodeURIComponent(sessionId)}`;
}
