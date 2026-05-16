'use client';
import SearchAutocomplete from './SearchAutocomplete';
import { Search } from 'lucide-react';

export default function HeroSearch() {
  return (
    <div className="relative group">
      {/* Decorative glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-masala-primary/20 to-masala-accent/20 
        rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-1000 group-focus-within:duration-200" />
      
      <div className="relative bg-white rounded-2xl shadow-xl border border-masala-border 
        focus-within:border-masala-primary/50 transition-all duration-300">
        <div className="flex items-center px-6">
          <Search className="h-5 w-5 text-masala-text-muted mr-4" />
          <div className="flex-1">
            <SearchAutocomplete size="hero" autoFocus />
          </div>
          <button className="hidden sm:block ml-4 px-6 py-2.5 bg-masala-primary text-white 
            font-bold rounded-xl hover:shadow-lg hover:bg-masala-primary/90 transition-all">
            Search
          </button>
        </div>
      </div>
      
      {/* Popular shortcuts */}
      <div className="mt-4 flex flex-wrap gap-2 justify-center lg:justify-start">
        <span className="text-[11px] font-bold text-masala-text-muted uppercase tracking-wider mr-2 self-center">
          Popular:
        </span>
        {['Basmati Rice', 'Amul Ghee', 'Toor Dal', 'Maggi'].map((term) => (
          <a
            key={term}
            href={`/search?q=${encodeURIComponent(term)}`}
            className="text-[12px] font-bold text-masala-text hover:text-masala-primary 
              bg-white/50 border border-masala-border rounded-full px-3 py-1 transition-all"
          >
            {term}
          </a>
        ))}
      </div>
    </div>
  );
}
