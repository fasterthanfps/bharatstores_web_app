// components/ui/ProductCardSkeleton.tsx

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-masala-border animate-pulse">
      {/* Image area */}
      <div className="aspect-square bg-masala-muted" />
      {/* Info area */}
      <div className="p-3 space-y-2">
        <div className="h-3.5 bg-masala-muted rounded-full w-3/4" />
        <div className="h-3 bg-masala-muted rounded-full w-1/3" />
        <div className="h-6 bg-masala-muted rounded-full w-1/2 mt-3" />
        <div className="h-3 bg-masala-muted/60 rounded-full w-2/5" />
        <div className="h-9 bg-masala-muted rounded-xl w-full mt-2" />
        <div className="h-8 bg-masala-muted/50 rounded-xl w-full" />
      </div>
    </div>
  );
}

// Grid of skeletons for Suspense fallbacks
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
