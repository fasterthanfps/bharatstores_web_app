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

    // Compute display name
    const displayName = user.user_metadata?.name || user.user_metadata?.username || user.email || 'User';
    const avatarLetter = displayName[0].toUpperCase();

    return (
        <>
            <Header />
            <main className="min-h-screen px-4 sm:px-6 lg:px-8 py-12">
                <div className="mx-auto max-w-5xl">
                    {/* User Greeting Hero Card */}
                    <div className="bg-white rounded-3xl border border-masala-border/60 p-6 md:p-8 mb-8 shadow-sm relative overflow-hidden">
                        {/* Decorative background glow orbs */}
                        <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-masala-primary/5 blur-2xl pointer-events-none" />
                        <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full bg-masala-accent/5 blur-2xl pointer-events-none" />

                        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-masala-primary to-masala-accent text-white flex items-center justify-center font-serif text-xl font-bold shadow-md shadow-masala-primary/10">
                                    {avatarLetter}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-masala-text-light uppercase tracking-wider">My Account</p>
                                    <h1 className="text-xl md:text-2xl font-serif font-black text-masala-text mt-0.5 truncate max-w-[280px] sm:max-w-md lg:max-w-lg">{displayName}</h1>
                                </div>
                            </div>
                            
                            {/* Stats panel */}
                            <div className="flex items-center gap-8 border-t md:border-t-0 md:border-l border-masala-border/60 pt-4 md:pt-0 md:pl-8">
                                <div>
                                    <span className="block text-2xl font-extrabold text-masala-primary font-serif">{clicksCount ?? 0}</span>
                                    <span className="text-[11px] font-bold text-masala-text-muted uppercase tracking-wider">Total Clicks</span>
                                </div>
                                <div>
                                    <span className="block text-2xl font-extrabold text-masala-accent font-serif">{alertsCount ?? 0}</span>
                                    <span className="text-[11px] font-bold text-masala-text-muted uppercase tracking-wider">Price Alerts</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation bar with tab options and logout */}
                    <nav className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-masala-border/40 pb-6">
                        <AccountNav />
                        
                        <form action="/api/auth/logout" method="POST" className="self-end sm:self-auto">
                            <button
                                type="submit"
                                className="flex items-center gap-2 text-xs font-bold text-masala-text-muted hover:text-masala-primary transition-all bg-masala-muted/60 hover:bg-masala-muted hover:scale-[1.02] active:scale-[0.98] px-4 py-2.5 rounded-xl border border-masala-border/40 shadow-sm cursor-pointer"
                            >
                                <LogOut className="h-3.5 w-3.5 stroke-[2.5]" />
                                Logout
                            </button>
                        </form>
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
