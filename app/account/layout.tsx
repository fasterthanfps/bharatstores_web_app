import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { User, Bell, LogOut } from 'lucide-react';

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    return (
        <>
            <Header />
            <main className="min-h-screen px-4 sm:px-6 lg:px-8 py-12">
                <div className="mx-auto max-w-5xl">
                    {/* Account nav */}
                    <nav className="mb-8 flex items-center gap-4 border-b border-white/8 pb-6">
                        <Link
                            href="/account"
                            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            <User className="h-4 w-4" />
                            Kaufhistorie
                        </Link>
                        <Link
                            href="/account/alerts"
                            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            <Bell className="h-4 w-4" />
                            Preisalarme
                        </Link>
                        <form action="/api/auth/logout" method="POST" className="ml-auto">
                            <button
                                type="submit"
                                className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-300 transition-colors"
                            >
                                <LogOut className="h-3.5 w-3.5" />
                                Abmelden
                            </button>
                        </form>
                    </nav>
                    {children}
                </div>
            </main>
            <Footer />
        </>
    );
}
