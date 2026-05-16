import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Everyday Best Deals — BharatStores.eu',
  description: 'Shop the biggest price drops on Indian groceries. Live price comparison across all major stores in Germany.',
};

export default function DealsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
