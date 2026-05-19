// components/ui/ProductCardSkeleton.tsx

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-[20px] overflow-hidden animate-pulse"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>

      {/* Image zone skeleton */}
      <div className="relative w-full" style={{ paddingBottom: '100%' }}>
        <div className="absolute inset-0 bg-[#F0EAE0]">
          {/* Weight pill placeholder */}
          <div className="absolute bottom-2 left-2 h-6 w-14 rounded-lg bg-[#D4C5B0]/60" />
          {/* ADD button placeholder */}
          <div className="absolute bottom-2 right-2 h-8 w-16 rounded-xl bg-masala-primary/20" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="p-3 space-y-2">
        <div className="h-7 bg-masala-muted rounded-lg w-2/3" />     {/* price */}
        <div className="h-3 bg-masala-muted rounded-full w-1/3" />   {/* per kg */}
        <div className="space-y-1.5">
          <div className="h-3.5 bg-masala-muted rounded-full w-full" />
          <div className="h-3.5 bg-masala-muted rounded-full w-4/5" />
          <div className="h-3.5 bg-masala-muted rounded-full w-3/5" />
        </div>
        <div className="h-4 bg-masala-muted rounded-full w-1/2" />   {/* store badge */}
        <div className="h-3 bg-masala-muted rounded-full w-2/3" />   {/* rating */}
        <div className="h-px bg-masala-border mt-2" />
        <div className="h-3 bg-masala-muted rounded-full w-2/5" />   {/* see more */}
      </div>
    </div>
  );
}

// Grid of skeletons for Suspense fallbacks
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
