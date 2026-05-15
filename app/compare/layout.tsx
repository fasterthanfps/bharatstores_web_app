import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';

export default function CompareLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Header />
            <main className="min-h-screen pb-[60px] lg:pb-0">
                {children}
            </main>
            <Footer />
            <MobileNav />
        </>
    );
}
