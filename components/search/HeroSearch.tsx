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
      
    </div>
  );
}
