'use client';

export default function Loading() {
  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center py-20 px-4 animate-fade-in">
      <div className="relative flex items-center justify-center">
        {/* Glow backdrop */}
        <div className="absolute w-28 h-28 rounded-full bg-gradient-to-br from-masala-primary/10 to-masala-accent/10 blur-xl animate-pulse" />
        
        {/* Spinning Rings */}
        <div className="w-16 h-16 rounded-full border-[3px] border-masala-border/40 border-t-masala-primary border-r-masala-primary animate-spin" />
        <div className="absolute w-10 h-10 rounded-full border-[3px] border-masala-border/30 border-b-masala-accent border-l-masala-accent animate-spin [animation-duration:1.5s] [animation-direction:reverse]" />
        
        {/* Brand Logo Symbol */}
        <span className="absolute text-masala-primary font-serif font-black text-sm select-none animate-pulse">
          BS
        </span>
      </div>
      
      {/* Text block */}
      <h2 className="mt-6 text-masala-text font-serif font-black text-[18px] tracking-wide animate-pulse">
        BharatStores.eu
      </h2>
      <p className="mt-2 text-masala-text-muted text-[11px] font-bold tracking-wider uppercase animate-pulse">
        Comparing grocery prices across Europe...
      </p>
    </div>
  );
}
