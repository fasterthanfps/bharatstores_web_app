'use client';

const SESSION_KEY = 'bs_sid';

/** Get or create a persistent session ID stored in localStorage */
export function getSessionId(): string {
    if (typeof window === 'undefined') return 'ssr';

    let sid = localStorage.getItem(SESSION_KEY);
    if (!sid) {
        // Try reading from cookie first to align session
        const match = document.cookie.match(new RegExp('(^| )' + SESSION_KEY + '=([^;]+)'));
        if (match) {
            sid = match[2];
            localStorage.setItem(SESSION_KEY, sid);
        }
    }

    if (!sid) {
        sid = generateId();
        localStorage.setItem(SESSION_KEY, sid);
    }

    // Always ensure cookie is set/renewed
    try {
        document.cookie = `${SESSION_KEY}=${sid}; path=/; max-age=31536000; SameSite=Lax`;
    } catch (e) {
        console.warn('Failed to set session cookie:', e);
    }

    return sid;
}

function generateId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback for older browsers
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
