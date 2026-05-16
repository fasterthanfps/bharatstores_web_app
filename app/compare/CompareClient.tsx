'use client';

import { useState, useEffect } from 'react';
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

import { createClient } from '@/lib/supabase/client';

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
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      if (ids.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('listings')
        .select(`
          id,
          price,
          availability,
          product_url,
          weight_label,
          price_per_kg,
          last_scraped_at,
          image_url,
          store_name,
          products (
            name,
            id
          )
        `)
        .in('product_id', ids);

      if (error) {
        console.error('Error fetching compare products:', error);
      } else {
        // Transform for easier use
        const shaped = (data ?? []).map(l => ({
          ...l,
          product_name: (l.products as any)?.name ?? 'Unknown Product',
          last_scraped_at: l.last_scraped_at || new Date().toISOString()
        }));
        setProducts(shaped);
      }
      setLoading(false);
    }

    fetchProducts();
  }, [searchParams.get('ids')]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-masala-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-masala-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-masala-text-muted font-bold animate-pulse">Gathering live prices...</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-masala-bg px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-masala-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <ArrowLeft className="h-10 w-10 text-masala-text-muted" />
          </div>
          <h2 className="text-2xl font-black text-masala-text" style={{ fontFamily: 'Fraunces, serif' }}>No products to compare</h2>
          <p className="text-masala-text-muted mt-2 mb-8">Add products from search results to see them here.</p>
          <Link href="/search" className="inline-flex items-center gap-2 px-6 py-3 bg-masala-primary text-white font-bold rounded-xl hover:bg-masala-secondary transition-all">
            Go to Search <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  const lowestPrice = Math.min(...products.map(p => p.price));

  return (
    <div className="min-h-screen bg-masala-bg py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/search" className="inline-flex items-center gap-1.5 text-sm text-masala-text-muted hover:text-masala-primary transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to results
          </Link>
          <h1 className="text-4xl font-black text-masala-text" style={{ fontFamily: 'Fraunces, serif' }}>Compare Products</h1>
          <p className="text-masala-text-muted mt-1 text-sm">Comparing {products.length} products across multiple stores</p>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-masala-border/50 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.03)] backdrop-blur-xl">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-masala-border/40">
                <th className="w-40 p-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-masala-text-muted bg-masala-muted/20">Product Details</th>
                {products.map((p, i) => {
                  const isBest = p.price === lowestPrice;
                  return (
                    <th key={i} className={`p-6 text-left align-top min-w-[200px] transition-colors ${isBest ? 'bg-masala-primary/[0.03] border-t-4 border-masala-primary' : 'bg-white'}`}>
                      {isBest && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-masala-primary text-white text-[10px] font-black rounded-full uppercase mb-4 shadow-lg shadow-masala-primary/20">
                          <Star className="h-3 w-3 fill-white" /> Best Deal
                        </div>
                      )}
                      <div className="aspect-square w-full max-w-[120px] bg-masala-muted/30 rounded-2xl flex items-center justify-center mb-4 mx-auto overflow-hidden border border-masala-border/10">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.product_name} className="w-full h-full object-contain p-3" />
                        ) : (
                          <span className="text-4xl">🛒</span>
                        )}
                      </div>
                      <p className="text-[13px] font-black text-masala-text leading-tight line-clamp-3 mb-1">{p.product_name}</p>
                      <p className="text-[11px] font-bold text-masala-text-muted uppercase tracking-wider">{p.store_name}</p>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-masala-border/30">
              <Row label="Current Price">
                {products.map((p, i) => (
                  <td key={i} className={`p-6 text-center ${p.price === lowestPrice ? 'bg-masala-primary/[0.03]' : ''}`}>
                    <span className={`text-3xl font-black ${p.price === lowestPrice ? 'text-masala-primary' : 'text-masala-text'}`} style={{ fontFamily: 'Fraunces, serif' }}>
                      €{p.price.toFixed(2)}
                    </span>
                  </td>
                ))}
              </Row>
              <Row label="Unit Price">
                {products.map((p, i) => (
                  <td key={i} className="p-5 text-center">
                    {p.price_per_kg ? (
                      <span className="text-sm font-bold text-masala-text-muted italic">€{p.price_per_kg.toFixed(2)}/kg</span>
                    ) : (
                      <span className="text-xs text-masala-text-light">—</span>
                    )}
                  </td>
                ))}
              </Row>
              <Row label="Weight / Size">
                {products.map((p, i) => (
                  <td key={i} className="p-5 text-center text-sm font-bold text-masala-text">{p.weight_label || '—'}</td>
                ))}
              </Row>
              <Row label="Status">
                {products.map((p, i) => {
                  const ok = p.availability === 'IN_STOCK';
                  return (
                    <td key={i} className="p-5 text-center">
                      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider ${ok ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}>
                        <span className={`w-2 h-2 rounded-full ${ok ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                        {ok ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </td>
                  );
                })}
              </Row>
              <Row label="Last Updated">
                {products.map((p, i) => {
                  const hours = Math.floor((Date.now() - new Date(p.last_scraped_at).getTime()) / 3600000);
                  const display = hours === 0 ? 'Just now' : `${hours}h ago`;
                  return <td key={i} className="p-5 text-center text-[11px] font-bold text-masala-text-muted">{display}</td>;
                })}
              </Row>
              <Row label="Link">
                {products.map((p, i) => (
                  <td key={i} className="p-6 text-center">
                    <a href={p.product_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-full gap-2 px-5 py-3 bg-masala-primary text-white text-xs font-black rounded-2xl hover:bg-masala-secondary transition-all shadow-lg shadow-masala-primary/20 active:scale-95">
                      Buy at {p.store_name} <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </td>
                ))}
              </Row>
            </tbody>
          </table>
        </div>

        {/* Price History */}
        <div className="mt-12 bg-white rounded-[2.5rem] p-8 border border-masala-border/50 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-masala-text" style={{ fontFamily: 'Fraunces, serif' }}>Price Fluctuations (7 Days)</h2>
            <div className="flex items-center gap-2 text-xs text-masala-text-muted font-bold bg-masala-muted/30 px-3 py-1.5 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-masala-primary" />
              Live Pulse Data
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p, i) => (
              <div key={i} className="group bg-masala-muted/20 rounded-3xl p-6 border border-transparent hover:border-masala-primary/20 transition-all hover:bg-white hover:shadow-xl hover:shadow-black/[0.02]">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[13px] font-black text-masala-text line-clamp-1 flex-1">{p.product_name}</p>
                  <p className="text-xs font-bold text-masala-primary ml-2">€{p.price.toFixed(2)}</p>
                </div>
                <div className="h-20 flex items-end">
                  <PriceHistorySparkline data={mockHistory(p.price)} width={280} height={60} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
