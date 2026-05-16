'use client';

import { useState } from 'react';
import { X, ArrowRight, BarChart3, ChevronUp, ChevronDown, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CompareTrayItem {
  id: string;
  name: string;
  image_url?: string;
  bestPrice: number;
}

interface CompareTrayProps {
  items: CompareTrayItem[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

export default function CompareTray({ items, onRemove, onClear }: CompareTrayProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] w-[95%] max-w-2xl animate-in slide-in-from-bottom-10 duration-500">
      <div className="bg-[#1A1A1A] text-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden border border-white/10 backdrop-blur-xl">
        
        {/* Header / Summary Bar */}
        <div 
          className="px-6 py-4 flex items-center justify-between cursor-pointer group"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-masala-primary flex items-center justify-center shadow-lg shadow-masala-primary/30">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 leading-none mb-1.5">Comparison Tray</p>
              <h4 className="text-sm font-black truncate">{items.length} {items.length === 1 ? 'Product' : 'Products'} selected</h4>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <button
               onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
               className="hidden sm:flex w-8 h-8 rounded-full bg-white/5 items-center justify-center hover:bg-white/10 transition-all border border-white/5"
             >
               {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
             </button>
             <button
               onClick={(e) => { e.stopPropagation(); onClear(); }}
               className="text-[11px] font-black uppercase tracking-widest text-white/30 hover:text-white transition-colors px-2"
             >
               Clear
             </button>
             <button
               onClick={(e) => { e.stopPropagation(); router.push(`/compare?ids=${items.map(i => i.id).join(',')}`); }}
               className="bg-masala-primary text-white text-[12px] font-black px-5 sm:px-6 py-2.5 rounded-xl hover:bg-masala-secondary transition-all flex items-center gap-2 shadow-lg shadow-masala-primary/20 active:scale-95"
             >
               Compare <ArrowRight className="h-3.5 w-3.5" />
             </button>
          </div>
        </div>

        {/* Expanded View */}
        {isExpanded && (
          <div className="px-6 pb-6 pt-2 border-t border-white/5 animate-in slide-in-from-bottom-4 duration-300">
             <div className="grid grid-cols-3 gap-3">
                {items.map((item) => (
                  <div key={item.id} className="relative group/item bg-white/5 rounded-2xl p-3 border border-white/10 hover:border-white/20 transition-all">
                     <div className="aspect-square bg-white rounded-xl mb-2 flex items-center justify-center overflow-hidden">
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-contain p-2" />
                     </div>
                     <p className="text-[10px] font-bold truncate mb-1 text-white/90">{item.name}</p>
                     <p className="text-xs font-black text-masala-primary">€{item.bestPrice?.toFixed(2)}</p>
                     <button
                        onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg opacity-100 sm:opacity-0 sm:group-hover/item:opacity-100 transition-opacity z-20"
                     >
                        <X className="h-3 w-3" />
                     </button>
                  </div>
                ))}
                {[...Array(Math.max(0, 3 - items.length))].map((_, i) => (
                  <div key={i} className="rounded-2xl border-2 border-dashed border-white/5 flex items-center justify-center aspect-square opacity-20">
                     <Plus className="h-6 w-6" />
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
