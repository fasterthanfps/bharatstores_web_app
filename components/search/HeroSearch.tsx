'use client';
import SearchAutocomplete from './SearchAutocomplete';
import { Sparkles } from 'lucide-react';

export default function HeroSearch() {
  return (
    <div className="relative group w-full max-w-2xl mx-auto">
      {/* Decorative glow */}
      <div className="absolute -inset-4 bg-gradient-to-r from-masala-primary/20 via-masala-accent/20 to-masala-primary/20 
        rounded-[3rem] blur-2xl opacity-0 group-focus-within:opacity-100 transition duration-1000 group-focus-within:duration-300" />
      
      <div className="relative bg-white rounded-[1.5rem] sm:rounded-[2.2rem] shadow-2xl border border-masala-border 
        focus-within:border-masala-primary/50 focus-within:ring-8 focus-within:ring-masala-primary/5 transition-all duration-500">
        <SearchAutocomplete size="hero" autoFocus />
      </div>
      
      {/* Popular shortcuts */}
      <div className="mt-8 flex flex-wrap gap-2 justify-center animate-fade-in animation-delay-500">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/50 border border-masala-border shadow-sm">
          <Sparkles className="h-3 w-3 text-masala-primary" />
          <span className="text-[10px] font-black text-masala-text-muted uppercase tracking-widest">
            Try searching
          </span>
        </div>
        {['Basmati Rice', 'Amul Ghee', 'Toor Dal', 'Maggi'].map((term) => (
          <a
            key={term}
            href={`/search?q=${encodeURIComponent(term)}`}
            className="text-[12px] font-bold text-masala-text hover:text-masala-primary 
              hover:border-masala-primary hover:bg-white bg-white/50 border border-masala-border rounded-full px-4 py-1.5 transition-all shadow-sm hover:shadow-md"
          >
            {term}
          </a>
        ))}
      </div>
    </div>
  );
}
