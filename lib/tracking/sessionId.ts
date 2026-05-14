'use client';

const SESSION_KEY = 'bs_sid';

/** Get or create a persistent session ID stored in localStorage */
export function getSessionId(): string {
    if (typeof window === 'undefined') return 'ssr';

    let sid = localStorage.getItem(SESSION_KEY);
    if (!sid) {
        sid = generateId();
        localStorage.setItem(SESSION_KEY, sid);
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
