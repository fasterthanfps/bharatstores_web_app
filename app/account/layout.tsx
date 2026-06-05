import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AccountNav from '@/components/account/AccountNav';
import { LogOut } from 'lucide-react';

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/login');

    // Fetch counts for stats card
    const { count: clicksCount } = await supabase
        .from('clicks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

    const { count: alertsCount } = await supabase
        .from('price_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

    // Compute display name & avatar
    const displayName = user.user_metadata?.name || user.user_metadata?.username || user.email || 'User';
    const avatarLetter = displayName[0].toUpperCase();
    const emailUser = user.email?.split('@')[0] ?? 'User';
    const emailDomain = user.email?.split('@')[1] ?? '';

    return (
        <>
            <Header />
            <main className="min-h-screen px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                <div className="mx-auto max-w-5xl">
                    {/* ── User Greeting Hero Card ── */}
                    <div className="bg-white rounded-3xl border border-masala-border/60 p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 shadow-sm relative overflow-hidden">
                        {/* Decorative background glow orbs */}
                        <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-masala-primary/5 blur-2xl pointer-events-none" />
                        <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full bg-masala-accent/5 blur-2xl pointer-events-none" />

                        <div className="relative">
                            {/* Top row: avatar + name + logout button */}
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    {/* Avatar — smaller on mobile (FIX 2) */}
                                    <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex-shrink-0 flex items-center justify-center text-lg sm:text-2xl font-black text-white bg-gradient-to-br from-masala-primary to-masala-accent shadow-md shadow-masala-primary/10">
                                        {avatarLetter}
                                    </div>

                                    {/* Name / Email — split at @ to avoid mid-char truncation (FIX 1) */}
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-masala-text-muted mb-0.5">
                                            My Account
                                        </p>
                                        <p className="text-lg sm:text-xl font-black text-masala-text leading-tight"
                                            style={{ fontFamily: 'Fraunces, serif' }}>
                                            {emailUser}
                                        </p>
                                        {emailDomain && (
                                            <p className="text-[11px] text-masala-text-muted font-medium">
                                                @{emailDomain}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Logout — top-right corner of card (FIX 5) */}
                                <form action="/api/auth/logout" method="POST">
                                    <button
                                        type="submit"
                                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-masala-border bg-masala-muted/40 text-[11px] font-bold text-masala-text-muted hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                                    >
                                        <LogOut className="w-3.5 h-3.5" />
                                        <span>Logout</span>
                                    </button>
                                </form>
                            </div>

                            {/* Stats — icon + text horizontal layout (FIX 3) */}
                            <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-masala-border/60">
                                {[
                                    { value: clicksCount ?? 0, label: 'Total Clicks', icon: '👆', color: 'text-masala-primary' },
                                    { value: alertsCount ?? 0, label: 'Price Alerts', icon: '🔔', color: 'text-amber-600' },
                                ].map(stat => (
                                    <div key={stat.label}
                                        className="flex items-center gap-2.5 p-2.5 rounded-xl bg-masala-muted/40">
                                        <span className="text-xl flex-shrink-0">{stat.icon}</span>
                                        <div>
                                            <p className={`text-lg font-black leading-none ${stat.color}`}>
                                                {stat.value.toLocaleString()}
                                            </p>
                                            <p className="text-[10px] text-masala-text-muted font-medium mt-0.5 uppercase tracking-wide">
                                                {stat.label}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Navigation — horizontal scroll on mobile with short labels (FIX 4) */}
                    <nav className="mb-6 sm:mb-8 border-b border-masala-border/40 pb-5">
                        <AccountNav />
                    </nav>

                    <div className="animate-fade-up">
                        {children}
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}
