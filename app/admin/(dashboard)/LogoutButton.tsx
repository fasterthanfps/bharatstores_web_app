'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LogOut } from 'lucide-react';
import { useState } from 'react';

export default function LogoutButton() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);

    const handleLogout = async () => {
        setLoading(true);
        try {
            await supabase.auth.signOut();
            router.refresh();
            router.push('/admin/login');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleLogout}
            disabled={loading}
            className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 active:scale-[0.98] transition-all border border-transparent hover:border-red-200"
            title="Logout"
        >
            <LogOut className="h-3.5 w-3.5" />
            {loading ? 'Logging out...' : 'Logout'}
        </button>
    );
}
