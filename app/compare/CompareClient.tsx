'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, ExternalLink, Star } from 'lucide-react';
import Link from 'next/link';
import PriceHistorySparkline from '@/components/ui/PriceHistorySparkline';

function mockHistory(base: number) {
  return Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.now() - (6 - i) * 86400000).toISOString().split('T')[0],
    price: parseFloat((base * (0.9 + Math.random() * 0.2)).toFixed(2)),
  }));
}

const MOCK_PRODUCTS = [
  { id: '1', product_name: 'Tilda Basmati Rice 5kg', store_name: 'Dookan', price: 8.99, price_per_kg: 1.80, availability: 'IN_STOCK', product_url: '#', weight_label: '5kg', last_scraped_at: new Date(Date.now() - 7200000).toISOString() },
  { id: '2', product_name: 'Kohinoor Basmati Rice 5kg', store_name: 'Jamoona', price: 9.49, price_per_kg: 1.90, availability: 'IN_STOCK', product_url: '#', weight_label: '5kg', last_scraped_at: new Date(Date.now() - 14400000).toISOString() },
  { id: '3', product_name: 'Royal Basmati Rice 5kg', store_name: 'Grocera', price: 10.99, price_per_kg: 2.20, availability: 'OUT_OF_STOCK', product_url: '#', weight_label: '5kg', last_scraped_at: new Date(Date.now() - 21600000).toISOString() },
];

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr className="border-b border-masala-border/50 hover:bg-masala-muted/20 transition-colors">
      <td className="p-4 text-xs font-black uppercase tracking-wider text-masala-text-muted bg-masala-muted/30 whitespace-nowrap">{label}</td>
      {children}
    </tr>
  );
}

export default function CompareClient() {
  const searchParams = useSearchParams();
  const ids = searchParams.get('ids')?.split(',') ?? [];
  const [products] = useState(MOCK_PRODUCTS.slice(0, Math.max(2, ids.length || 3)));

  const lowestPrice = Math.min(...products.map(p => p.price));

  return (
    <div className="min-h-screen bg-masala-bg py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/search" className="inline-flex items-center gap-1.5 text-sm text-masala-text-muted hover:text-masala-primary transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to results
          </Link>
          <h1 className="text-4xl font-black text-masala-text" style={{ fontFamily: 'Fraunces, serif' }}>Compare Products</h1>
          <p className="text-masala-text-muted mt-1 text-sm">Comparing {products.length} products across 8 stores</p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-masala-border bg-white shadow-sm">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="border-b border-masala-border">
                <th className="w-32 p-4 text-left text-xs font-black uppercase tracking-widest text-masala-text-muted bg-masala-muted/50">Attribute</th>
                {products.map((p, i) => {
                  const isBest = p.price === lowestPrice;
                  return (
                    <th key={i} className={`p-4 text-left align-top ${isBest ? 'bg-masala-primary/5 border-t-[3px] border-masala-primary' : 'bg-white'}`}>
                      {isBest && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-masala-primary text-white text-[10px] font-black rounded-full uppercase mb-2">
                          <Star className="h-2.5 w-2.5 fill-white" /> Best Deal
                        </span>
                      )}
                      <div className="h-16 w-full bg-masala-muted rounded-xl flex items-center justify-center mb-2">
                        <span className="text-3xl">🛒</span>
                      </div>
                      <p className="text-sm font-bold text-masala-text leading-tight line-clamp-2">{p.product_name}</p>
                      <p className="text-xs text-masala-text-muted mt-0.5">{p.store_name}</p>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              <Row label="Best Price">
                {products.map((p, i) => (
                  <td key={i} className={`p-4 text-center ${p.price === lowestPrice ? 'bg-masala-primary/5' : ''}`}>
                    <span className={`text-2xl font-black ${p.price === lowestPrice ? 'text-masala-primary' : 'text-masala-text'}`} style={{ fontFamily: 'Fraunces, serif' }}>
                      €{p.price.toFixed(2)}
                    </span>
                  </td>
                ))}
              </Row>
              <Row label="Price / kg">
                {products.map((p, i) => (
                  <td key={i} className="p-4 text-center text-sm text-masala-text-muted">
                    €{p.price_per_kg.toFixed(2)}/kg
                  </td>
                ))}
              </Row>
              <Row label="Weight">
                {products.map((p, i) => (
                  <td key={i} className="p-4 text-center text-sm text-masala-text">{p.weight_label}</td>
                ))}
              </Row>
              <Row label="Availability">
                {products.map((p, i) => {
                  const ok = p.availability === 'IN_STOCK';
                  return (
                    <td key={i} className="p-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${ok ? 'text-masala-success' : 'text-masala-text-light'}`}>
                        <span className={`w-2 h-2 rounded-full ${ok ? 'bg-masala-success' : 'bg-gray-300'}`} />
                        {ok ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </td>
                  );
                })}
              </Row>
              <Row label="Updated">
                {products.map((p, i) => {
                  const ago = Math.floor((Date.now() - new Date(p.last_scraped_at).getTime()) / 3600000);
                  return <td key={i} className="p-4 text-center text-xs text-masala-text-muted">{ago}h ago</td>;
                })}
              </Row>
              <Row label="Buy Now">
                {products.map((p, i) => (
                  <td key={i} className="p-4 text-center">
                    <a href={p.product_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-masala-primary text-white text-xs font-black rounded-xl hover:bg-masala-secondary transition-colors">
                      Buy Now <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                ))}
              </Row>
            </tbody>
          </table>
        </div>

        {/* Price History */}
        <div className="mt-10">
          <h2 className="text-xl font-black text-masala-text mb-4" style={{ fontFamily: 'Fraunces, serif' }}>7-Day Price History</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {products.map((p, i) => (
              <div key={i} className="bg-white rounded-2xl border border-masala-border p-4">
                <p className="text-sm font-bold text-masala-text mb-3 line-clamp-1">{p.product_name}</p>
                <PriceHistorySparkline data={mockHistory(p.price)} width={200} height={52} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
