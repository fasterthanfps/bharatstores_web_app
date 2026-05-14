import type { Metadata } from 'next';
import { Outfit, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'BharatStores.eu – Indianische Lebensmittel Preisvergleich',
    template: '%s | BharatStores.eu',
  },
  description:
    'Vergleiche Preise für indische Lebensmittel bei Grocera, Jamoona und Little India. Spare Geld beim Einkaufen indischer Produkte in Deutschland.',
  keywords: [
    'indische Lebensmittel',
    'Preisvergleich',
    'Grocera',
    'Jamoona',
    'Little India',
    'Basmati Reis',
    'indische Gewürze',
    'Deutschland',
  ],
  openGraph: {
    siteName: 'BharatStores.eu',
    locale: 'de_DE',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={`${outfit.variable} ${playfair.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-[#fdf6ec] text-[#2c1810] font-sans antialiased selection:bg-[#c0392b] selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
