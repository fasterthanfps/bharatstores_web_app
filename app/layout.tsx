import type { Metadata } from 'next';
import { Fraunces, DM_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  weight: ['700', '900'],
  style: ['normal', 'italic'],
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: {
    default: 'BharatStores.eu – Indian Grocery Price Comparison in Germany',
    template: '%s | BharatStores.eu',
  },
  description:
    'Compare real-time prices for 5,000+ Indian grocery products across all major online shops in Germany and Europe. Smart, fast, and 100% free.',
  keywords: [
    'Indian groceries',
    'price comparison',
    'Grocera',
    'Jamoona',
    'Little India',
    'Basmati Rice',
    'Indian spices',
    'Germany',
    'Europe',
  ],
  openGraph: {
    siteName: 'BharatStores.eu',
    locale: 'en_GB',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-masala-bg text-masala-text font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
