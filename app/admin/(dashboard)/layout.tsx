import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import Link from 'next/link';
import { BarChart3, Settings2, FileText } from 'lucide-react';
import LogoutButton from './LogoutButton';

export const dynamic = 'force-dynamic';

const NAV_LINKS = [
    { href: '/admin',          label: 'Analytics', icon: BarChart3  },
    { href: '/admin/scrapers', label: 'Scrapers',  icon: Settings2  },
    { href: '/admin/blog',     label: 'Blog',      icon: FileText   },
];


export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Must be authenticated
    if (!user) redirect('/admin/login');

    // 2. Must be in admin_users table (role-based access control)
    const { data: isAdmin } = await supabase.rpc('is_admin', { uid: user.id });
    if (!isAdmin) redirect('/'); // silent redirect — don't reveal the panel exists

    return (
        <>
            <Header />
            <main className="min-h-screen px-4 sm:px-6 lg:px-8 py-12">
                <div className="mx-auto max-w-6xl">
                    <nav className="mb-8 flex items-center gap-1 border-b border-masala-border pb-6">
                        <span className="mr-3 text-sm font-extrabold text-masala-accent uppercase tracking-wider">
                            Admin
                        </span>
                        {NAV_LINKS.map(({ href, label, icon: Icon }) => (
                            <Link
                                key={href}
                                href={href}
                                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-masala-text-muted hover:bg-masala-muted hover:text-masala-text transition-all font-semibold"
                            >
                                <Icon className="h-3.5 w-3.5" />
                                {label}
                            </Link>
                        ))}
                        <LogoutButton />
                    </nav>
                    {children}
                </div>
            </main>
        </>
    );
}
