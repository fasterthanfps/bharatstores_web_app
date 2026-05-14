import Link from 'next/link';
import { ShoppingBasket } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen hero-bg flex flex-col items-center justify-center px-4 py-12">
            <Link href="/" className="flex items-center gap-2 mb-8 group">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-500">
                    <ShoppingBasket className="h-4 w-4 text-white" />
                </div>
                <span className="text-xl font-bold">
                    <span className="gradient-text">Bharat</span>
                    <span className="text-white">Stores</span>
                </span>
            </Link>
            <div className="w-full max-w-md glass-card p-8">
                {children}
            </div>
        </div>
    );
}
