'use client';

import { useEffect, useState } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CompareTrayItem {
  id: string;
  name: string;
  image_url?: string;
  price: number;
}

interface CompareTrayProps {
  items: CompareTrayItem[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

export default function CompareTray({ items, onRemove, onClear }: CompareTrayProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(items.length > 0);
  }, [items.length]);

  if (items.length === 0) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 bg-masala-text text-white px-4 py-3 shadow-2xl transition-transform duration-300 ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
      style={{ animation: visible ? 'slideInFromBottom 0.3s ease forwards' : undefined }}
    >
      <div className="mx-auto max-w-7xl flex items-center gap-4">
        {/* Thumbnails */}
        <div className="flex items-center gap-2 flex-1">
          {items.map((item) => (
            <div key={item.id} className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-contain" />
                ) : (
                  <span className="text-lg">🛒</span>
                )}
              </div>
              <button
                onClick={() => onRemove(item.id)}
                className="absolute -top-1 -right-1 w-4 h-4 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/40 transition-colors"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
          {[...Array(Math.max(0, 3 - items.length))].map((_, i) => (
            <div
              key={`empty-${i}`}
              className="w-10 h-10 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center"
            >
              <span className="text-white/30 text-xs font-bold">+</span>
            </div>
          ))}
          <p className="text-sm font-bold ml-2 hidden sm:block">
            {items.length}/3 products ready to compare
          </p>
          <p className="text-sm font-bold ml-2 sm:hidden">
            {items.length}/3 ready
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onClear}
            className="text-white/60 hover:text-white text-xs font-medium transition-colors px-2 py-1"
          >
            Clear
          </button>
          <button
            onClick={() => router.push(`/compare?ids=${items.map(i => i.id).join(',')}`)}
            className="flex items-center gap-1.5 bg-masala-primary text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-masala-accent transition-colors"
          >
            Compare ({items.length})
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
