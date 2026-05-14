import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import Link from 'next/link';
import { BarChart3, Settings } from 'lucide-react';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // ASSUMPTION: any authenticated user can access admin for MVP.
    // DEFER: PRODUCTION — check admin role via custom claims or admin_users table.
    if (!user) redirect('/login');

    return (
        <>
            <Header />
            <main className="min-h-screen px-4 sm:px-6 lg:px-8 py-12">
                <div className="mx-auto max-w-6xl">
                    <nav className="mb-8 flex items-center gap-4 border-b border-white/8 pb-6">
                        <span className="text-sm font-medium text-orange-400 uppercase tracking-wider">
                            Admin
                        </span>
                        <Link href="/admin" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                            <BarChart3 className="h-4 w-4" />
                            Analytics
                        </Link>
                        <Link href="/admin/scrapers" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                            <Settings className="h-4 w-4" />
                            Scraper
                        </Link>
                    </nav>
                    {children}
                </div>
            </main>
        </>
    );
}
