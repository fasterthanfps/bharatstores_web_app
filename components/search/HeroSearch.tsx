'use client';
import SearchBar from '@/components/SearchBar';

export default function HeroSearch() {
  return (
    <div className="relative group w-full max-w-2xl mx-auto">
      {/* Decorative glow */}
      <div className="absolute -inset-4 bg-gradient-to-r from-masala-primary/20 via-masala-accent/20 to-masala-primary/20 
        rounded-[3rem] blur-2xl opacity-0 group-focus-within:opacity-100 transition duration-1000 group-focus-within:duration-300" />
      
      <div className="relative w-full">
        <SearchBar size="hero" autoFocus />
      </div>
      
    </div>
  );
}
