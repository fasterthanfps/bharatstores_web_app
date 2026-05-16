import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import { Suspense } from 'react';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Suspense fallback={<div className="h-16 md:h-24 bg-white animate-pulse" />}>
                <Header />
            </Suspense>
            <main className="min-h-screen pb-[60px] lg:pb-0">
                {children}
            </main>
            <Footer />
            <MobileNav />
        </>
    );
}
